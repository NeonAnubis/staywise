import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, canAccessHotel, hasMinimumRole } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotelId')
    const status = searchParams.get('status')
    const guestId = searchParams.get('guestId')

    const where: Record<string, unknown> = {}

    // Filter by hotel based on user role
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.hotelId) {
        return NextResponse.json({ reservations: [] })
      }
      where.hotelId = user.hotelId
    } else if (hotelId) {
      where.hotelId = hotelId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (guestId) {
      where.guestId = guestId
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        guest: true,
        hotel: {
          select: { id: true, name: true, code: true }
        },
        rooms: {
          include: {
            room: {
              include: {
                roomType: true
              }
            }
          }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ reservations })
  } catch (error) {
    console.error('Failed to fetch reservations:', error)
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
      guestId,
      hotelId,
      roomIds,
      checkInDate,
      checkOutDate,
      adults,
      children,
      notes,
      specialRequests,
    } = body

    // Determine which hotel to create the reservation for
    const targetHotelId = user.role === 'SUPER_ADMIN' ? hotelId : user.hotelId

    if (!targetHotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 })
    }

    if (!canAccessHotel(user, targetHotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check room availability
    const rooms = await prisma.room.findMany({
      where: {
        id: { in: roomIds },
        hotelId: targetHotelId,
        isActive: true
      },
      include: {
        roomType: true
      }
    })

    if (rooms.length !== roomIds.length) {
      return NextResponse.json({ error: 'Some rooms are not available' }, { status: 400 })
    }

    // Check for conflicts
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)

    const conflictingReservations = await prisma.reservationRoom.findMany({
      where: {
        roomId: { in: roomIds },
        reservation: {
          status: { notIn: ['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'] },
          OR: [
            {
              checkInDate: { lte: checkOut },
              checkOutDate: { gte: checkIn }
            }
          ]
        }
      }
    })

    if (conflictingReservations.length > 0) {
      return NextResponse.json({ error: 'Some rooms have conflicting reservations' }, { status: 400 })
    }

    // Calculate total amount
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const totalAmount = rooms.reduce((sum, room) => sum + room.roomType.baseRate * nights, 0)

    // Generate reservation code
    const date = new Date()
    const code = `RES-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${uuidv4().substring(0, 6).toUpperCase()}`

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        code,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: adults || 1,
        children: children || 0,
        status: 'PENDING',
        totalAmount,
        notes,
        specialRequests,
        guestId,
        hotelId: targetHotelId,
        createdById: user.id,
        rooms: {
          create: rooms.map((room) => ({
            roomId: room.id,
            dailyRate: room.roomType.baseRate
          }))
        }
      },
      include: {
        guest: true,
        hotel: {
          select: { id: true, name: true, code: true }
        },
        rooms: {
          include: {
            room: {
              include: {
                roomType: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (error) {
    console.error('Failed to create reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
