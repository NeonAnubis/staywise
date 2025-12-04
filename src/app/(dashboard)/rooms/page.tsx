'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  Filter,
  BedDouble,
  Edit,
  Trash2,
  MoreHorizontal,
  Tag,
  Users,
  DollarSign,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Room {
  id: string
  number: string
  floor: number
  status: string
  notes: string | null
  roomType: {
    id: string
    name: string
    baseRate: number
    maxOccupancy: number
  }
  hotel: {
    id: string
    name: string
  }
}

interface RoomType {
  id: string
  name: string
  description?: string
  baseRate: number
  maxOccupancy: number
  amenities?: string[]
  hotel?: {
    id: string
    name: string
  }
  _count?: {
    rooms: number
  }
}

interface Hotel {
  id: string
  name: string
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  OCCUPIED: 'bg-blue-500',
  MAINTENANCE: 'bg-orange-500',
  CLEANING: 'bg-yellow-500',
  RESERVED: 'bg-purple-500',
}

export default function RoomsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    number: '',
    floor: 1,
    roomTypeId: '',
    status: 'AVAILABLE',
    notes: '',
    hotelId: '',
  })

  // Room Type management state
  const [isRoomTypeDialogOpen, setIsRoomTypeDialogOpen] = useState(false)
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null)
  const [roomTypeFormData, setRoomTypeFormData] = useState({
    name: '',
    description: '',
    baseRate: 0,
    maxOccupancy: 1,
    hotelId: '',
  })

  useEffect(() => {
    fetchRooms()
    fetchRoomTypes()
    fetchHotels()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async (hotelId?: string) => {
    try {
      const url = hotelId ? `/api/room-types?hotelId=${hotelId}` : '/api/room-types'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRoomTypes(data.roomTypes || [])
      }
    } catch (error) {
      console.error('Failed to fetch room types:', error)
    }
  }

  const fetchHotels = async () => {
    try {
      const response = await fetch('/api/hotels')
      if (response.ok) {
        const data = await response.json()
        setHotels(data.hotels || [])
      }
    } catch (error) {
      console.error('Failed to fetch hotels:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms'
      const method = editingRoom ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: editingRoom ? 'Room updated successfully' : 'Room created successfully',
        })
        setIsDialogOpen(false)
        setEditingRoom(null)
        resetForm()
        fetchRooms()
      } else {
        const data = await response.json()
        toast({
          title: t('common.error'),
          description: data.error || 'Failed to save room',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('common.error'),
        description: 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: 'Room deleted successfully',
        })
        fetchRooms()
      } else {
        toast({
          title: t('common.error'),
          description: 'Failed to delete room',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('common.error'),
        description: 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      number: room.number,
      floor: room.floor,
      roomTypeId: room.roomType.id,
      status: room.status,
      notes: room.notes || '',
      hotelId: room.hotel.id,
    })
    fetchRoomTypes(room.hotel.id)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      number: '',
      floor: 1,
      roomTypeId: '',
      status: 'AVAILABLE',
      notes: '',
      hotelId: '',
    })
  }

  // Room Type CRUD functions
  const handleRoomTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingRoomType ? `/api/room-types/${editingRoomType.id}` : '/api/room-types'
      const method = editingRoomType ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomTypeFormData),
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: editingRoomType ? t('rooms.types.updateSuccess') : t('rooms.types.createSuccess'),
        })
        setIsRoomTypeDialogOpen(false)
        setEditingRoomType(null)
        resetRoomTypeForm()
        fetchRoomTypes()
      } else {
        const data = await response.json()
        toast({
          title: t('common.error'),
          description: data.error || t('rooms.types.saveError'),
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('errors.generic'),
        variant: 'destructive',
      })
    }
  }

  const handleRoomTypeDelete = async (roomTypeId: string) => {
    if (!confirm(t('rooms.types.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/room-types/${roomTypeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('rooms.types.deleteSuccess'),
        })
        fetchRoomTypes()
      } else {
        const data = await response.json()
        toast({
          title: t('common.error'),
          description: data.error || t('rooms.types.deleteError'),
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('errors.generic'),
        variant: 'destructive',
      })
    }
  }

  const handleRoomTypeEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType)
    setRoomTypeFormData({
      name: roomType.name,
      description: roomType.description || '',
      baseRate: roomType.baseRate,
      maxOccupancy: roomType.maxOccupancy,
      hotelId: roomType.hotel?.id || '',
    })
    setIsRoomTypeDialogOpen(true)
  }

  const resetRoomTypeForm = () => {
    setRoomTypeFormData({
      name: '',
      description: '',
      baseRate: 0,
      maxOccupancy: 1,
      hotelId: '',
    })
  }

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomType.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-5"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=2070&q=80)'
        }}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('rooms.title')}</h1>
        <p className="text-muted-foreground">
          {t('rooms.pageDescription')}
        </p>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            {t('rooms.roomList')}
          </TabsTrigger>
          <TabsTrigger value="room-types" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t('rooms.types.title')}
          </TabsTrigger>
        </TabsList>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-6">
          {/* Room Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingRoom(null)
              resetForm()
            }
          }}>
            <div className="flex justify-end">
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('rooms.addRoom')}
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRoom ? t('rooms.editRoom') : t('rooms.addRoom')}
                </DialogTitle>
                <DialogDescription>
                  {editingRoom ? t('rooms.editRoomDescription') : t('rooms.addRoomDescription')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">{t('rooms.roomNumber')}</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="101"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floor">{t('rooms.floor')}</Label>
                      <Input
                        id="floor"
                        type="number"
                        min={1}
                        value={formData.floor}
                        onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hotel">{t('rooms.hotel')}</Label>
                    <Select
                      value={formData.hotelId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, hotelId: value, roomTypeId: '' })
                        fetchRoomTypes(value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('rooms.selectHotel')} />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            {hotel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomType">{t('rooms.roomType')}</Label>
                    <Select
                      value={formData.roomTypeId}
                      onValueChange={(value) => setFormData({ ...formData, roomTypeId: value })}
                      disabled={!formData.hotelId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.hotelId ? t('rooms.selectRoomType') : t('rooms.selectHotelFirst')} />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} - ${type.baseRate}/night
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('rooms.status')}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">{t('rooms.statuses.available')}</SelectItem>
                        <SelectItem value="OCCUPIED">{t('rooms.statuses.occupied')}</SelectItem>
                        <SelectItem value="MAINTENANCE">{t('rooms.statuses.maintenance')}</SelectItem>
                        <SelectItem value="CLEANING">{t('rooms.statuses.cleaning')}</SelectItem>
                        <SelectItem value="RESERVED">{t('rooms.statuses.reserved')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('rooms.notes')}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('rooms.notesPlaceholder')}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('rooms.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={t('rooms.filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="AVAILABLE">{t('rooms.statuses.available')}</SelectItem>
                    <SelectItem value="OCCUPIED">{t('rooms.statuses.occupied')}</SelectItem>
                    <SelectItem value="MAINTENANCE">{t('rooms.statuses.maintenance')}</SelectItem>
                    <SelectItem value="CLEANING">{t('rooms.statuses.cleaning')}</SelectItem>
                    <SelectItem value="RESERVED">{t('rooms.statuses.reserved')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Rooms Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <div className={`h-2 ${statusColors[room.status]}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold">
                      {t('rooms.room')} {room.number}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(room)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(room.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{room.roomType.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('rooms.floor')}</span>
                    <span className="font-medium">{room.floor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('rooms.capacity')}</span>
                    <span className="font-medium">{room.roomType.maxOccupancy} {t('rooms.guests')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('rooms.dailyRate')}</span>
                    <span className="font-bold text-primary">${room.roomType.baseRate}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${statusColors[room.status]} text-white w-full justify-center`}
                  >
                    {t(`rooms.statuses.${room.status.toLowerCase()}`)}
                  </Badge>
                  {room.notes && (
                    <p className="text-xs text-muted-foreground italic">{room.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <BedDouble className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t('common.noResults')}</h3>
                <p className="text-muted-foreground">
                  {t('rooms.noRoomsFound')}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Room Types Tab */}
        <TabsContent value="room-types" className="space-y-6">
          {/* Room Type Dialog */}
          <Dialog open={isRoomTypeDialogOpen} onOpenChange={(open) => {
            setIsRoomTypeDialogOpen(open)
            if (!open) {
              setEditingRoomType(null)
              resetRoomTypeForm()
            }
          }}>
            <div className="flex justify-end">
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('rooms.types.addType')}
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRoomType ? t('rooms.types.editType') : t('rooms.types.addType')}
                </DialogTitle>
                <DialogDescription>
                  {editingRoomType ? t('rooms.types.editTypeDescription') : t('rooms.types.addTypeDescription')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRoomTypeSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomTypeName">{t('rooms.types.name')}</Label>
                    <Input
                      id="roomTypeName"
                      value={roomTypeFormData.name}
                      onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, name: e.target.value })}
                      placeholder={t('rooms.types.namePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomTypeHotel">{t('rooms.hotel')}</Label>
                    <Select
                      value={roomTypeFormData.hotelId}
                      onValueChange={(value) => setRoomTypeFormData({ ...roomTypeFormData, hotelId: value })}
                      disabled={!!editingRoomType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('rooms.selectHotel')} />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            {hotel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseRate">{t('rooms.types.baseRate')}</Label>
                      <Input
                        id="baseRate"
                        type="number"
                        min={0}
                        step="0.01"
                        value={roomTypeFormData.baseRate}
                        onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, baseRate: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxOccupancy">{t('rooms.types.maxOccupancy')}</Label>
                      <Input
                        id="maxOccupancy"
                        type="number"
                        min={1}
                        value={roomTypeFormData.maxOccupancy}
                        onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, maxOccupancy: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomTypeDescription">{t('rooms.types.description')}</Label>
                    <Textarea
                      id="roomTypeDescription"
                      value={roomTypeFormData.description}
                      onChange={(e) => setRoomTypeFormData({ ...roomTypeFormData, description: e.target.value })}
                      placeholder={t('rooms.types.descriptionPlaceholder')}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsRoomTypeDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Room Types Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('rooms.types.title')}</CardTitle>
              <CardDescription>{t('rooms.types.tableDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('rooms.types.name')}</TableHead>
                    <TableHead>{t('rooms.hotel')}</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {t('rooms.types.baseRate')}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" />
                        {t('rooms.types.maxOccupancy')}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">{t('rooms.types.roomCount')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomTypes.length > 0 ? (
                    roomTypes.map((roomType) => (
                      <TableRow key={roomType.id}>
                        <TableCell className="font-medium">{roomType.name}</TableCell>
                        <TableCell>{roomType.hotel?.name || '-'}</TableCell>
                        <TableCell className="text-center">${roomType.baseRate}</TableCell>
                        <TableCell className="text-center">{roomType.maxOccupancy}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{roomType._count?.rooms || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRoomTypeEdit(roomType)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoomTypeDelete(roomType.id)}
                                className="text-destructive"
                                disabled={(roomType._count?.rooms || 0) > 0}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Tag className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">{t('rooms.types.noTypes')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
