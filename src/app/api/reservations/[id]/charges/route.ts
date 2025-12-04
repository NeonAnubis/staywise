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
      select: { hotelId: true }
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, reservation.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const charges = await prisma.charge.findMany({
      where: { reservationId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ charges })
  } catch (error) {
    console.error('Failed to fetch charges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
    const { description, amount, quantity, category } = body

    if (!description || !amount) {
      return NextResponse.json({ error: 'Description and amount are required' }, { status: 400 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id }
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (!canAccessHotel(user, reservation.hotelId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cannot add charges to cancelled or checked out reservations
    if (['CANCELLED', 'CHECKED_OUT'].includes(reservation.status)) {
      return NextResponse.json({ error: 'Cannot add charges to completed reservations' }, { status: 400 })
    }

    const charge = await prisma.charge.create({
      data: {
        description,
        amount,
        quantity: quantity || 1,
        category: category || 'OTHER',
        reservationId: id
      }
    })

    // Update reservation total amount
    const chargeTotal = amount * (quantity || 1)
    await prisma.reservation.update({
      where: { id },
      data: {
        totalAmount: { increment: chargeTotal }
      }
    })

    return NextResponse.json({ charge }, { status: 201 })
  } catch (error) {
    console.error('Failed to add charge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
