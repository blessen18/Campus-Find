'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (err) setError(err.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🔑</div>
          <h1 className="text-2xl font-bold text-content">Reset your password</h1>
          <p className="text-sm text-content-muted mt-1">We'll send you a reset link by email</p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-content">Email sent!</h3>
              <p className="text-sm text-content-muted mt-1 mb-4">
                Check your inbox for the reset link. It expires in 1 hour.
              </p>
              <Link href="/auth/login" className="btn-primary">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div>
                <label className="label" htmlFor="email">Your email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle" />
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@ajce.edu.in" className="input pl-9" required />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-content-muted">
                <Link href="/auth/login" className="text-primary-700 hover:underline">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

