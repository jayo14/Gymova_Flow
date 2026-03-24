"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Dumbbell, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

function getResetRedirectUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const base = configured && configured.length > 0 ? configured : window.location.origin
  return `${base.replace(/\/$/, "")}/reset-password`
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getResetRedirectUrl(),
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess("If an account exists for this email, we sent a password reset link.")
    } catch {
      setError("Unable to send reset email right now. Please try again.")
    } finally {
      setLoading(false)
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Forgot Password</h1>
        <p className="text-muted-foreground">
          Enter your email and we&apos;ll send you a secure reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              className="h-12 pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-emerald-500">{success}</p>}

        <Button
          type="submit"
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          disabled={loading || !email.trim()}
        >
          {loading ? "Sending..." : (
            <span className="flex items-center gap-2">
              Send Reset Link
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
