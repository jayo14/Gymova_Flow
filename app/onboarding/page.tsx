"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dumbbell, ArrowRight, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { upsertClientGoals } from "@/lib/supabase/clientGoals"
import { isMissingProfileColumnError } from "@/lib/supabase/profileSchema"
import { getRoleRedirectPath, getUserProfile } from "@/lib/trainerAuth"

const FITNESS_GOALS = ["Weight Loss", "Muscle Gain", "Flexibility", "Endurance", "General Fitness", "Sports Performance"]
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"]
const TRAINING_STYLES = ["One-on-one", "Group sessions", "Online coaching", "Hybrid"]
const SPECIALIZATIONS = ["Weight Training", "HIIT", "Yoga", "Pilates", "Boxing", "CrossFit", "Rehabilitation", "Nutrition"]

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accountType, setAccountType] = useState<"client" | "trainer">("client")
  const [error, setError] = useState<string | null>(null)

  // Client fields
  const [primaryGoal, setPrimaryGoal] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [trainingStyle, setTrainingStyle] = useState("")
  const [workoutDays, setWorkoutDays] = useState("")
  const [notes, setNotes] = useState("")

  // Trainer fields
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [certifications, setCertifications] = useState("")
  const [experience, setExperience] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [bio, setBio] = useState("")

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const profile = await getUserProfile(user.id)
      const metadataOnboardingCompleted =
        ((user.user_metadata as { onboarding_completed?: unknown } | undefined)?.onboarding_completed) === true
      const onboardingCompleted = profile?.onboarding_completed === true || metadataOnboardingCompleted
      if (onboardingCompleted) {
        const redirectPath = await getRoleRedirectPath(user.id)
        router.replace(redirectPath)
        return
      }

      const metadataType =
        (user.user_metadata as { account_type?: string } | undefined)?.account_type === "trainer"
      const type = profile?.role === "trainer" || metadataType ? "trainer" : "client"
      setAccountType(type)
      setIsLoading(false)
    }

    void init()
  }, [router])

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )
  }

  const handleClientSubmit = async (userId: string, fullName: string, email: string) => {
    if (!primaryGoal || !experienceLevel || !trainingStyle) {
      setError("Please fill in all required fields.")
      return false
    }

    const goalsPayload = {
      primary_goal: primaryGoal,
      experience_level: experienceLevel,
      preferred_training_style: trainingStyle,
      workout_days_per_week: workoutDays ? parseInt(workoutDays, 10) : null,
      notes: notes || null,
    }

    const { error: goalsError } = await upsertClientGoals(userId, goalsPayload)

    if (goalsError) {
      setError("Failed to save your preferences. Please try again.")
      return false
    }

    const completedAt = new Date().toISOString()

    const onboardingDetails = {
      account_type: "client",
      signup: {
        full_name: fullName,
        email,
      },
      client: goalsPayload,
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: fullName,
          role: "client",
          onboarding_completed: true,
          onboarding_completed_at: completedAt,
          onboarding_details: onboardingDetails,
        },
        { onConflict: "id" }
      )

    if (profileError) {
      console.error("Client profile onboarding update failed:", profileError)
      setError("Failed to update profile. Please try again.")
      return false
    }

    return true
  }

  const handleTrainerSubmit = async (userId: string, fullName: string, email: string) => {
    if (!bio || !experience) {
      setError("Please fill in all required fields.")
      return false
    }

    const res = await fetch("/api/trainer-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        fullName,
        email,
        certifications,
        experience,
        hourlyRate: hourlyRate || null,
        bio,
        specializations: selectedSpecializations,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? "Failed to submit trainer application. Please try again.")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const fullName =
        (user.user_metadata as { full_name?: string } | undefined)?.full_name ||
        user.email?.split("@")[0] ||
        "User"
      const email = user.email ?? ""
      const completedAt = new Date().toISOString()

      let success = false

      if (accountType === "client") {
        success = await handleClientSubmit(user.id, fullName, email)
      } else {
        success = await handleTrainerSubmit(user.id, fullName, email)
      }

      if (!success) return

      const existingMetadata = (user.user_metadata ?? {}) as Record<string, unknown>
      const resOnboarding = await fetch("/api/auth/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) }); if (!resOnboarding.ok) { setError("Failed to save onboarding status. Please try again."); return; }

      if (accountType === "trainer") {
        router.replace("/trainer-pending")
      } else {
        const redirectPath = await getRoleRedirectPath(user.id)
        router.replace(redirectPath)
      }
    } catch (err) {
      console.error("Onboarding error", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-8 bg-card p-8 rounded-2xl border border-border shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">GymovaFlow</span>
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {accountType === "trainer" ? "Tell us about yourself" : "Personalize your experience"}
          </h1>
          <p className="text-muted-foreground text-center mx-auto max-w-md">
            {accountType === "trainer"
              ? "Complete your trainer profile so we can review your application."
              : "Help us match you with the perfect trainer."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {accountType === "client" ? (
            <>
              {/* Primary Goal */}
              <div className="space-y-3">
                <Label className="text-foreground">
                  What is your primary fitness goal? <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {FITNESS_GOALS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setPrimaryGoal(goal)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-left flex items-center gap-2 ${
                        primaryGoal === goal
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {primaryGoal === goal && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-3">
                <Label className="text-foreground">
                  What is your experience level? <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperienceLevel(level)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        experienceLevel === level
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Training Style */}
              <div className="space-y-3">
                <Label className="text-foreground">
                  Preferred training style? <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAINING_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTrainingStyle(style)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                        trainingStyle === style
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workout Days */}
              <div className="space-y-2">
                <Label htmlFor="workoutDays" className="text-foreground">
                  How many days per week do you want to train?
                </Label>
                <Input
                  id="workoutDays"
                  type="number"
                  min={1}
                  max={7}
                  placeholder="e.g. 3"
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  value={workoutDays}
                  onChange={(e) => setWorkoutDays(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">
                  Any injuries or additional notes?
                </Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. knee injury, prefer morning sessions..."
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              {/* Specializations */}
              <div className="space-y-3">
                <Label className="text-foreground">Specializations</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALIZATIONS.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialization(spec)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-left flex items-center gap-2 ${
                        selectedSpecializations.includes(spec)
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {selectedSpecializations.includes(spec) && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <Label htmlFor="certifications" className="text-foreground">
                  Certifications
                </Label>
                <Input
                  id="certifications"
                  placeholder="e.g. NASM CPT, ACE"
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-foreground">
                  Years of experience <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="experience"
                  placeholder="e.g. 5 years"
                  required
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>

              {/* Hourly Rate */}
              <div className="space-y-2">
                <Label htmlFor="hourlyRate" className="text-foreground">
                  Hourly rate ($)
                </Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min={0}
                  placeholder="e.g. 60"
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground">
                  Bio <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell clients about your background, philosophy and approach..."
                  required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {accountType === "trainer" ? "Submitting application..." : "Saving preferences..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {accountType === "trainer" ? "Submit application" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
