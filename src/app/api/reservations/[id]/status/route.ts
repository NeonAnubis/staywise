import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, canAccessHotel, hasMinimumRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const validTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  CANCELLED: [],
  NO_SHOW: [],
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
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        rooms: {
          include: { room: true }
        }
      }
    })

    if (!existingReservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, existingReservation.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate status transition
    const allowedStatuses = validTransitions[existingReservation.status]
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({
        error: `Cannot change status from ${existingReservation.status} to ${status}`
      }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { status }

    // Handle check-in
    if (status === 'CHECKED_IN') {
      updateData.actualCheckIn = new Date()

      // Update room statuses to OCCUPIED
      await prisma.room.updateMany({
        where: {
          id: { in: existingReservation.rooms.map(r => r.roomId) }
        },
        data: { status: 'OCCUPIED' }
      })
    }

    // Handle check-out
    if (status === 'CHECKED_OUT') {
      updateData.actualCheckOut = new Date()

      // Update room statuses to CLEANING
      await prisma.room.updateMany({
        where: {
          id: { in: existingReservation.rooms.map(r => r.roomId) }
        },
        data: { status: 'CLEANING' }
      })
    }

    // Handle cancellation or no-show - mark rooms as available
    if (status === 'CANCELLED' || status === 'NO_SHOW') {
      // Only update rooms if they were reserved for this specific reservation
      if (existingReservation.status === 'CONFIRMED') {
        await prisma.room.updateMany({
          where: {
            id: { in: existingReservation.rooms.map(r => r.roomId) },
            status: 'RESERVED'
          },
          data: { status: 'AVAILABLE' }
        })
      }
    }

    // Handle confirmation - mark rooms as reserved
    if (status === 'CONFIRMED') {
      await prisma.room.updateMany({
        where: {
          id: { in: existingReservation.rooms.map(r => r.roomId) },
          status: 'AVAILABLE'
        },
        data: { status: 'RESERVED' }
      })
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
    console.error('Failed to update reservation status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
