'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BedDouble,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Plus,
  LogIn,
  LogOut,
  Building2,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  occupancyRate: number
  todayCheckIns: number
  todayCheckOuts: number
  pendingReservations: number
  totalRevenue: number
  monthlyRevenue: number
  availableRooms: number
  occupiedRooms: number
  recentReservations: {
    id: string
    code: string
    guestName: string
    rooms: string
    checkIn: string
    checkOut: string
    status: string
    totalAmount: number
  }[]
  roomStatus: {
    available: number
    occupied: number
    maintenance: number
    cleaning: number
    reserved: number
    total: number
  }
}

interface ChainStats {
  hotels: {
    id: string
    name: string
    code: string
    totalRooms: number
    occupiedRooms: number
    occupancyRate: number
    monthlyRevenue: number
    monthlyReservations: number
    activeReservations: number
  }[]
  totals: {
    totalRooms: number
    monthlyRevenue: number
    monthlyReservations: number
    activeReservations: number
    averageOccupancy: number
  }
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chainStats, setChainStats] = useState<ChainStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch main stats
        const statsResponse = await fetch('/api/dashboard/stats')
        if (statsResponse.ok) {
          const data = await statsResponse.json()
          setStats(data.stats)
        }

        // Fetch chain stats for super admin
        if (user?.role === 'SUPER_ADMIN') {
          const chainResponse = await fetch('/api/dashboard/chain')
          if (chainResponse.ok) {
            const data = await chainResponse.json()
            setChainStats(data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.role])


  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    CONFIRMED: 'bg-blue-500',
    CHECKED_IN: 'bg-green-500',
    CHECKED_OUT: 'bg-gray-500',
    CANCELLED: 'bg-red-500',
  }

  const roomStatusColors: Record<string, string> = {
    available: 'bg-green-500',
    occupied: 'bg-blue-500',
    maintenance: 'bg-orange-500',
    cleaning: 'bg-yellow-500',
    reserved: 'bg-purple-500',
  }

  // Use fetched stats or fallback to defaults
  const displayStats = stats || {
    occupancyRate: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    pendingReservations: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    recentReservations: [],
    roomStatus: {
      available: 0,
      occupied: 0,
      maintenance: 0,
      cleaning: 0,
      reserved: 0,
      total: 0,
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcome')}, {user?.firstName}!
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reservations">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.newReservation')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">
              {t('dashboard.occupancyRate')}
            </CardTitle>
            <BedDouble className="h-5 w-5 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{displayStats.occupancyRate}%</div>
            <div className="flex items-center text-sm text-blue-100">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              {displayStats.occupiedRooms} of {displayStats.roomStatus.total} rooms
            </div>
            <Progress value={displayStats.occupancyRate} className="mt-3 bg-blue-400" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-100">
              {t('dashboard.todayCheckIns')}
            </CardTitle>
            <LogIn className="h-5 w-5 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{displayStats.todayCheckIns}</div>
            <div className="flex items-center text-sm text-green-100">
              <Calendar className="mr-1 h-4 w-4" />
              Scheduled for today
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">
              {t('dashboard.todayCheckOuts')}
            </CardTitle>
            <LogOut className="h-5 w-5 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{displayStats.todayCheckOuts}</div>
            <div className="flex items-center text-sm text-orange-100">
              <Calendar className="mr-1 h-4 w-4" />
              Scheduled for today
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">
              {t('dashboard.monthlyRevenue')}
            </CardTitle>
            <DollarSign className="h-5 w-5 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${displayStats.monthlyRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-sm text-purple-100">
              <TrendingUp className="mr-1 h-4 w-4" />
              Total: ${displayStats.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chain Overview for Super Admin */}
      {user?.role === 'SUPER_ADMIN' && chainStats && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t('dashboard.chainOverview')}
                </CardTitle>
                <CardDescription>{t('dashboard.hotelComparison')}</CardDescription>
              </div>
              <Link href="/reports">
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t('nav.reports')}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('hotels.name')}</TableHead>
                  <TableHead className="text-center">{t('rooms.title')}</TableHead>
                  <TableHead className="text-center">{t('dashboard.occupancyRate')}</TableHead>
                  <TableHead className="text-center">{t('reservations.title')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.monthlyRevenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chainStats.hotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{hotel.name}</p>
                          <p className="text-xs text-muted-foreground">{hotel.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {hotel.occupiedRooms}/{hotel.totalRooms}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={hotel.occupancyRate} className="w-16 h-2" />
                        <span className="text-sm font-medium">{hotel.occupancyRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {hotel.activeReservations} active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${hotel.monthlyRevenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-center">{chainStats.totals.totalRooms}</TableCell>
                  <TableCell className="text-center">{chainStats.totals.averageOccupancy}% avg</TableCell>
                  <TableCell className="text-center">{chainStats.totals.activeReservations} active</TableCell>
                  <TableCell className="text-right">${chainStats.totals.monthlyRevenue.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Reservations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.recentReservations')}</CardTitle>
                <CardDescription>Latest booking activities</CardDescription>
              </div>
              <Link href="/reservations">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {displayStats.recentReservations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reservations.code')}</TableHead>
                    <TableHead>{t('reservations.guest')}</TableHead>
                    <TableHead>{t('reservations.room')}</TableHead>
                    <TableHead>{t('reservations.checkIn')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayStats.recentReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        {reservation.code}
                      </TableCell>
                      <TableCell>{reservation.guestName}</TableCell>
                      <TableCell>Room {reservation.rooms}</TableCell>
                      <TableCell>
                        {new Date(reservation.checkIn).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${statusColors[reservation.status]} text-white`}
                        >
                          {reservation.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('common.noResults')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.roomStatus')}</CardTitle>
            <CardDescription>Current room availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(displayStats.roomStatus)
              .filter(([key]) => key !== 'total')
              .map(([status, count]) => (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${roomStatusColors[status]}`} />
                      <span className="capitalize">{t(`rooms.statuses.${status}`)}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress
                    value={displayStats.roomStatus.total > 0 ? (count / displayStats.roomStatus.total) * 100 : 0}
                    className="h-2"
                  />
                </div>
              ))}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Rooms</span>
                <span className="font-bold">{displayStats.roomStatus.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          <CardDescription>Frequently used operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/reservations">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span>{t('dashboard.newReservation')}</span>
              </Button>
            </Link>
            <Link href="/reservations?status=CONFIRMED">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <LogIn className="h-6 w-6" />
                <span>{t('dashboard.checkIn')}</span>
              </Button>
            </Link>
            <Link href="/reservations?status=CHECKED_IN">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <LogOut className="h-6 w-6" />
                <span>{t('dashboard.checkOut')}</span>
              </Button>
            </Link>
            <Link href="/guests">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>{t('guests.add')}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
