'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Building2,
  MapPin,
  Phone,
  Mail,
  Edit,
  MoreHorizontal,
  BedDouble,
  Users,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Hotel {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  phone: string
  email: string
  description: string | null
  imageUrl: string | null
  _count?: {
    rooms: number
    users: number
    reservations: number
  }
}

export default function HotelsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'Brazil',
    zipCode: '',
    phone: '',
    email: '',
    description: '',
  })

  useEffect(() => {
    fetchHotels()
  }, [])

  const fetchHotels = async () => {
    try {
      const response = await fetch('/api/hotels')
      if (response.ok) {
        const data = await response.json()
        setHotels(data.hotels || [])
      }
    } catch (error) {
      console.error('Failed to fetch hotels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingHotel ? `/api/hotels/${editingHotel.id}` : '/api/hotels'
      const method = editingHotel ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: editingHotel ? 'Hotel updated successfully' : 'Hotel created successfully',
        })
        setIsDialogOpen(false)
        setEditingHotel(null)
        resetForm()
        fetchHotels()
      } else {
        const data = await response.json()
        toast({
          title: t('common.error'),
          description: data.error || 'Failed to save hotel',
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

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel)
    setFormData({
      name: hotel.name,
      code: hotel.code,
      address: hotel.address,
      city: hotel.city,
      state: hotel.state,
      country: hotel.country,
      zipCode: hotel.zipCode,
      phone: hotel.phone,
      email: hotel.email,
      description: hotel.description || '',
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: 'Brazil',
      zipCode: '',
      phone: '',
      email: '',
      description: '',
    })
  }

  // Only super admins can access this page
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Only Super Administrators can manage hotels.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-5"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2070&q=80)'
        }}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('hotels.title')}</h1>
          <p className="text-muted-foreground">
            Manage your hotel chain properties
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingHotel(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('hotels.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingHotel ? t('hotels.edit') : t('hotels.add')}
              </DialogTitle>
              <DialogDescription>
                {editingHotel ? 'Update hotel information' : 'Add a new hotel to the chain'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('hotels.name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">{t('hotels.code')}</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="GH-SP"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t('hotels.address')}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('hotels.city')}</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">{t('hotels.state')}</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">{t('hotels.zipCode')}</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('hotels.phone')}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('hotels.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('hotels.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
      </div>

      {/* Hotels Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <Card key={hotel.id} className="overflow-hidden">
            <div
              className="h-48 bg-cover bg-center"
              style={{
                backgroundImage: hotel.imageUrl
                  ? `url(${hotel.imageUrl})`
                  : 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80)'
              }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{hotel.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{hotel.code}</Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(hotel)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {hotel.description && (
                <CardDescription className="line-clamp-2">
                  {hotel.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{hotel.city}, {hotel.state}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{hotel.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{hotel.email}</span>
              </div>
              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{hotel._count?.rooms || 0}</span>
                  <span className="text-xs text-muted-foreground">rooms</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{hotel._count?.users || 0}</span>
                  <span className="text-xs text-muted-foreground">staff</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
