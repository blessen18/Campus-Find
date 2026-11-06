'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Bell, User as UserIcon, LogOut, ChevronDown, Search, Compass } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getClientUser, clearClientSession } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { Profile, Notification } from '@/types'

const NAV_LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/lost-items',  label: 'Lost Items' },
  { href: '/found-items', label: 'Found Items' },
  { href: '/how-it-works',label: 'How It Works' },
]

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser]               = useState<Profile | null>(null)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loading, setLoading]         = useState(true)
  const supabase = createClient()

  // ── Auth state ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          if (profile) {
            setUser(profile)
            setLoading(false)
            return
          }
        }
      } catch {
        // Supabase offline — check local
      }
      const local = getClientUser()
      if (local) setUser(local)
      setLoading(false)
    }

    loadUser()

    const onAuthChange = () => {
      const local = getClientUser()
      setUser(local)
    }
    window.addEventListener('campusfind_auth_change', onAuthChange)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUser(profile)
      } else {
        const local = getClientUser()
        setUser(local)
      }
    })
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('campusfind_auth_change', onAuthChange)
    }
  }, [])

  const handleSignOut = async () => {
    clearClientSession()
    try { await supabase.auth.signOut() } catch {}
    setUser(null)
    setUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <>
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-slate-400 text-[11px] py-1.5 px-4 font-medium border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>Amal Jyothi College of Engineering · Campus Portal</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span>Security Desk: 04828-305555</span>
          </div>
        </div>
      </div>

      {/* ── Main Navbar ──────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors">
                  CampusFind
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                  Lost & Found
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium px-3 py-2 rounded-lg transition-colors',
                    pathname === link.href
                      ? 'text-blue-700 bg-blue-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/dashboard"
                  className={cn(
                    'text-sm font-medium px-3 py-2 rounded-lg transition-colors',
                    pathname.startsWith('/dashboard')
                      ? 'text-blue-700 bg-blue-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  Dashboard
                </Link>
              )}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Report buttons (desktop) */}
              <div className="hidden lg:flex items-center gap-1.5">
                <Link
                  href="/report/lost"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  Report Lost
                </Link>
                <Link
                  href="/report/found"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                >
                  Report Found
                </Link>
              </div>

              {/* Auth buttons or user menu */}
              {!loading && !user && (
                <div className="hidden md:flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-200">
                  <Link
                    href="/auth/login"
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}

              {!loading && user && (
                <div className="hidden md:block relative pl-2 ml-1 border-l border-slate-200">
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                    <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {user.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" /> Dashboard
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Console
                        </Link>
                      )}
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile toggle */}
              <button
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                onClick={() => setMobileOpen(o => !o)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg z-30">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm font-medium',
                  pathname === link.href ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard"
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <div className="border-t border-slate-100 my-2 pt-2 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/report/lost"
                  className="text-center text-xs font-medium py-2 rounded-lg bg-red-50 text-red-700 border border-red-200"
                  onClick={() => setMobileOpen(false)}
                >
                  Report Lost
                </Link>
                <Link
                  href="/report/found"
                  className="text-center text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 border border-green-200"
                  onClick={() => setMobileOpen(false)}
                >
                  Report Found
                </Link>
              </div>
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign out ({user.email})
                </button>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link
                    href="/auth/login"
                    className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-slate-100 text-slate-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-blue-600 text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click-outside dismiss */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  )
}
