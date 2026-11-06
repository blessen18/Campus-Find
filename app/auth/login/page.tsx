'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, BookOpen } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { setClientSession, getClientUser } from '@/lib/auth'
import type { Profile } from '@/types'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router  = useRouter()
  const { success } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password')
      return
    }
    setError('')
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    // Simulate login delay
    await new Promise(r => setTimeout(r, 500))

    // Check existing local user or create session
    const existingUser = getClientUser()
    const activeProfile: Profile = existingUser && existingUser.email === cleanEmail ? existingUser : {
      id: 'usr-campus-' + Date.now(),
      full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: cleanEmail,
      role: cleanEmail.includes('admin') ? 'admin' : 'student',
      department: 'Computer Science & Engineering',
      student_id: 'AJCE-CS-2401',
      phone: null,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setClientSession(activeProfile)
    success('Welcome back!', `Signed in as ${activeProfile.full_name}`)
    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  const fillDemo = () => {
    setEmail('blessen@ajce.edu.in')
    setPassword('Campus@2026!')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-slate-50">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto shadow-sm mb-1">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to CampusFind</h1>
          <p className="text-sm text-slate-500">Access your reports and claims</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@ajce.edu.in"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide" htmlFor="password">
                  Password
                </label>
                <Link href="/auth/reset-password" className="text-xs text-blue-600 hover:underline font-medium">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(o => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={fillDemo}
              className="w-full text-center text-xs text-slate-400 hover:text-blue-600 font-medium py-1 transition-colors"
            >
              Use demo credentials
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
            New here?{' '}
            <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
