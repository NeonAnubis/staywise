'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Skeleton } from '@/components/ui/skeleton'

interface Hotel {
  id: string
  name: string
  code: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string>('all')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
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

    if (user) {
      fetchHotels()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r bg-card p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="h-16 border-b flex items-center justify-between px-6">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          selectedHotel={selectedHotel}
          onHotelChange={setSelectedHotel}
          hotels={hotels}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
