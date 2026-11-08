'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, BookOpen, Code2, GraduationCap } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { setClientSession, getClientUser } from '@/lib/auth'
import { isAjceEmail, isDeveloperEmail, DEVELOPER_EMAIL } from '@/lib/utils'
import type { Profile } from '@/types'

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'student' | 'developer'>('student')
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

    const cleanEmail = email.trim().toLowerCase()

    // Check if user is either primary developer or whitelisted developer
    let isWhitelistedDev = isDeveloperEmail(cleanEmail)
    if (!isWhitelistedDev && typeof window !== 'undefined') {
      try {
        const rawList = localStorage.getItem('campusfind_developer_whitelist')
        if (rawList) {
          const devs = JSON.parse(rawList) as string[]
          if (Array.isArray(devs) && devs.map(d => d.toLowerCase()).includes(cleanEmail)) {
            isWhitelistedDev = true
          }
        }
      } catch (e) {}
    }

    if (loginType === 'developer') {
      if (!isWhitelistedDev) {
        setError(`Access denied. Developer login is restricted to authorized developer accounts (${DEVELOPER_EMAIL}).`)
        return
      }
    } else {
      if (!isAjceEmail(cleanEmail) && !isWhitelistedDev) {
        setError('Please use your official Amal Jyothi email (e.g. yourname2030@cs.ajce.in)')
        return
      }
    }
    setError('')
    setLoading(true)

    // Simulate login delay
    await new Promise(r => setTimeout(r, 500))

    const isDev = isWhitelistedDev

    // Check existing local user or create session
    const existingUser = getClientUser()
    const activeProfile: Profile = existingUser && existingUser.email === cleanEmail ? {
      ...existingUser,
      role: isDev ? 'admin' : existingUser.role,
    } : {
      id: isDev ? ('usr-dev-' + cleanEmail.split('@')[0]) : ('usr-campus-' + Date.now()),
      full_name: isDev 
        ? (cleanEmail === DEVELOPER_EMAIL.toLowerCase() ? 'Blesson Unnikrishnan (Lead Dev)' : `Developer (${cleanEmail.split('@')[0]})`)
        : cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: cleanEmail,
      role: isDev ? 'admin' : 'student',
      department: 'Computer Science & Engineering',
      student_id: isDev ? 'DEV-AJCE-01' : 'AJCE-CS-2401',
      phone: null,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setClientSession(activeProfile)
    success('Welcome back!', isDev ? 'Developer session established' : `Signed in as ${activeProfile.full_name}`)
    setLoading(false)

    if (isDev) {
      // Open the master developer console in a clean dedicated tab/window
      window.open('/admin', '_blank')
      router.push('/dashboard')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  const fillDemoStudent = () => {
    setLoginType('student')
    setEmail('blessenunnikrishnan2030@cs.ajce.in')
    setPassword('Campus@2026!')
    setError('')
  }

  const fillDemoDev = () => {
    setLoginType('developer')
    setEmail('blessenunnikrishnan@gmail.com')
    setPassword('DevCampus@2026!')
    setError('')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-slate-50">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white mx-auto shadow-sm mb-1 transition-colors ${loginType === 'developer' ? 'bg-slate-900 ring-2 ring-amber-400/40' : 'bg-blue-600'}`}>
            {loginType === 'developer' ? <Code2 className="w-6 h-6 text-amber-400" /> : <BookOpen className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {loginType === 'developer' ? 'Developer Console' : 'Sign in to CampusFind'}
          </h1>
          <p className="text-sm text-slate-500">
            {loginType === 'developer' ? 'Authorized maintenance & administrative access' : 'Access your reports and claims'}
          </p>

          {/* Login Type Switcher Tabs */}
          <div className="pt-2">
            <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl max-w-xs mx-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setLoginType('student'); setError(''); }}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                  loginType === 'student'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student / Staff
              </button>
              <button
                type="button"
                onClick={() => { setLoginType('developer'); setError(''); }}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                  loginType === 'developer'
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Developer
              </button>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className={`bg-white rounded-2xl border shadow-sm p-6 sm:p-7 transition-all ${
          loginType === 'developer' ? 'border-amber-400/40 ring-1 ring-amber-400/20' : 'border-slate-200'
        }`}>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide" htmlFor="email">
                  {loginType === 'developer' ? 'Developer Email' : 'Amal Jyothi Email'}
                </label>
                {loginType === 'developer' ? (
                  <span className="text-[10px] text-amber-700 bg-amber-50 font-medium px-2 py-0.5 rounded-full border border-amber-200">
                    Restricted
                  </span>
                ) : (
                  <span className="text-[10px] text-blue-600 bg-blue-50 font-medium px-2 py-0.5 rounded-full border border-blue-100">
                    @*.ajce.in
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={loginType === 'developer' ? 'blessenunnikrishnan@gmail.com' : 'e.g. blessenunnikrishnan2030@cs.ajce.in'}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              {loginType === 'developer' && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Only the site creator's email (<span className="font-mono text-slate-700">blessenunnikrishnan@gmail.com</span>) is authorized.
                </p>
              )}
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
              className={`w-full text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm mt-1 ${
                loginType === 'developer'
                  ? 'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Authenticating…
                </span>
              ) : (loginType === 'developer' ? 'Access Developer Console' : 'Sign in')}
            </button>

            <div className="pt-1 flex flex-col gap-1 text-center">
              {loginType === 'developer' ? (
                <button
                  type="button"
                  onClick={fillDemoDev}
                  className="text-xs text-amber-700 hover:underline font-medium py-1 transition-colors"
                >
                  Fill developer credentials
                </button>
              ) : (
                <button
                  type="button"
                  onClick={fillDemoStudent}
                  className="text-xs text-slate-400 hover:text-blue-600 font-medium py-1 transition-colors"
                >
                  Fill student demo credentials
                </button>
              )}
            </div>
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
