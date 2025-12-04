import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, hasMinimumRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and HOTEL_ADMIN can view users
    if (!hasMinimumRole(currentUser, 'HOTEL_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const whereClause = currentUser.role === 'SUPER_ADMIN'
      ? {}
      : { hotelId: currentUser.hotelId }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Remove password from response
    const sanitizedUsers = users.map(({ password: _, ...user }) => {
      void _
      return user
    })

    return NextResponse.json({ users: sanitizedUsers })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and HOTEL_ADMIN can create users
    if (!hasMinimumRole(currentUser, 'HOTEL_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, phone, role, hotelId, isActive } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }

    // HOTEL_ADMIN can only create users for their hotel
    if (currentUser.role === 'HOTEL_ADMIN') {
      if (role === 'SUPER_ADMIN' || role === 'HOTEL_ADMIN') {
        return NextResponse.json(
          { error: 'Cannot create admin users' },
          { status: 403 }
        )
      }
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
        hotelId: role === 'SUPER_ADMIN' ? null : (hotelId || currentUser.hotelId),
        isActive: isActive ?? true,
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    // Remove password from response
    const { password: __, ...sanitizedUser } = user
    void __

    return NextResponse.json({ user: sanitizedUser }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
