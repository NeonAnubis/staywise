'use client'

import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Save,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  HOTEL_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  RECEPTIONIST: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  STAFF: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const handleProfileSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('profile.updateSuccess'),
        })
        await refreshUser()
        setIsEditing(false)
      } else {
        const data = await response.json()
        toast({
          title: t('common.error'),
          description: data.error || t('profile.updateError'),
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('profile.updateError'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const validatePassword = () => {
    const errors: string[] = []

    if (!passwordData.currentPassword) {
      errors.push(t('profile.currentPasswordRequired'))
    }

    if (!passwordData.newPassword) {
      errors.push(t('profile.newPasswordRequired'))
    } else if (passwordData.newPassword.length < 6) {
      errors.push(t('profile.passwordMinLength'))
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.push(t('auth.passwordMismatch'))
    }

    setPasswordErrors(errors)
    return errors.length === 0
  }

  const handlePasswordChange = async () => {
    if (!validatePassword()) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('profile.passwordChangeSuccess'),
        })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setPasswordErrors([])
      } else {
        const data = await response.json()
        toast({
          title: t('common.error'),
          description: data.error || t('profile.passwordChangeError'),
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('profile.passwordChangeError'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-5"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=2070&q=80)'
        }}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground">
          {t('profile.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <Badge className={`mt-3 ${roleColors[user.role] || ''}`}>
                <Shield className="mr-1 h-3 w-3" />
                {t(`users.roles.${user.role.toLowerCase().replace('_', '')}`) || user.role}
              </Badge>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('auth.email')}</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('users.hotel')}</p>
                  <p className="font-medium">{user.hotel?.name || t('profile.allHotels')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.memberSince')}</p>
                  <p className="font-medium">{t('profile.member')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile & Password Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('profile.personalInfo')}
                  </CardTitle>
                  <CardDescription>
                    {t('profile.personalInfoDesc')}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    {t('common.edit')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={isEditing ? profileData.firstName : user.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={isEditing ? profileData.lastName : user.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                />
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t('profile.emailCannotChange')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleProfileSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? t('common.loading') : t('common.save')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setProfileData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: '',
                      })
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('profile.changePassword')}
              </CardTitle>
              <CardDescription>
                {t('profile.changePasswordDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordErrors.length > 0 && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </p>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('profile.passwordRequirements')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('profile.passwordsMatch')}
                  </p>
                )}
              </div>

              <Button onClick={handlePasswordChange} disabled={isSaving}>
                <Lock className="mr-2 h-4 w-4" />
                {isSaving ? t('common.loading') : t('profile.updatePassword')}
              </Button>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('profile.accountInfo')}
              </CardTitle>
              <CardDescription>
                {t('profile.accountInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground">{t('users.role')}</p>
                  <p className="font-semibold mt-1">
                    {t(`users.roles.${user.role.toLowerCase().replace('_', '')}`) || user.role}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground">{t('users.hotel')}</p>
                  <p className="font-semibold mt-1">
                    {user.hotel?.name || t('profile.allHotels')}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground">{t('common.status')}</p>
                  <p className="font-semibold mt-1 text-green-600 dark:text-green-400">
                    {t('profile.active')}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground">{t('profile.accountId')}</p>
                  <p className="font-mono text-sm mt-1 truncate">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
