"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Dumbbell, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setError(null)
    setSuccess(null)

    if (!token || !email) {
      setError("This reset link is invalid or expired. Please request a new one.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json?.error ?? "Could not update password. Please try again.")
        return
      }

      setSuccess("Password updated successfully. Redirecting to login...")
      setTimeout(() => {
        router.replace("/login?reset=success")
      }, 900)
    } catch {
      setError("Could not update password. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">GymovaFlow</span>
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Set New Password</h1>
        <p className="text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            New password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 pr-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            placeholder="Re-enter your password"
          />
        </div>

        {!token && (
          <p className="text-sm text-amber-600">
            Open this page from the reset link sent to your email.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-emerald-500">{success}</p>}

        <Button
          type="submit"
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          disabled={submitting || !password || !confirmPassword}
        >
          {submitting ? "Updating..." : (
            <span className="flex items-center gap-2">
              Update Password
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80">
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </div>
  )
}

function ResetPasswordFallback() {
  return (
    <div className="w-full max-w-md space-y-8">
      <span className="text-muted-foreground">Loading...</span>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
