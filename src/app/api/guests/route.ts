import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hasMinimumRole } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { document: { contains: search } },
      ]
    }

    const guests = await prisma.guest.findMany({
      where,
      include: {
        _count: {
          select: { reservations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Failed to fetch guests:', error)
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
      firstName,
      lastName,
      email,
      phone,
      document,
      documentType,
      nationality,
      address,
      city,
      state,
      country,
      birthDate,
      notes,
    } = body

    // Check if document already exists
    const existingGuest = await prisma.guest.findUnique({
      where: { document }
    })

    if (existingGuest) {
      return NextResponse.json({ error: 'Guest with this document already exists' }, { status: 400 })
    }

    const guest = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone,
        document,
        documentType: documentType || 'CPF',
        nationality: nationality || 'Brazilian',
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'Brazil',
        birthDate: birthDate ? new Date(birthDate) : null,
        notes: notes || null,
      }
    })

    return NextResponse.json({ guest }, { status: 201 })
  } catch (error) {
    console.error('Failed to create guest:', error)

    // Handle unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined
        if (target?.includes('document')) {
          return NextResponse.json({ error: 'A guest with this document number already exists' }, { status: 400 })
        }
        if (target?.includes('email')) {
          return NextResponse.json({ error: 'A guest with this email already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'A guest with these details already exists' }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
