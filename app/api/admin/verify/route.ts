import { NextResponse } from 'next/server'
import { verifyAdminPassword } from '@/lib/serverStorage'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { valid: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await verifyAdminPassword(email, password)
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 401 })
    }

    return NextResponse.json({ valid: true, isPrimary: result.isPrimary })
  } catch (error) {
    console.error('Error verifying admin credentials:', error)
    return NextResponse.json(
      { valid: false, error: 'Authentication verification service error' },
      { status: 500 }
    )
  }
}

