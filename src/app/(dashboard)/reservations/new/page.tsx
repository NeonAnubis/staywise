'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Search,
  Plus,
  User,
  Calendar,
  BedDouble,
  Users,
  DollarSign,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  document: string
  documentType: string
}

interface RoomType {
  id: string
  name: string
  baseRate: number
  maxOccupancy: number
}

interface Room {
  id: string
  number: string
  floor: number
  status: string
  roomType: RoomType
  hotel: {
    id: string
    name: string
  }
}

interface Hotel {
  id: string
  name: string
  code: string
}

export default function NewReservationPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()

  // Form state
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([])
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [notes, setNotes] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [selectedHotelId, setSelectedHotelId] = useState('')

  // Data state
  const [guests, setGuests] = useState<Guest[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [guestSearchOpen, setGuestSearchOpen] = useState(false)
  const [guestSearch, setGuestSearch] = useState('')
  const [newGuestOpen, setNewGuestOpen] = useState(false)
  const [error, setError] = useState('')

  // New guest form
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    document: '',
    documentType: 'PASSPORT',
  })

  // Fetch hotels for super admin
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetch('/api/hotels')
        .then(res => res.json())
        .then(data => {
          setHotels(data.hotels || [])
          if (data.hotels?.length > 0 && !selectedHotelId) {
            setSelectedHotelId(data.hotels[0].id)
          }
        })
        .catch(console.error)
    }
  }, [user?.role, selectedHotelId])

  // Fetch available rooms when dates change
  const fetchRooms = useCallback(async () => {
    if (!checkInDate || !checkOutDate) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedHotelId) {
        params.append('hotelId', selectedHotelId)
      }
      const response = await fetch(`/api/rooms?${params}`)
      const data = await response.json()
      setRooms(data.rooms || [])
    } catch {
      console.error('Failed to fetch rooms')
    } finally {
      setLoading(false)
    }
  }, [checkInDate, checkOutDate, selectedHotelId])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // Search guests
  const searchGuests = async (query: string) => {
    if (!query.trim()) {
      setGuests([])
      return
    }

    try {
      const response = await fetch(`/api/guests?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      setGuests(data.guests || [])
    } catch {
      console.error('Failed to search guests')
    }
  }

  // Create new guest
  const handleCreateGuest = async () => {
    if (!newGuest.firstName || !newGuest.lastName) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedGuest(data.guest)
        setNewGuestOpen(false)
        setNewGuest({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          document: '',
          documentType: 'PASSPORT',
        })
      }
    } catch {
      console.error('Failed to create guest')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle room selection
  const toggleRoom = (room: Room) => {
    const isSelected = selectedRooms.some(r => r.id === room.id)
    if (isSelected) {
      setSelectedRooms(selectedRooms.filter(r => r.id !== room.id))
    } else {
      setSelectedRooms([...selectedRooms, room])
    }
  }

  // Calculate total
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0
    const start = new Date(checkInDate)
    const end = new Date(checkOutDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const calculateTotal = () => {
    const nights = calculateNights()
    return selectedRooms.reduce((sum, room) => sum + room.roomType.baseRate * nights, 0)
  }

  // Submit reservation
  const handleSubmit = async () => {
    setError('')

    if (!selectedGuest) {
      setError(t('reservations.selectGuest') || 'Please select a guest')
      return
    }
    if (selectedRooms.length === 0) {
      setError(t('reservations.selectRoom') || 'Please select at least one room')
      return
    }
    if (!checkInDate || !checkOutDate) {
      setError(t('reservations.selectDates') || 'Please select check-in and check-out dates')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: selectedGuest.id,
          hotelId: selectedHotelId || undefined,
          roomIds: selectedRooms.map(r => r.id),
          checkInDate,
          checkOutDate,
          adults,
          children,
          notes,
          specialRequests,
        }),
      })

      if (response.ok) {
        router.push('/reservations')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create reservation')
      }
    } catch {
      setError('Failed to create reservation')
    } finally {
      setSubmitting(false)
    }
  }

  const nights = calculateNights()
  const total = calculateTotal()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reservations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('reservations.new')}</h1>
          <p className="text-muted-foreground">
            Create a new reservation for a guest
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hotel Selection (Super Admin only) */}
          {user?.role === 'SUPER_ADMIN' && hotels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5" />
                  Select Hotel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name} ({hotel.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Guest Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('reservations.guest')}
              </CardTitle>
              <CardDescription>
                Select an existing guest or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedGuest ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {selectedGuest.firstName} {selectedGuest.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedGuest.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedGuest.phone}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedGuest(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setGuestSearchOpen(true)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Guest
                  </Button>
                  <Button variant="outline" onClick={() => setNewGuestOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Guest
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Stay Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">{t('reservations.checkIn')}</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={checkInDate}
                    onChange={e => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">{t('reservations.checkOut')}</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={checkOutDate}
                    onChange={e => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              {nights > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Room Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5" />
                {t('reservations.room')}
              </CardTitle>
              <CardDescription>
                Select rooms for this reservation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {checkInDate && checkOutDate
                    ? 'No rooms available for the selected dates'
                    : 'Select check-in and check-out dates to see available rooms'}
                </p>
              ) : (
                <div className="space-y-2">
                  {rooms.filter(r => r.status === 'AVAILABLE').map(room => {
                    const isSelected = selectedRooms.some(r => r.id === room.id)
                    return (
                      <div
                        key={room.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleRoom(room)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-5 w-5 rounded border flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="font-medium">Room {room.number}</p>
                            <p className="text-sm text-muted-foreground">
                              {room.roomType.name} - Floor {room.floor}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${room.roomType.baseRate.toLocaleString()}/night
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Max {room.roomType.maxOccupancy} guests
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guests Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guest Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adults">{t('reservations.adults')}</Label>
                  <Input
                    id="adults"
                    type="number"
                    min={1}
                    value={adults}
                    onChange={e => setAdults(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children">{t('reservations.children')}</Label>
                  <Input
                    id="children"
                    type="number"
                    min={0}
                    value={children}
                    onChange={e => setChildren(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialRequests">{t('reservations.specialRequests')}</Label>
                <Textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="Early check-in, late check-out, room preferences..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes for staff only..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Reservation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Guest */}
              <div>
                <p className="text-sm text-muted-foreground">{t('reservations.guest')}</p>
                <p className="font-medium">
                  {selectedGuest
                    ? `${selectedGuest.firstName} ${selectedGuest.lastName}`
                    : 'Not selected'}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reservations.checkIn')}</p>
                  <p className="font-medium">
                    {checkInDate
                      ? new Date(checkInDate).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('reservations.checkOut')}</p>
                  <p className="font-medium">
                    {checkOutDate
                      ? new Date(checkOutDate).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Nights */}
              <div>
                <p className="text-sm text-muted-foreground">{t('reservations.nights')}</p>
                <p className="font-medium">{nights || '-'}</p>
              </div>

              {/* Rooms */}
              <div>
                <p className="text-sm text-muted-foreground">Rooms</p>
                {selectedRooms.length > 0 ? (
                  <div className="space-y-1">
                    {selectedRooms.map(room => (
                      <div key={room.id} className="flex justify-between">
                        <span>Room {room.number}</span>
                        <span>${(room.roomType.baseRate * nights).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium">No rooms selected</p>
                )}
              </div>

              {/* Guests */}
              <div>
                <p className="text-sm text-muted-foreground">Guests</p>
                <p className="font-medium">
                  {adults} {adults === 1 ? 'adult' : 'adults'}
                  {children > 0 && `, ${children} ${children === 1 ? 'child' : 'children'}`}
                </p>
              </div>

              <hr />

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t('common.total')}</span>
                <span>${total.toLocaleString()}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || !selectedGuest || selectedRooms.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Reservation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Guest Search Dialog */}
      <Dialog open={guestSearchOpen} onOpenChange={setGuestSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Guest</DialogTitle>
            <DialogDescription>
              Search for an existing guest by name, email, or phone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-10"
                value={guestSearch}
                onChange={e => {
                  setGuestSearch(e.target.value)
                  searchGuests(e.target.value)
                }}
              />
            </div>
            {guests.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map(guest => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">
                        {guest.firstName} {guest.lastName}
                      </TableCell>
                      <TableCell>{guest.email}</TableCell>
                      <TableCell>{guest.phone}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedGuest(guest)
                            setGuestSearchOpen(false)
                            setGuestSearch('')
                            setGuests([])
                          }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {guestSearch && guests.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No guests found. Try a different search or create a new guest.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Guest Dialog */}
      <Dialog open={newGuestOpen} onOpenChange={setNewGuestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('guests.add')}</DialogTitle>
            <DialogDescription>
              Create a new guest profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newFirstName">{t('guests.firstName')} *</Label>
                <Input
                  id="newFirstName"
                  value={newGuest.firstName}
                  onChange={e => setNewGuest({ ...newGuest, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLastName">{t('guests.lastName')} *</Label>
                <Input
                  id="newLastName"
                  value={newGuest.lastName}
                  onChange={e => setNewGuest({ ...newGuest, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">{t('guests.email')}</Label>
              <Input
                id="newEmail"
                type="email"
                value={newGuest.email}
                onChange={e => setNewGuest({ ...newGuest, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPhone">{t('guests.phone')}</Label>
              <Input
                id="newPhone"
                value={newGuest.phone}
                onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newDocType">{t('guests.documentType')}</Label>
                <Select
                  value={newGuest.documentType}
                  onValueChange={value => setNewGuest({ ...newGuest, documentType: value })}
                >
                  <SelectTrigger id="newDocType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="ID_CARD">ID Card</SelectItem>
                    <SelectItem value="DRIVERS_LICENSE">Driver&apos;s License</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDocument">{t('guests.document')}</Label>
                <Input
                  id="newDocument"
                  value={newGuest.document}
                  onChange={e => setNewGuest({ ...newGuest, document: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGuestOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateGuest}
              disabled={submitting || !newGuest.firstName || !newGuest.lastName}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
