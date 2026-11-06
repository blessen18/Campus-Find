'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getClientUser } from '@/lib/auth'
import type { Profile } from '@/types'

export function useAuth() {
  const [user, setUser]       = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function initUser() {
      try {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', data.user.id).single()
          if (profile) {
            setUser(profile)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        // ignore
      }
      const local = getClientUser()
      if (local) setUser(local)
      setLoading(false)
    }

    initUser()

    const onAuthChange = () => {
      const local = getClientUser()
      setUser(local)
    }
    window.addEventListener('campusfind_auth_change', onAuthChange)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()
        setUser(profile)
      } else {
        const local = getClientUser()
        setUser(local)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('campusfind_auth_change', onAuthChange)
    }
  }, [])

  return { user, loading, isAdmin: user?.role === 'admin' }
}
