"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { Profile } from "@/types/profile"
import { getProfile } from "@/lib/supabase/profiles"

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  profile: Profile | null
  profileLoading: boolean
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await getProfile(userId)
      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }
      setProfile(data)
      return data
    } catch (err) {
      console.error("Error fetching profile:", err)
      return null
    }
  }

  // Refetch profile (public method for components)
  const refetchProfile = async () => {
    if (user?.id) {
      setProfileLoading(true)
      await fetchProfile(user.id)
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) return

      if (error) {
        console.error("Error getting Supabase session", error)
        setSession(null)
        setUser(null)
        setProfile(null)
      } else {
        setSession(data.session)
        setUser(data.session?.user ?? null)

        // Fetch profile if user exists
        if (data.session?.user?.id) {
          await fetchProfile(data.session.user.id)
        }
      }

      setProfileLoading(false)
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return

      // Update session and user
      setSession((prev) => {
        if (prev?.access_token === newSession?.access_token) return prev
        return newSession
      })
      setUser((prev) => {
        if (prev?.id === newSession?.user?.id) return prev
        return newSession?.user ?? null
      })

      // Fetch new profile if user changed
      if (newSession?.user?.id) {
        setProfileLoading(true)
        fetchProfile(newSession.user.id).then(() => {
          setProfileLoading(false)
        })
      } else {
        setProfile(null)
        setProfileLoading(false)
      }

      if (loading) setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loading])

  // Subscribe to profile changes for the current user
  useEffect(() => {
    if (!user?.id) return

    // Use a unique name for each subscription instance to avoid conflicts
    // while still filtering for the specific user's profile updates.
    const channelId = Math.random().toString(36).slice(2, 9)
    const channelName = `profile-${user.id}-${channelId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // Update profile state when changes are detected
          setProfile(payload.new as Profile)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return (
    <AuthContext.Provider
      value={{ user, session, loading, profile, profileLoading, refetchProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}

