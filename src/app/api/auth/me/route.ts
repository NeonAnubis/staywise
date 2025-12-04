import { NextResponse } from 'next/server'
import { getCurrentUser, getUserById } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userPayload = await getCurrentUser()

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await getUserById(userPayload.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hotelId: user.hotelId,
        hotel: user.hotel ? {
          id: user.hotel.id,
          name: user.hotel.name,
          code: user.hotel.code
        } : null
      }
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
