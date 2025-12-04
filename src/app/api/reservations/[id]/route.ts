import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, canAccessHotel, hasMinimumRole } from '@/lib/auth'

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
        transactions: {
          orderBy: { createdAt: 'desc' }
        },
        charges: {
          orderBy: { createdAt: 'desc' }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, reservation.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error('Failed to fetch reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasMinimumRole(user, 'RECEPTIONIST')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { checkInDate, checkOutDate, adults, children, notes, specialRequests } = body

    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { rooms: true }
    })

    if (!existingReservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, existingReservation.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cannot edit checked out or cancelled reservations
    if (['CHECKED_OUT', 'CANCELLED'].includes(existingReservation.status)) {
      return NextResponse.json({ error: 'Cannot edit completed or cancelled reservations' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (checkInDate) updateData.checkInDate = new Date(checkInDate)
    if (checkOutDate) updateData.checkOutDate = new Date(checkOutDate)
    if (adults !== undefined) updateData.adults = adults
    if (children !== undefined) updateData.children = children
    if (notes !== undefined) updateData.notes = notes
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests

    // Recalculate total if dates changed
    if (checkInDate || checkOutDate) {
      const newCheckIn = new Date(checkInDate || existingReservation.checkInDate)
      const newCheckOut = new Date(checkOutDate || existingReservation.checkOutDate)
      const nights = Math.ceil((newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24))

      const totalAmount = existingReservation.rooms.reduce((sum, room) => sum + room.dailyRate * nights, 0)
      updateData.totalAmount = totalAmount
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error('Failed to update reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasMinimumRole(user, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existingReservation = await prisma.reservation.findUnique({
      where: { id }
    })

    if (!existingReservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, existingReservation.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete related records first
    await prisma.reservationRoom.deleteMany({ where: { reservationId: id } })
    await prisma.charge.deleteMany({ where: { reservationId: id } })
    await prisma.transaction.updateMany({
      where: { reservationId: id },
      data: { reservationId: null }
    })

    await prisma.reservation.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
