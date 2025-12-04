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
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    // Filter by hotel based on user role
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.hotelId) {
        return NextResponse.json({ rooms: [] })
      }
      where.hotelId = user.hotelId
    } else if (hotelId) {
      where.hotelId = hotelId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    where.isActive = true

    const rooms = await prisma.room.findMany({
      where,
      include: {
        roomType: true,
        hotel: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: [
        { floor: 'asc' },
        { number: 'asc' }
      ]
    })

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { number, floor, roomTypeId, status, notes, hotelId } = body

    // Determine which hotel to create the room for
    const targetHotelId = user.role === 'SUPER_ADMIN' ? hotelId : user.hotelId

    if (!targetHotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 })
    }

    if (!canAccessHotel(user, targetHotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if room number already exists in the hotel
    const existingRoom = await prisma.room.findUnique({
      where: {
        hotelId_number: {
          hotelId: targetHotelId,
          number
        }
      }
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room number already exists in this hotel' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        number,
        floor,
        roomTypeId,
        status: status || 'AVAILABLE',
        notes,
        hotelId: targetHotelId
      },
      include: {
        roomType: true,
        hotel: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error('Failed to create room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
