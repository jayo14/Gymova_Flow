"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { session } = useAuth()
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const email = session?.user?.email
      if (!email) {
        setError("No email found for verification.")
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email"
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess("Email verified! Redirecting to dashboard...")
        setTimeout(() => router.replace("/dashboard"), 1500)
      }
    } catch (err) {
      setError("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleVerify} className="bg-card p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-foreground text-center">Verify Your Email</h1>
        <p className="text-muted-foreground text-center">Enter the OTP code sent to your email address.</p>
        <div>
          <Label htmlFor="otp">OTP Code</Label>
          <Input
            id="otp"
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
            className="mt-2"
            autoFocus
          />
        </div>
        {error && <div className="text-destructive text-sm text-center">{error}</div>}
        {success && <div className="text-success text-sm text-center">{success}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying..." : "Verify Email"}
        </Button>
      </form>
    </div>
  )
}
