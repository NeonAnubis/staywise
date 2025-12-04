import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const TOKEN_NAME = 'auth-token'

export interface UserPayload {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  hotelId: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload
    // Validate that the decoded token has required fields
    if (!decoded || !decoded.id || !decoded.email) {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_NAME)?.value
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const token = await getAuthCookie()
  if (!token) return null
  return verifyToken(token)
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { hotel: true }
  })
}

export function canAccessHotel(user: UserPayload, hotelId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true
  return user.hotelId === hotelId
}

export function hasPermission(user: UserPayload, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(user.role)
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 5,
  HOTEL_ADMIN: 4,
  MANAGER: 3,
  RECEPTIONIST: 2,
  STAFF: 1
}

export function hasMinimumRole(user: UserPayload, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole]
}
