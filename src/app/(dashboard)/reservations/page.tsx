'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit,
  MoreHorizontal,
  LogIn,
  LogOut,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Reservation {
  id: string
  code: string
  checkInDate: string
  checkOutDate: string
  actualCheckIn: string | null
  actualCheckOut: string | null
  adults: number
  children: number
  status: string
  totalAmount: number
  paidAmount: number
  guest: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string
  }
  rooms: {
    room: {
      number: string
      roomType: { name: string }
    }
    dailyRate: number
  }[]
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  CHECKED_IN: 'bg-green-500',
  CHECKED_OUT: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
  NO_SHOW: 'bg-orange-500',
}

export default function ReservationsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations')
      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || [])
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: 'Reservation status updated',
        })
        fetchReservations()
      } else {
        throw new Error('Failed to update status')
      }
    } catch {
      toast({
        title: t('common.error'),
        description: 'Failed to update reservation status',
        variant: 'destructive',
      })
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${reservation.guest.firstName} ${reservation.guest.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reservation.guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-5"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=2070&q=80)'
        }}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reservations.title')}</h1>
          <p className="text-muted-foreground">
            Manage guest reservations and bookings
          </p>
        </div>
        <Link href="/reservations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('reservations.new')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, guest name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">{t('reservations.statuses.pending')}</SelectItem>
                <SelectItem value="CONFIRMED">{t('reservations.statuses.confirmed')}</SelectItem>
                <SelectItem value="CHECKED_IN">{t('reservations.statuses.checkedIn')}</SelectItem>
                <SelectItem value="CHECKED_OUT">{t('reservations.statuses.checkedOut')}</SelectItem>
                <SelectItem value="CANCELLED">{t('reservations.statuses.cancelled')}</SelectItem>
                <SelectItem value="NO_SHOW">{t('reservations.statuses.noShow')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reservations.code')}</TableHead>
                <TableHead>{t('reservations.guest')}</TableHead>
                <TableHead>{t('reservations.room')}</TableHead>
                <TableHead>{t('reservations.checkIn')}</TableHead>
                <TableHead>{t('reservations.checkOut')}</TableHead>
                <TableHead>{t('reservations.totalAmount')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">{reservation.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {reservation.guest.firstName} {reservation.guest.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.guest.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {reservation.rooms.map((r, idx) => (
                      <div key={idx}>
                        Room {r.room.number}
                        <span className="text-muted-foreground text-sm ml-1">
                          ({r.room.roomType.name})
                        </span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{reservation.checkInDate}</TableCell>
                  <TableCell>{reservation.checkOutDate}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${reservation.totalAmount}</p>
                      {reservation.paidAmount < reservation.totalAmount && (
                        <p className="text-sm text-muted-foreground">
                          Paid: ${reservation.paidAmount}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusColors[reservation.status]} text-white`}
                    >
                      {reservation.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {reservation.status === 'CONFIRMED' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(reservation.id, 'CHECKED_IN')}
                          >
                            <LogIn className="mr-2 h-4 w-4" />
                            {t('reservations.actions.checkIn')}
                          </DropdownMenuItem>
                        )}
                        {reservation.status === 'CHECKED_IN' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(reservation.id, 'CHECKED_OUT')}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {t('reservations.actions.checkOut')}
                          </DropdownMenuItem>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(reservation.status) && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                            className="text-destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            {t('reservations.actions.cancel')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReservations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t('common.noResults')}</h3>
              <p className="text-muted-foreground">
                No reservations found matching your criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
