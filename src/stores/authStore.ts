import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  initialized: boolean

  initialize: () => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<boolean>
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  initialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      // No Supabase configured — skip auth, app works without it
      set({ isLoading: false, initialized: true })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        initialized: true,
      })

      // Listen for auth changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        })
      })
    } catch {
      set({ isLoading: false, initialized: true })
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name || '' },
        },
      })
      if (error) {
        const friendly = friendlyError(error.message)
        set({ error: friendly, isLoading: false })
        return false
      }
      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      })
      return true
    } catch (err: any) {
      set({ error: 'Hmm, something went wrong. Try again?', isLoading: false })
      return false
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        const friendly = friendlyError(error.message)
        set({ error: friendly, isLoading: false })
        return false
      }
      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      })
      return true
    } catch {
      set({ error: 'Hmm, something went wrong. Try again?', isLoading: false })
      return false
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    await supabase.auth.signOut()
    set({ user: null, session: null, isLoading: false })
  },

  resetPassword: async (email) => {
    set({ error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        set({ error: friendlyError(error.message) })
        return false
      }
      return true
    } catch {
      set({ error: 'Couldn\'t send the reset email. Check your email address?' })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))

// Turn Supabase errors into 13-year-old-friendly messages
function friendlyError(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login')) return 'That email/password combo doesn\'t look right. Try again?'
  if (lower.includes('email not confirmed')) return 'Check your inbox — you need to confirm your email first.'
  if (lower.includes('already registered') || lower.includes('already been registered')) return 'Looks like you already have an account. Try signing in instead!'
  if (lower.includes('password') && lower.includes('short')) return 'Password needs to be at least 6 characters.'
  if (lower.includes('invalid email') || lower.includes('valid email')) return 'That email doesn\'t look quite right.'
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Woah, slow down! Give it a minute and try again.'
  return 'Hmm, something went a bit wrong. Try again?'
}
