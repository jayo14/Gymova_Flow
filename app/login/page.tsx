"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dumbbell, Eye, EyeOff, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/AuthProvider"
import { getRoleRedirectPath, getTrainerStatus } from "@/lib/trainerAuth"
import { createAdminSession } from "@/app/admin/actions"

export default function LoginPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [verifiedSuccess, setVerifiedSuccess] = useState(false)
  const isHandlingSubmit = useRef(false)

  useEffect(() => {
    if (isHandlingSubmit.current) return
    if (!loading && session?.user) {
      if (!session.user.email_confirmed_at) {
        const accountType =
          (session.user.user_metadata as { account_type?: string } | undefined)
            ?.account_type === "trainer"
            ? "trainer"
            : "client"
        router.replace(`/verify-email?email=${encodeURIComponent(session.user.email ?? "")}&type=${accountType}`)
        return
      }

      getRoleRedirectPath(session.user.id).then((path) => {
        if (isHandlingSubmit.current) return
        router.replace(path)
      })
    }
  }, [loading, session, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const isResetSuccess = params.get("reset") === "success"
    const isVerified = params.get("verified") === "true"
    setResetSuccess(isResetSuccess)
    setVerifiedSuccess(isVerified)

    if (isResetSuccess || isVerified) {
      if (isResetSuccess) params.delete("reset")
      if (isVerified) params.delete("verified")
      const nextQuery = params.toString()
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`
      window.history.replaceState({}, "", nextUrl)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError(null)
    isHandlingSubmit.current = true

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      isHandlingSubmit.current = false
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setIsLoading(false)
      isHandlingSubmit.current = false
      return
    }

    if (!data.user.email_confirmed_at) {
      const accountType =
        (data.user.user_metadata as { account_type?: string } | undefined)
          ?.account_type === "trainer"
          ? "trainer"
          : "client"
      setIsLoading(false)
      await supabase.auth.signOut()
      router.replace(`/verify-email?email=${encodeURIComponent(email)}&type=${accountType}`)
      return
    }

    const trainerStatus = await getTrainerStatus(userId)
    if (trainerStatus === "pending") {
      await supabase.auth.signOut()
      router.replace("/trainer-pending")
      return
    }

    if (trainerStatus === "rejected") {
      await supabase.auth.signOut()
      router.replace("/trainer-rejected")
      return
    }

    const redirectPath = await getRoleRedirectPath(userId)

    // For admin users, establish the admin session cookie before redirecting.
    if (redirectPath.startsWith("/admin")) {
      await createAdminSession(userId)
    }

    // Check onboarding completion for non-admin users.
    if (!redirectPath.startsWith("/admin")) {
      const onboardingCompleted =
        (data.user.user_metadata as { onboarding_completed?: boolean } | undefined)
          ?.onboarding_completed === true
      if (!onboardingCompleted) {
        setIsLoading(false)
        router.replace("/onboarding")
        return
      }
    }

    setIsLoading(false)
    router.replace(redirectPath)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GymovaFlow</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to continue your fitness journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {resetSuccess && !error && (
              <p className="text-sm text-emerald-500">
                Password reset successful. Please sign in with your new password.
              </p>
            )}
            {verifiedSuccess && !error && !resetSuccess && (
              <p className="text-sm text-emerald-500">
                Email verified! Please sign in to continue.
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
