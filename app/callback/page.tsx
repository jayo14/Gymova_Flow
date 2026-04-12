"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { getRoleRedirectPath } from "@/lib/trainerAuth"
import { Dumbbell } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return

    const processAuth = async () => {
      // Small delay to allow the client SDK to pick up the session from the URL hash if needed
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        console.error("Authentication failed or session missing", error)
        // If there's an error in the hash, the SDK might not have picked it up yet or it's genuinely failed
        const hash = window.location.hash
        if (hash.includes("access_token")) {
           // Wait a bit longer, sometimes hash processing is async
           await new Promise(resolve => setTimeout(resolve, 1000))
           const { data: retryData } = await supabase.auth.getSession()
           if (retryData.session) {
              handleRedirect(retryData.session.user)
              return
           }
        }
        router.replace("/login?error=auth-failed")
        return
      }

      handleRedirect(data.session.user)
    }

    const handleRedirect = async (user: any) => {
      handled.current = true
      
      // Check onboarding status from user metadata
      const onboardingCompleted = user.user_metadata?.onboarding_completed === true

      if (!onboardingCompleted) {
        // New user or incomplete onboarding -> Go to Onboarding
        router.replace("/onboarding")
      } else {
        // Existing user -> Go to their specific dashboard based on DB role
        try {
          const path = await getRoleRedirectPath(user.id)
          router.replace(path)
        } catch (err) {
          console.error("Error determining redirect path", err)
          router.replace("/dashboard")
        }
      }
    }

    processAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/30">
          <Dumbbell className="h-10 w-10 text-primary animate-bounce" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-[#f9f9f9] mb-2 tracking-tight">
        Finalizing your sign in
      </h1>
      <p className="text-[#a0a0a0] max-w-xs leading-relaxed">
        Just a moment while we set up your fitness space...
      </p>
      
      <div className="mt-8 flex items-center gap-1.5 justify-center">
        {[0, 1, 2].map((i) => (
          <div 
            key={i} 
            className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
