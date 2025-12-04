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

    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotelId')
    const type = searchParams.get('type')
    const reservationId = searchParams.get('reservationId')

    const where: Record<string, unknown> = {}

    // Filter by hotel based on user role
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.hotelId) {
        return NextResponse.json({ transactions: [] })
      }
      where.hotelId = user.hotelId
    } else if (hotelId) {
      where.hotelId = hotelId
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (reservationId) {
      where.reservationId = reservationId
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        reservation: {
          include: {
            guest: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        hotel: {
          select: { id: true, name: true, code: true }
        },
        processedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasMinimumRole(user, 'RECEPTIONIST')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      amount,
      type,
      paymentMethod,
      reference,
      description,
      reservationId,
      hotelId,
    } = body

    // Determine which hotel the transaction belongs to
    let targetHotelId = hotelId

    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId }
      })

      if (!reservation) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
      }

      targetHotelId = reservation.hotelId

      if (!canAccessHotel(user, targetHotelId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      targetHotelId = user.role === 'SUPER_ADMIN' ? hotelId : user.hotelId

      if (!targetHotelId) {
        return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 })
      }

      if (!canAccessHotel(user, targetHotelId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: 'PAID',
        reference,
        description,
        reservationId: reservationId || null,
        hotelId: targetHotelId,
        processedById: user.id
      },
      include: {
        reservation: {
          include: {
            guest: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        hotel: {
          select: { id: true, name: true, code: true }
        },
        processedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    // Update reservation paid amount if linked to a reservation
    if (reservationId && type === 'PAYMENT') {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          paidAmount: {
            increment: amount
          }
        }
      })
    } else if (reservationId && type === 'REFUND') {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          paidAmount: {
            decrement: amount
          }
        }
      })
    }

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
