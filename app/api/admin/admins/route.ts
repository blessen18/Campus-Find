import { NextResponse } from 'next/server'
import {
  getAllAdminCredentials,
  saveAdminCredential,
  removeAdminCredential,
  verifyAdminPassword,
} from '@/lib/serverStorage'
import { DEVELOPER_EMAIL } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const emailToCheck = searchParams.get('check_email')

    const admins = await getAllAdminCredentials()

    // If checking a specific email existence
    if (emailToCheck) {
      const match = admins.find(a => a.email.toLowerCase() === emailToCheck.trim().toLowerCase())
      return NextResponse.json({
        exists: !!match,
        isPrimary: match?.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase(),
      })
    }

    return NextResponse.json({
      success: true,
      admins: admins.map(a => ({
        email: a.email,
        password: a.password,
        assigned_at: a.assigned_at,
        assigned_by: a.assigned_by,
        isPrimary: a.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase(),
      })),
    })
  } catch (error) {
    console.error('Error fetching admin credentials:', error)
    return NextResponse.json({ error: 'Failed to retrieve admin list' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, callerEmail } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.trim().length < 4) {
      return NextResponse.json(
        { error: 'Assigned password must be at least 4 characters long' },
        { status: 400 }
      )
    }

    // Verify caller is primary developer or authorized admin
    const cleanCaller = (callerEmail || '').trim().toLowerCase()
    const admins = await getAllAdminCredentials()
    const isCallerAdmin =
      cleanCaller === DEVELOPER_EMAIL.toLowerCase() ||
      admins.some(a => a.email.toLowerCase() === cleanCaller)

    if (!isCallerAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Forbidden: Only primary administrator can assign credentials' },
        { status: 403 }
      )
    }

    const assignedBy = cleanCaller || 'Primary Administrator'
    const updated = await saveAdminCredential(email, password, assignedBy)

    return NextResponse.json({
      success: true,
      message: `Admin access and login password assigned for ${updated.email}`,
      admin: {
        email: updated.email,
        password: updated.password,
        assigned_at: updated.assigned_at,
        assigned_by: updated.assigned_by,
        isPrimary: updated.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('Error saving admin credential:', error)
    return NextResponse.json({ error: 'Failed to save admin credential' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { email, callerEmail } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const cleanCaller = (callerEmail || '').trim().toLowerCase()
    if (cleanCaller !== DEVELOPER_EMAIL.toLowerCase() && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Forbidden: Only primary administrator can revoke access' },
        { status: 403 }
      )
    }

    const removed = await removeAdminCredential(email)
    if (!removed) {
      return NextResponse.json(
        { error: 'Could not remove administrator. Primary authority cannot be deleted.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Revoked admin privileges for ${email}`,
    })
  } catch (error) {
    console.error('Error deleting admin credential:', error)
    return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 })
  }
}

