"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Dumbbell, Mail, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams])
  const type = useMemo(() => searchParams.get("type") === "trainer" ? "trainer" : "client", [searchParams])

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Missing email. Please return to signup and try again.")
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json?.error ?? "Verification failed. Please try again.")
        return
      }

      const accountType: "client" | "trainer" = json.accountType ?? type

      if (accountType === "trainer") {
        setSuccess("Email verified. Redirecting to application status...")
        router.replace("/trainer-pending")
      } else {
        setSuccess("Email verified! Please sign in to continue.")
        router.replace("/login?verified=true")
      }
    } catch {
      setError("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError("Missing email. Please return to signup and try again.")
      return
    }

    setError(null)
    setSuccess(null)
    setResendLoading(true)

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json?.error ?? "Could not resend verification code. Please try again.")
        return
      }

      setSuccess(`A new verification code was sent to ${email}.`)
    } catch {
      setError("Could not resend verification code. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-secondary/50 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative z-10 text-center max-w-lg">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl" />
              <div className="relative h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                <Mail className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-4">Verify Your Email</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Enter the one-time code sent to your inbox to finish account setup.
          </p>

          <div className="space-y-4 text-left">
            {[
              "Check your inbox and spam folder",
              "Enter the latest verification code",
              "Use resend if the code expires",
              type === "trainer"
                ? "After verification, your trainer application stays pending review"
                : "After verification, you can access your dashboard",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GymovaFlow</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Confirm your email</h1>
            <p className="text-muted-foreground">
              {email ? `We sent a verification code to ${email}.` : "Use the email you just signed up with."}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-foreground">Verification code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-500">{success}</p>}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={loading || !otp.trim()}
              >
                {loading ? "Verifying..." : (
                  <span className="flex items-center gap-2">
                    Verify Email
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-secondary border-border text-foreground hover:bg-muted"
                disabled={resendLoading || !email}
                onClick={handleResend}
              >
                {resendLoading ? (
                  "Sending..."
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Resend Code
                  </span>
                )}
              </Button>
            </div>
          </form>

          <Link href="/signup" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4" />
            Back to signup
          </Link>
        </div>
      </div>
    </div>
  )
}

function VerifyEmailFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="text-muted-foreground">Loading verification page...</span>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
