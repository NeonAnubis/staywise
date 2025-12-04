import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can see chain-wide comparison
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Get all active hotels
    const hotels = await prisma.hotel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true }
    })

    const hotelStats = await Promise.all(
      hotels.map(async (hotel) => {
        // Room counts
        const roomStatusCounts = await prisma.room.groupBy({
          by: ['status'],
          where: {
            hotelId: hotel.id,
            isActive: true
          },
          _count: { id: true }
        })

        let totalRooms = 0
        let occupiedRooms = 0
        roomStatusCounts.forEach(item => {
          totalRooms += item._count.id
          if (item.status === 'OCCUPIED') {
            occupiedRooms = item._count.id
          }
        })

        const occupancyRate = totalRooms > 0
          ? Math.round((occupiedRooms / totalRooms) * 100)
          : 0

        // Monthly revenue
        const monthlyRevenue = await prisma.transaction.aggregate({
          where: {
            hotelId: hotel.id,
            type: 'PAYMENT',
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          _sum: { amount: true }
        })

        // Monthly reservations
        const monthlyReservations = await prisma.reservation.count({
          where: {
            hotelId: hotel.id,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        })

        // Active reservations (checked in)
        const activeReservations = await prisma.reservation.count({
          where: {
            hotelId: hotel.id,
            status: 'CHECKED_IN'
          }
        })

        return {
          id: hotel.id,
          name: hotel.name,
          code: hotel.code,
          totalRooms,
          occupiedRooms,
          occupancyRate,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          monthlyReservations,
          activeReservations
        }
      })
    )

    // Calculate totals
    const totals = {
      totalRooms: hotelStats.reduce((sum, h) => sum + h.totalRooms, 0),
      occupiedRooms: hotelStats.reduce((sum, h) => sum + h.occupiedRooms, 0),
      monthlyRevenue: hotelStats.reduce((sum, h) => sum + h.monthlyRevenue, 0),
      monthlyReservations: hotelStats.reduce((sum, h) => sum + h.monthlyReservations, 0),
      activeReservations: hotelStats.reduce((sum, h) => sum + h.activeReservations, 0)
    }

    totals.occupiedRooms = totals.totalRooms > 0
      ? Math.round((totals.occupiedRooms / totals.totalRooms) * 100)
      : 0

    return NextResponse.json({
      hotels: hotelStats,
      totals: {
        ...totals,
        averageOccupancy: totals.occupiedRooms // This is now the percentage
      }
    })
  } catch (error) {
    console.error('Failed to fetch chain stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
