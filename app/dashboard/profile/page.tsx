"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Mail, Calendar, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import { getProfile, upsertProfile, uploadAvatar } from "@/lib/supabase/profiles"
import type { Profile } from "@/types/profile"

export default function ProfilePage() {
  const { session } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bio, setBio] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) return

    setIsLoading(true)
    setError(null)

    getProfile(session.user.id).then(({ data, error }) => {
      if (error) {
        console.error("Error loading profile:", error)
        setError("Unable to load your profile right now.")
        setIsLoading(false)
        return
      }

      const profileData: Profile = data ?? {
        id: session.user.id,
        full_name:
          (session.user.user_metadata as { full_name?: string } | null)?.full_name ??
          session.user.email ??
          "",
        avatar_url: null,
        role: null,
        trainer_status: null,
        created_at: session.user.created_at ?? null,
      }

      setProfile(profileData)
      setFullName(profileData.full_name ?? "")
      setAvatarUrl(profileData.avatar_url ?? "")
      setIsLoading(false)
    })
  }, [session])

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session?.user) return

    setIsUploadingAvatar(true)
    setError(null)
    setSuccess(null)

    const { data: nextAvatarUrl, error: uploadError } = await uploadAvatar(session.user.id, file)
    if (uploadError || !nextAvatarUrl) {
      setError(uploadError ?? "Failed to upload your avatar.")
      setIsUploadingAvatar(false)
      return
    }

    const { error: saveError } = await upsertProfile(session.user.id, {
      avatar_url: nextAvatarUrl,
    })

    if (saveError) {
      setError(saveError)
      setIsUploadingAvatar(false)
      return
    }

    setAvatarUrl(nextAvatarUrl)
    setSuccess("Profile photo updated.")
    setIsUploadingAvatar(false)
    event.target.value = ""
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const { error } = await upsertProfile(session.user.id, {
      full_name: fullName,
      avatar_url: avatarUrl || null,
    })

    if (error) {
      console.error("Error updating profile:", error)
      setError("Failed to save your profile. Please try again.")
      setIsSaving(false)
      return
    }

    setSuccess("Profile updated successfully.")
    setIsSaving(false)
  }

  const joinedDate =
    profile?.created_at || session?.user?.created_at
      ? new Date(profile?.created_at ?? (session?.user?.created_at as string)).toLocaleDateString()
      : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <span className="text-muted-foreground">Loading your profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={triggerAvatarUpload}
                className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center cursor-pointer"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || "Profile avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-muted-foreground">
                    {fullName ? fullName.charAt(0).toUpperCase() : (session?.user?.email || "?")[0]}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={triggerAvatarUpload}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                aria-label="Upload profile photo"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-primary-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-card-foreground">
                {fullName || session?.user?.email}
              </h2>
              {joinedDate && (
                <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {joinedDate}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Click your avatar or the camera button to upload a new photo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-card-foreground">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-card-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={session?.user?.email ?? ""}
                  readOnly
                  aria-readonly="true"
                  className="pl-10 bg-input border-border text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-card-foreground">
                About Me
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell trainers about yourself..."
                className="min-h-[100px] bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">
                This field is currently local-only and not yet saved to your profile.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-500">{success}</p>}

            <div className="flex items-center gap-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
