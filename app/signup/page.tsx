"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dumbbell,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  User,
  Briefcase,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function SignupPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [accountType, setAccountType] = useState<"client" | "trainer">("client")
  const [step, setStep] = useState(1)
  const isSubmittingRef = useRef(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [location, setLocation] = useState("")
  const [certifications, setCertifications] = useState("")
  const [experience, setExperience] = useState("")
  const [rate, setRate] = useState("")
  const [bio, setBio] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Removed auto-redirect to dashboard on session to force email verification

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError(null)
    setSuccess(null)

    if (step === 1) {
      setStep(2)
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
            "Too many signup emails were sent recently. Please wait 30–60 minutes and try again, or use a different email. For local development, you can turn off \"Confirm email\" in Supabase → Authentication → Providers → Email."
          )
        } else {
          setError(msg)
        }
        isSubmittingRef.current = false
        return
      }

      const userId = data.user?.id

      if (accountType === "trainer") {
        if (!userId) {
          setError("Signup succeeded but no user ID was returned. Please try again.")
          isSubmittingRef.current = false
          return
        }

        // Use server-side API route (service role) so profile + application are
        // created regardless of whether email confirmation is enabled.
        const res = await fetch("/api/trainer-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            fullName,
            email,
            certifications,
            experience,
            hourlyRate: rate,
            bio,
            specializations: [],
          }),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          console.error("Trainer signup API error:", json)
        }

        // Sign out the trainer so they can't access any dashboard until approved.
        await supabase.auth.signOut()
        router.replace(`/verify-email?email=${encodeURIComponent(email)}&type=trainer`)
      } else if (userId) {
        // Client account — upsert profile directly (client is already signed in).
        if (data.session) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({ id: userId, full_name: fullName, role: "client" }, { onConflict: "id" })
          if (profileError) {
            console.error("Error creating client profile", profileError)
          }
        }
        router.replace(`/verify-email?email=${encodeURIComponent(email)}&type=client`)
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

  // Removed trainerRequestSubmitted UI. Trainer is now redirected to /verify-email after signup.

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

          {/* Benefits */}
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

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {step === 1 ? "Create your account" : "Complete your profile"}
            </h1>
            <p className="text-muted-foreground">
              {step === 1
                ? "Join thousands achieving their fitness goals"
                : "Tell us a bit more about yourself"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
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
                      className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with a number and symbol
                  </p>
                </div>
              </>
            ) : (
              <>
                {accountType === "client" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="goals" className="text-foreground">
                        What are your fitness goals?
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "Weight Loss",
                          "Muscle Gain",
                          "Flexibility",
                          "Endurance",
                          "Strength",
                          "General Fitness",
                        ].map((goal) => (
                          <label
                            key={goal}
                            className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border hover:border-primary/50 cursor-pointer transition-colors"
                          >
                            <Checkbox className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                            <span className="text-sm text-foreground">{goal}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-foreground">
                        Experience level
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Beginner", "Intermediate", "Advanced"].map((level) => (
                          <button
                            key={level}
                            type="button"
                            className="p-3 rounded-lg bg-secondary border border-border hover:border-primary text-sm text-foreground transition-colors"
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-foreground">
                        Location
                      </Label>
                      <Input
                        id="location"
                        placeholder="City or zip code"
                        className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 mb-2">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Application Review Required</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Trainer applications are reviewed by our admin team to ensure quality. You&apos;ll be
                            notified once approved.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specializations" className="text-foreground">
                        Your specializations
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Weight Training", "HIIT", "Yoga", "Pilates", "CrossFit", "Nutrition"].map((spec) => (
                          <label
                            key={spec}
                            className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border hover:border-primary/50 cursor-pointer transition-colors"
                          >
                            <Checkbox className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                            <span className="text-sm text-foreground">{spec}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certifications" className="text-foreground">
                        Certifications
                      </Label>
                      <Input
                        id="certifications"
                        placeholder="e.g., NASM, ACE, ISSA"
                        required
                        className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                        value={certifications}
                        onChange={(e) => setCertifications(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-foreground">
                        Years of experience
                      </Label>
                      <Input
                        id="experience"
                        type="number"
                        placeholder="5"
                        required
                        className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate" className="text-foreground">
                        Desired hourly rate ($)
                      </Label>
                      <Input
                        id="rate"
                        type="number"
                        placeholder="75"
                        required
                        className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-foreground">
                        Tell us about yourself
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Describe your training philosophy, experience, and what makes you unique..."
                        required
                        className="min-h-[100px] bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {step === 1 && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-emerald-500">
                {success}
              </p>
            )}

            <div className="flex gap-3">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 bg-secondary border-border text-foreground hover:bg-muted"
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {accountType === "trainer" && step === 2
                      ? "Submitting application..."
                      : "Creating account..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {step === 1
                      ? "Continue"
                      : accountType === "trainer"
                        ? "Submit Application"
                        : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </form>

          {step === 1 && (
            <>
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">Or sign up with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 bg-secondary border-border text-foreground hover:bg-muted"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 bg-secondary border-border text-foreground hover:bg-muted"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                  GitHub
                </Button>
              </div>
            </>
          )}

          {/* Login Link */}
          <p className="text-center text-muted-foreground">
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

