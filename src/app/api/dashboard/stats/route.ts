import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotelId')

    // Determine which hotel(s) to query
    let hotelFilter: { hotelId?: string } = {}
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.hotelId) {
        return NextResponse.json({ stats: null })
      }
      hotelFilter = { hotelId: user.hotelId }
    } else if (hotelId) {
      hotelFilter = { hotelId }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Get room counts by status
    const roomStatusCounts = await prisma.room.groupBy({
      by: ['status'],
      where: {
        ...hotelFilter,
        isActive: true
      },
      _count: { id: true }
    })

    const roomStats = {
      available: 0,
      occupied: 0,
      maintenance: 0,
      cleaning: 0,
      reserved: 0,
      total: 0
    }

    roomStatusCounts.forEach(item => {
      const status = item.status.toLowerCase() as keyof typeof roomStats
      roomStats[status] = item._count.id
      roomStats.total += item._count.id
    })

    // Calculate occupancy rate
    const occupancyRate = roomStats.total > 0
      ? Math.round((roomStats.occupied / roomStats.total) * 100)
      : 0

    // Today's check-ins (reservations with check-in date today and status CONFIRMED)
    const todayCheckIns = await prisma.reservation.count({
      where: {
        ...hotelFilter,
        checkInDate: {
          gte: today,
          lt: tomorrow
        },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] }
      }
    })

    // Today's check-outs (reservations with check-out date today and status CHECKED_IN)
    const todayCheckOuts = await prisma.reservation.count({
      where: {
        ...hotelFilter,
        checkOutDate: {
          gte: today,
          lt: tomorrow
        },
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }
      }
    })

    // Pending reservations
    const pendingReservations = await prisma.reservation.count({
      where: {
        ...hotelFilter,
        status: 'PENDING'
      }
    })

    // Monthly revenue
    const monthlyTransactions = await prisma.transaction.aggregate({
      where: {
        ...hotelFilter,
        type: 'PAYMENT',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { amount: true }
    })

    const monthlyRevenue = monthlyTransactions._sum.amount || 0

    // Total revenue (all time)
    const totalTransactions = await prisma.transaction.aggregate({
      where: {
        ...hotelFilter,
        type: 'PAYMENT'
      },
      _sum: { amount: true }
    })

    const totalRevenue = totalTransactions._sum.amount || 0

    // Recent reservations
    const recentReservations = await prisma.reservation.findMany({
      where: hotelFilter,
      include: {
        guest: {
          select: { firstName: true, lastName: true }
        },
        rooms: {
          include: {
            room: {
              select: { number: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const stats = {
      occupancyRate,
      todayCheckIns,
      todayCheckOuts,
      pendingReservations,
      totalRevenue,
      monthlyRevenue,
      availableRooms: roomStats.available,
      occupiedRooms: roomStats.occupied,
      roomStatus: roomStats,
      recentReservations: recentReservations.map(r => ({
        id: r.id,
        code: r.code,
        guestName: `${r.guest.firstName} ${r.guest.lastName}`,
        rooms: r.rooms.map(rr => rr.room.number).join(', '),
        checkIn: r.checkInDate,
        checkOut: r.checkOutDate,
        status: r.status,
        totalAmount: r.totalAmount
      }))
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
