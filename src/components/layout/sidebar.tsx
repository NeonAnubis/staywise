'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  BedDouble,
  Calendar,
  Users,
  FileText,
  DollarSign,
  Settings,
  Hotel,
  Building2,
  UserCog,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const mainNavItems = [
    {
      href: '/dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
    },
    {
      href: '/rooms',
      label: t('nav.rooms'),
      icon: BedDouble,
    },
    {
      href: '/reservations',
      label: t('nav.reservations'),
      icon: Calendar,
    },
    {
      href: '/guests',
      label: t('nav.guests'),
      icon: Users,
    },
    {
      href: '/reports',
      label: t('nav.reports'),
      icon: FileText,
    },
    {
      href: '/financial',
      label: t('nav.financial'),
      icon: DollarSign,
    },
  ]

  const adminNavItems = [
    {
      href: '/hotels',
      label: t('nav.hotels'),
      icon: Building2,
      roles: ['SUPER_ADMIN'],
    },
    {
      href: '/users',
      label: t('nav.users'),
      icon: UserCog,
      roles: ['SUPER_ADMIN', 'HOTEL_ADMIN'],
    },
    {
      href: '/settings',
      label: t('nav.settings'),
      icon: Settings,
    },
  ]

  const filteredAdminItems = adminNavItems.filter((item) => {
    if (!item.roles) return true
    return user && item.roles.includes(user.role)
  })

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Hotel className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">
              {t('common.appName')}
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <Hotel className="h-8 w-8 text-primary mx-auto" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-1">
          {mainNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          ))}
        </div>

        {filteredAdminItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="px-3 space-y-1">
              {!collapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                  Admin
                </p>
              )}
              {filteredAdminItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
                    {!collapsed && <span>{item.label}</span>}
                  </Button>
                </Link>
              ))}
            </div>
          </>
        )}
      </ScrollArea>

      {/* Collapse button */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
