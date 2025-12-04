import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, canAccessHotel, hasMinimumRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasMinimumRole(user, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'occupancy'
    const hotelId = searchParams.get('hotelId')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    // Default to current month
    const now = new Date()
    const startDate = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = endDateStr ? new Date(endDateStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Determine hotel filter
    let hotelFilter: { hotelId?: string } = {}
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.hotelId) {
        return NextResponse.json({ report: null })
      }
      hotelFilter = { hotelId: user.hotelId }
    } else if (hotelId) {
      hotelFilter = { hotelId }
    }

    let report: Record<string, unknown> = {}

    switch (type) {
      case 'occupancy':
        report = await generateOccupancyReport(hotelFilter, startDate, endDate)
        break
      case 'revenue':
        report = await generateRevenueReport(hotelFilter, startDate, endDate)
        break
      case 'reservations':
        report = await generateReservationsReport(hotelFilter, startDate, endDate)
        break
      case 'financial':
        report = await generateFinancialReport(hotelFilter, startDate, endDate)
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateOccupancyReport(
  hotelFilter: { hotelId?: string },
  startDate: Date,
  endDate: Date
) {
  // Get total rooms
  const totalRooms = await prisma.room.count({
    where: { ...hotelFilter, isActive: true }
  })

  // Get reservations in date range
  const reservations = await prisma.reservation.findMany({
    where: {
      ...hotelFilter,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
      OR: [
        {
          checkInDate: { gte: startDate, lte: endDate }
        },
        {
          checkOutDate: { gte: startDate, lte: endDate }
        },
        {
          checkInDate: { lte: startDate },
          checkOutDate: { gte: endDate }
        }
      ]
    },
    include: {
      rooms: true
    }
  })

  // Calculate daily occupancy
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const dailyOccupancy: { date: string; occupancy: number; roomsOccupied: number }[] = []

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)

    let roomsOccupied = 0
    reservations.forEach(res => {
      const checkIn = new Date(res.checkInDate)
      const checkOut = new Date(res.checkOutDate)

      if (currentDate >= checkIn && currentDate < checkOut) {
        roomsOccupied += res.rooms.length
      }
    })

    dailyOccupancy.push({
      date: currentDate.toISOString().split('T')[0],
      occupancy: totalRooms > 0 ? Math.round((roomsOccupied / totalRooms) * 100) : 0,
      roomsOccupied
    })
  }

  // Calculate averages
  const averageOccupancy = dailyOccupancy.length > 0
    ? Math.round(dailyOccupancy.reduce((sum, d) => sum + d.occupancy, 0) / dailyOccupancy.length)
    : 0

  // Occupancy by day of week
  const weekdayOccupancy = [0, 0, 0, 0, 0, 0, 0]
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]

  dailyOccupancy.forEach(d => {
    const dayOfWeek = new Date(d.date).getDay()
    weekdayOccupancy[dayOfWeek] += d.occupancy
    weekdayCounts[dayOfWeek]++
  })

  const occupancyByDayOfWeek = weekdayOccupancy.map((total, i) =>
    weekdayCounts[i] > 0 ? Math.round(total / weekdayCounts[i]) : 0
  )

  return {
    type: 'occupancy',
    period: { startDate, endDate },
    totalRooms,
    averageOccupancy,
    dailyOccupancy,
    occupancyByDayOfWeek,
    peakOccupancy: Math.max(...dailyOccupancy.map(d => d.occupancy)),
    lowestOccupancy: Math.min(...dailyOccupancy.map(d => d.occupancy))
  }
}

async function generateRevenueReport(
  hotelFilter: { hotelId?: string },
  startDate: Date,
  endDate: Date
) {
  // Get transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      ...hotelFilter,
      createdAt: { gte: startDate, lte: endDate }
    }
  })

  const payments = transactions.filter(t => t.type === 'PAYMENT')
  const refunds = transactions.filter(t => t.type === 'REFUND')

  const totalRevenue = payments.reduce((sum, t) => sum + t.amount, 0)
  const totalRefunds = refunds.reduce((sum, t) => sum + t.amount, 0)
  const netRevenue = totalRevenue - totalRefunds

  // Revenue by payment method
  const revenueByMethod: Record<string, number> = {}
  payments.forEach(t => {
    revenueByMethod[t.paymentMethod] = (revenueByMethod[t.paymentMethod] || 0) + t.amount
  })

  // Daily revenue
  const dailyRevenue: { date: string; revenue: number }[] = []
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + 1)

    const dayPayments = payments.filter(t => {
      const tDate = new Date(t.createdAt)
      return tDate >= currentDate && tDate < nextDate
    })

    dailyRevenue.push({
      date: currentDate.toISOString().split('T')[0],
      revenue: dayPayments.reduce((sum, t) => sum + t.amount, 0)
    })
  }

  // Revenue by hotel (if super admin viewing all)
  let revenueByHotel: { hotelId: string; hotelName: string; revenue: number }[] = []
  if (!hotelFilter.hotelId) {
    const hotelRevenue = await prisma.transaction.groupBy({
      by: ['hotelId'],
      where: {
        type: 'PAYMENT',
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })

    const hotels = await prisma.hotel.findMany({
      where: { id: { in: hotelRevenue.map(h => h.hotelId) } },
      select: { id: true, name: true }
    })

    revenueByHotel = hotelRevenue.map(hr => ({
      hotelId: hr.hotelId,
      hotelName: hotels.find(h => h.id === hr.hotelId)?.name || 'Unknown',
      revenue: hr._sum.amount || 0
    }))
  }

  return {
    type: 'revenue',
    period: { startDate, endDate },
    totalRevenue,
    totalRefunds,
    netRevenue,
    transactionCount: transactions.length,
    averageTransaction: payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0,
    revenueByMethod,
    dailyRevenue,
    revenueByHotel
  }
}

async function generateReservationsReport(
  hotelFilter: { hotelId?: string },
  startDate: Date,
  endDate: Date
) {
  const reservations = await prisma.reservation.findMany({
    where: {
      ...hotelFilter,
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      rooms: true,
      guest: {
        select: { firstName: true, lastName: true }
      }
    }
  })

  // Status breakdown
  const statusCounts: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    CHECKED_IN: 0,
    CHECKED_OUT: 0,
    CANCELLED: 0,
    NO_SHOW: 0
  }

  reservations.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
  })

  // Average stay duration
  const completedReservations = reservations.filter(r =>
    ['CHECKED_OUT'].includes(r.status)
  )

  let averageStay = 0
  if (completedReservations.length > 0) {
    const totalNights = completedReservations.reduce((sum, r) => {
      const nights = Math.ceil(
        (new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      return sum + nights
    }, 0)
    averageStay = Math.round((totalNights / completedReservations.length) * 10) / 10
  }

  // Revenue from reservations
  const totalAmount = reservations.reduce((sum, r) => sum + r.totalAmount, 0)
  const paidAmount = reservations.reduce((sum, r) => sum + r.paidAmount, 0)

  // Daily reservation creation
  const dailyReservations: { date: string; count: number }[] = []
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + 1)

    const dayReservations = reservations.filter(r => {
      const rDate = new Date(r.createdAt)
      return rDate >= currentDate && rDate < nextDate
    })

    dailyReservations.push({
      date: currentDate.toISOString().split('T')[0],
      count: dayReservations.length
    })
  }

  return {
    type: 'reservations',
    period: { startDate, endDate },
    totalReservations: reservations.length,
    statusBreakdown: statusCounts,
    averageStay,
    totalAmount,
    paidAmount,
    outstandingAmount: totalAmount - paidAmount,
    averageReservationValue: reservations.length > 0
      ? Math.round(totalAmount / reservations.length)
      : 0,
    dailyReservations,
    cancellationRate: reservations.length > 0
      ? Math.round((statusCounts.CANCELLED / reservations.length) * 100)
      : 0,
    noShowRate: reservations.length > 0
      ? Math.round((statusCounts.NO_SHOW / reservations.length) * 100)
      : 0
  }
}

async function generateFinancialReport(
  hotelFilter: { hotelId?: string },
  startDate: Date,
  endDate: Date
) {
  // Combine revenue and reservation financial data
  const transactions = await prisma.transaction.findMany({
    where: {
      ...hotelFilter,
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      reservation: {
        select: { code: true }
      }
    }
  })

  const reservations = await prisma.reservation.findMany({
    where: {
      ...hotelFilter,
      createdAt: { gte: startDate, lte: endDate }
    }
  })

  const charges = await prisma.charge.findMany({
    where: {
      reservation: hotelFilter
    }
  })

  // Transaction summary
  const payments = transactions.filter(t => t.type === 'PAYMENT')
  const refunds = transactions.filter(t => t.type === 'REFUND')
  const adjustments = transactions.filter(t => t.type === 'ADJUSTMENT')

  // Charges by category
  const chargesByCategory: Record<string, number> = {}
  charges.forEach(c => {
    chargesByCategory[c.category] = (chargesByCategory[c.category] || 0) + (c.amount * c.quantity)
  })

  // Payment status breakdown
  const paymentStatusCounts: Record<string, number> = {}
  reservations.forEach(r => {
    let status = 'PENDING'
    if (r.paidAmount >= r.totalAmount) {
      status = 'PAID'
    } else if (r.paidAmount > 0) {
      status = 'PARTIAL'
    }
    paymentStatusCounts[status] = (paymentStatusCounts[status] || 0) + 1
  })

  return {
    type: 'financial',
    period: { startDate, endDate },
    summary: {
      totalPayments: payments.reduce((sum, t) => sum + t.amount, 0),
      totalRefunds: refunds.reduce((sum, t) => sum + t.amount, 0),
      totalAdjustments: adjustments.reduce((sum, t) => sum + t.amount, 0),
      netRevenue: payments.reduce((sum, t) => sum + t.amount, 0) - refunds.reduce((sum, t) => sum + t.amount, 0)
    },
    transactionCounts: {
      payments: payments.length,
      refunds: refunds.length,
      adjustments: adjustments.length
    },
    reservationFinancials: {
      totalBilled: reservations.reduce((sum, r) => sum + r.totalAmount, 0),
      totalCollected: reservations.reduce((sum, r) => sum + r.paidAmount, 0),
      outstanding: reservations.reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0)
    },
    paymentStatusBreakdown: paymentStatusCounts,
    chargesByCategory,
    averagePaymentAmount: payments.length > 0
      ? Math.round(payments.reduce((sum, t) => sum + t.amount, 0) / payments.length)
      : 0
  }
}

// POST to save/generate a report
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasMinimumRole(user, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, startDate, endDate, hotelId } = body

    // Validate hotel access
    if (hotelId && !canAccessHotel(user, hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetHotelId = user.role === 'SUPER_ADMIN' ? hotelId : user.hotelId

    // Generate report data
    const hotelFilter = targetHotelId ? { hotelId: targetHotelId } : {}
    const start = new Date(startDate)
    const end = new Date(endDate)

    let reportData: Record<string, unknown> = {}

    switch (type) {
      case 'occupancy':
        reportData = await generateOccupancyReport(hotelFilter, start, end)
        break
      case 'revenue':
        reportData = await generateRevenueReport(hotelFilter, start, end)
        break
      case 'reservations':
        reportData = await generateReservationsReport(hotelFilter, start, end)
        break
      case 'financial':
        reportData = await generateFinancialReport(hotelFilter, start, end)
        break
    }

    // Save report
    const report = await prisma.report.create({
      data: {
        type,
        startDate: start,
        endDate: end,
        data: reportData as object,
        hotelId: targetHotelId
      }
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Failed to create report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
