import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, hasMinimumRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // HOTEL_ADMIN can only view users from their hotel
    if (currentUser.role === 'HOTEL_ADMIN' && user.hotelId !== currentUser.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Remove password from response
    const { password: _, ...sanitizedUser } = user
    void _

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!hasMinimumRole(currentUser, 'HOTEL_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { email, password, firstName, lastName, phone, role, hotelId, isActive } = body

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // HOTEL_ADMIN can only update users from their hotel
    if (currentUser.role === 'HOTEL_ADMIN' && existingUser.hotelId !== currentUser.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // HOTEL_ADMIN cannot promote users to admin roles
    if (currentUser.role === 'HOTEL_ADMIN' && (role === 'SUPER_ADMIN' || role === 'HOTEL_ADMIN')) {
      return NextResponse.json(
        { error: 'Cannot assign admin roles' },
        { status: 403 }
      )
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email },
      })

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {
      email: email || existingUser.email,
      firstName: firstName || existingUser.firstName,
      lastName: lastName || existingUser.lastName,
      phone: phone !== undefined ? phone : existingUser.phone,
      role: role || existingUser.role,
      hotelId: role === 'SUPER_ADMIN' ? null : (hotelId !== undefined ? hotelId : existingUser.hotelId),
      isActive: isActive !== undefined ? isActive : existingUser.isActive,
    }

    // Only update password if provided
    if (password) {
      updateData.password = await hashPassword(password)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!hasMinimumRole(currentUser, 'HOTEL_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Cannot delete yourself
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // HOTEL_ADMIN can only delete users from their hotel
    if (currentUser.role === 'HOTEL_ADMIN' && existingUser.hotelId !== currentUser.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // HOTEL_ADMIN cannot delete other admins
    if (currentUser.role === 'HOTEL_ADMIN' &&
        (existingUser.role === 'SUPER_ADMIN' || existingUser.role === 'HOTEL_ADMIN')) {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
