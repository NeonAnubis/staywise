import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, canAccessHotel } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        hotel: true,
        rooms: {
          include: {
            room: {
              include: {
                roomType: true
              }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: 'asc' }
        },
        charges: {
          orderBy: { createdAt: 'asc' }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, reservation.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate nights
    const checkIn = new Date(reservation.checkInDate)
    const checkOut = new Date(reservation.checkOutDate)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    // Generate daily rate breakdown
    const roomCharges = reservation.rooms.map(rr => {
      const dailyBreakdown = []
      for (let i = 0; i < nights; i++) {
        const date = new Date(checkIn)
        date.setDate(checkIn.getDate() + i)
        dailyBreakdown.push({
          date: date.toISOString().split('T')[0],
          rate: rr.dailyRate
        })
      }

      return {
        roomNumber: rr.room.number,
        roomType: rr.room.roomType.name,
        dailyRate: rr.dailyRate,
        nights,
        subtotal: rr.dailyRate * nights,
        dailyBreakdown
      }
    })

    // Summarize charges by category
    const chargesSummary = reservation.charges.reduce((acc, charge) => {
      const key = charge.category
      if (!acc[key]) {
        acc[key] = { category: key, items: [], total: 0 }
      }
      acc[key].items.push({
        description: charge.description,
        quantity: charge.quantity,
        unitPrice: charge.amount,
        total: charge.amount * charge.quantity,
        date: charge.createdAt
      })
      acc[key].total += charge.amount * charge.quantity
      return acc
    }, {} as Record<string, { category: string; items: unknown[]; total: number }>)

    // Payment history
    const payments = reservation.transactions.map(t => ({
      date: t.createdAt,
      type: t.type,
      method: t.paymentMethod,
      amount: t.amount,
      reference: t.reference,
      description: t.description
    }))

    // Calculate totals
    const roomTotal = roomCharges.reduce((sum, r) => sum + r.subtotal, 0)
    const chargesTotal = reservation.charges.reduce((sum, c) => sum + (c.amount * c.quantity), 0)
    const totalCharges = roomTotal + chargesTotal
    const totalPayments = reservation.transactions
      .filter(t => t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalRefunds = reservation.transactions
      .filter(t => t.type === 'REFUND')
      .reduce((sum, t) => sum + t.amount, 0)
    const balance = totalCharges - totalPayments + totalRefunds

    const statement = {
      // Header
      reservationCode: reservation.code,
      status: reservation.status,
      createdAt: reservation.createdAt,
      createdBy: `${reservation.createdBy.firstName} ${reservation.createdBy.lastName}`,

      // Hotel info
      hotel: {
        name: reservation.hotel.name,
        address: reservation.hotel.address,
        city: reservation.hotel.city,
        state: reservation.hotel.state,
        country: reservation.hotel.country,
        zipCode: reservation.hotel.zipCode,
        phone: reservation.hotel.phone,
        email: reservation.hotel.email
      },

      // Guest info
      guest: {
        name: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
        email: reservation.guest.email,
        phone: reservation.guest.phone,
        document: reservation.guest.document,
        documentType: reservation.guest.documentType
      },

      // Stay details
      stay: {
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        actualCheckIn: reservation.actualCheckIn,
        actualCheckOut: reservation.actualCheckOut,
        nights,
        adults: reservation.adults,
        children: reservation.children,
        specialRequests: reservation.specialRequests
      },

      // Room charges with daily breakdown
      roomCharges,
      roomTotal,

      // Additional charges
      additionalCharges: Object.values(chargesSummary),
      chargesTotal,

      // Payment history
      payments,

      // Summary
      summary: {
        subtotal: roomTotal,
        additionalCharges: chargesTotal,
        totalCharges,
        totalPayments,
        totalRefunds,
        balance,
        paymentStatus: balance <= 0 ? 'PAID' : (totalPayments > 0 ? 'PARTIAL' : 'PENDING')
      }
    }

    return NextResponse.json({ statement })
  } catch (error) {
    console.error('Failed to generate statement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
