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

    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        hotel: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { rooms: true }
        }
      }
    })

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, roomType.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ roomType })
  } catch (error) {
    console.error('Failed to fetch room type:', error)
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

    if (!hasMinimumRole(user, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existingRoomType = await prisma.roomType.findUnique({
      where: { id }
    })

    if (!existingRoomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, existingRoomType.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, baseRate, maxOccupancy, amenities } = body

    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
        name,
        description,
        baseRate,
        maxOccupancy,
        amenities: amenities || []
      },
      include: {
        hotel: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json({ roomType })
  } catch (error) {
    console.error('Failed to update room type:', error)
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

    const existingRoomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rooms: true }
        }
      }
    })

    if (!existingRoomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, existingRoomType.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if there are rooms using this room type
    if (existingRoomType._count.rooms > 0) {
      return NextResponse.json(
        { error: 'Cannot delete room type with existing rooms' },
        { status: 400 }
      )
    }

    await prisma.roomType.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete room type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
