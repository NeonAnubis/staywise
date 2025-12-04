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

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true,
        hotel: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, room.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Failed to fetch room:', error)
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
    const { number, floor, roomTypeId, status, notes } = body

    const existingRoom = await prisma.room.findUnique({
      where: { id }
    })

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, existingRoom.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if new room number conflicts with another room
    if (number !== existingRoom.number) {
      const conflictingRoom = await prisma.room.findUnique({
        where: {
          hotelId_number: {
            hotelId: existingRoom.hotelId,
            number
          }
        }
      })

      if (conflictingRoom && conflictingRoom.id !== id) {
        return NextResponse.json({ error: 'Room number already exists' }, { status: 400 })
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        number,
        floor,
        roomTypeId,
        status,
        notes
      },
      include: {
        roomType: true,
        hotel: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Failed to update room:', error)
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

    const existingRoom = await prisma.room.findUnique({
      where: { id }
    })

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, existingRoom.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    await prisma.room.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
