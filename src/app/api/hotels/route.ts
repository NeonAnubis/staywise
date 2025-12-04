import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Non-super admins can only see their assigned hotel
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.hotelId) {
        return NextResponse.json({ hotels: [] })
      }

      const hotel = await prisma.hotel.findUnique({
        where: { id: user.hotelId, isActive: true }
      })

      return NextResponse.json({ hotels: hotel ? [hotel] : [] })
    }

    const hotels = await prisma.hotel.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ hotels })
  } catch (error) {
    console.error('Failed to fetch hotels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, address, city, state, country, zipCode, phone, email, description, imageUrl } = body

    // Check if hotel code already exists
    const existingHotel = await prisma.hotel.findUnique({
      where: { code }
    })

    if (existingHotel) {
      return NextResponse.json({ error: 'Hotel code already exists' }, { status: 400 })
    }

    const hotel = await prisma.hotel.create({
      data: {
        name,
        code,
        address,
        city,
        state,
        country: country || 'Brazil',
        zipCode,
        phone,
        email,
        description,
        imageUrl
      }
    })

    return NextResponse.json({ hotel }, { status: 201 })
  } catch (error) {
    console.error('Failed to create hotel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
