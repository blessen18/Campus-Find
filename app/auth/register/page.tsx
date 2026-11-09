'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, BookOpen, Building2, GraduationCap, CheckCircle } from 'lucide-react'
import { isValidEmail, isAjceEmail, isDeveloperEmail } from '@/lib/utils'
import { setClientSession } from '@/lib/auth'
import { useToast } from '@/components/providers/ToastProvider'
import type { Profile, UserRole } from '@/types'

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Applied Electronics & Instrumentation',
  'Other',
]

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm: '',
    department: '',
    role: 'student' as UserRole,
  })
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required'
    if (!isValidEmail(form.email)) return 'Please enter a valid email address'
    const isDev = isDeveloperEmail(form.email)
    if (!isDev && !isAjceEmail(form.email)) {
      return 'Registration is restricted to Amal Jyothi student emails (e.g. yourname2030@cs.ajce.in) or authorized developer account.'
    }
    if (form.password.length < 8) return 'Password must be at least 8 characters'
    if (form.password !== form.confirm) return 'Passwords do not match'
    if (!form.department) return 'Please select your department'
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    // Simulate a small delay so the UI feels responsive
    await new Promise(r => setTimeout(r, 600))

    const isDev = isDeveloperEmail(form.email)

    // Create profile
    const profile: Profile = {
      id: isDev ? 'usr-dev-admin' : 'usr-' + Date.now(),
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      role: isDev ? 'admin' : form.role,
      department: form.department,
      student_id: isDev ? 'DEV-AJCE-01' : (form.role === 'student' ? `AJCE-${Math.floor(1000 + Math.random() * 9000)}` : null),
      phone: null,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setClientSession(profile)
    setSuccess(true)
    setLoading(false)

    // Redirect after short success flash
    setTimeout(() => {
      if (isDev) {
        window.open('/admin', '_blank')
        router.push('/dashboard')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    }, 900)
  }

  const setField = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  if (success) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Account created!</h2>
          <p className="text-slate-500 text-sm">Redirecting you to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto shadow-sm mb-1">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">
            Join CampusFind — Amal Jyothi College of Engineering
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide" htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  value={form.full_name}
                  onChange={e => setField('full_name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide" htmlFor="email">
                  Amal Jyothi Email <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  @*.ajce.in only
                </span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  placeholder="e.g. student2026@cs.ajce.in"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Must be your official AJCE student email (e.g. <span className="font-mono text-slate-700">student2026@cs.ajce.in</span>)
              </p>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['student', 'faculty', 'staff'] as const).map(r => (
                  <label
                    key={r}
                    className={`flex items-center justify-center py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all capitalize ${
                      form.role === r
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      className="sr-only"
                      checked={form.role === r}
                      onChange={() => setField('role', r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide" htmlFor="dept">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  id="dept"
                  value={form.department}
                  onChange={e => setField('department', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors appearance-none"
                  required
                >
                  <option value="">Select your department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide" htmlFor="pw">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pw"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  placeholder="Minimum 8 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide" htmlFor="confirm">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => setField('confirm', e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(o => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Info note */}
        <p className="text-center text-xs text-slate-400">
          Your account is stored locally on this device. Connect Supabase for multi-device sync.
        </p>
      </div>
    </div>
  )
}
