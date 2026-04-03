"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dumbbell,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  User,
  Briefcase,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function SignupPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [accountType, setAccountType] = useState<"client" | "trainer">("client")
  const isSubmittingRef = useRef(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && session?.user) {
      router.replace("/onboarding")
    }
  }, [loading, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    isSubmittingRef.current = true

    try {
      const fullName = `${firstName} ${lastName}`.trim()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: accountType,
            onboarding_completed: false,
          },
        },
      })

      if (signUpError) {
        const msg = signUpError.message
        const isRateLimit =
          msg?.toLowerCase().includes("rate limit") ||
          msg?.toLowerCase().includes("rate_limit") ||
          signUpError.status === 429
        if (isRateLimit) {
          setError(
            "Too many signup emails sent recently. Please wait 30–60 minutes and try again."
          )
        } else {
          setError(msg)
        }
        isSubmittingRef.current = false
        return
      }

      const userId = data.user?.id

      if (!userId) {
        setError("Signup succeeded but no user ID was returned. Please try again.")
        isSubmittingRef.current = false
        return
      }

      if (accountType === "client" && data.session) {
        // Create profile immediately when session is available (email confirmation disabled).
        await supabase
          .from("profiles")
          .upsert({ id: userId, full_name: fullName, role: "client" }, { onConflict: "id" })
        router.replace("/onboarding")
      } else {
        // Email confirmation is enabled — redirect to verify email first.
        router.replace(`/verify-email?email=${encodeURIComponent(email)}&type=${accountType}`)
      }
    } catch (err) {
      console.error("Unexpected error during signup", err)
      setError("Something went wrong while creating your account. Please try again.")
      isSubmittingRef.current = false
    } finally {
      setIsLoading(false)
    }
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
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-secondary/50 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative z-10 text-center max-w-lg">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl" />
              <div className="relative h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                <Dumbbell className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Start Your Transformation
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Join the community that&apos;s redefining fitness. Whether you&apos;re looking to train or become a trainer,
            we&apos;ve got you covered.
          </p>

          <div className="space-y-4 text-left">
            {[
              "Access to 500+ certified personal trainers",
              "AI-powered workout recommendations",
              "Real-time messaging with trainers",
              "Track your progress with detailed analytics",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 shrink-0">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GymovaFlow</span>
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Join thousands achieving their fitness goals
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">I want to...</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAccountType("client")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    accountType === "client"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:border-muted-foreground"
                  }`}
                >
                  <User
                    className={`h-6 w-6 mb-2 ${
                      accountType === "client" ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div
                    className={`font-medium ${
                      accountType === "client" ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Find a Trainer
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Get personalized coaching
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("trainer")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    accountType === "trainer"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:border-muted-foreground"
                  }`}
                >
                  <Briefcase
                    className={`h-6 w-6 mb-2 ${
                      accountType === "trainer" ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div
                    className={`font-medium ${
                      accountType === "trainer" ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Become a Trainer
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Apply to join our team
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">
                  First name
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  required
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  required
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
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
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
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
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  required
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
