'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { setAccessTokenGetter } from '@/lib/api'

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    setAccessTokenGetter(async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    })

    const load = async () => {
      const { data: { session: current } } = await supabase.auth.getSession()
      setSession(current)
      setUser(current?.user ?? null)
      setIsLoading(false)
    }
    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await createClient().auth.signUp({ email, password })
    if (error) throw new Error(error.message)
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await createClient().auth.signOut()
    if (error) throw new Error(error.message)
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
