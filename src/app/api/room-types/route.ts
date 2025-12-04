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

    const where: Record<string, unknown> = {}

    // Filter by hotel based on user role
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.hotelId) {
        return NextResponse.json({ roomTypes: [] })
      }
      where.hotelId = user.hotelId
    } else if (hotelId) {
      where.hotelId = hotelId
    }

    const roomTypes = await prisma.roomType.findMany({
      where,
      include: {
        hotel: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { rooms: true }
        }
      },
      orderBy: { baseRate: 'asc' }
    })

    return NextResponse.json({ roomTypes })
  } catch (error) {
    console.error('Failed to fetch room types:', error)
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
    const { name, description, baseRate, maxOccupancy, amenities, hotelId } = body

    // Determine which hotel to create the room type for
    const targetHotelId = user.role === 'SUPER_ADMIN' ? hotelId : user.hotelId

    if (!targetHotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 })
    }

    if (!canAccessHotel(user, targetHotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const roomType = await prisma.roomType.create({
      data: {
        name,
        description,
        baseRate,
        maxOccupancy,
        amenities: amenities || [],
        hotelId: targetHotelId
      },
      include: {
        hotel: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json({ roomType }, { status: 201 })
  } catch (error) {
    console.error('Failed to create room type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
