"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { AthleteDashboardShell } from "@/components/dashboard/AthleteDashboardShell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { getClientGoals, upsertClientGoals } from "@/lib/supabase/clientGoals"
import { getTrainers } from "@/lib/supabase/trainers"
import { supabase } from "@/lib/supabaseClient"
import type { TrainerListItem } from "@/types/trainer"
import {
  Filter,
  Loader2,
  Map as MapIcon,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react"

const specializations = [
  "Weight Loss",
  "Bodybuilding",
  "Strength Training",
  "HIIT",
  "CrossFit",
  "Yoga",
  "Cardio",
  "Nutrition",
  "Boxing",
  "MMA",
]

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function FilterSidebar({
  priceRange,
  setPriceRange,
  selectedSpecs,
  setSelectedSpecs,
  minRating,
  setMinRating,
}: {
  priceRange: number[]
  setPriceRange: (value: number[]) => void
  selectedSpecs: string[]
  setSelectedSpecs: (value: string[]) => void
  minRating: number
  setMinRating: (value: number) => void
}) {
  const toggleSpec = (spec: string) => {
    if (selectedSpecs.includes(spec)) {
      setSelectedSpecs(selectedSpecs.filter((s) => s !== spec))
    } else {
      setSelectedSpecs([...selectedSpecs, spec])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-foreground font-medium mb-3 block">Price Range</Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={150}
            step={5}
            className="mb-2"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-foreground font-medium mb-3 block">Minimum Rating</Label>
        <div className="flex items-center gap-2">
          {[4, 4.5, 4.8].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(rating)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                minRating === rating
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              {rating}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-foreground font-medium mb-3 block">Specialization</Label>
        <div className="flex flex-wrap gap-2">
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => toggleSpec(spec)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedSpecs.includes(spec)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {(selectedSpecs.length > 0 || priceRange[0] > 0 || priceRange[1] < 150 || minRating > 0) && (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelectedSpecs([])
            setPriceRange([0, 150])
            setMinRating(0)
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}

type AiMatch = { id: number; reason: string }

function TrainerCard({ trainer, aiReason }: { trainer: TrainerListItem; aiReason?: string }) {
  return (
    <Link href={`/trainers/${trainer.id}`}>
      <Card className="bg-card border-border hover:border-primary/50 transition-colors h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-xl border border-border flex-shrink-0">
              <AvatarImage src={trainer.avatar_url ?? undefined} alt={trainer.name} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-secondary text-foreground font-semibold">
                {getInitials(trainer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-card-foreground truncate">{trainer.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{trainer.specialty}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="text-sm font-medium text-card-foreground">{trainer.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">({trainer.reviews})</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">${trainer.price}</p>
              <p className="text-xs text-muted-foreground">/session</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{trainer.distance}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {trainer.specializations.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground"
              >
                {spec}
              </span>
            ))}
            {aiReason && (
              <span className="px-2 py-0.5 rounded text-xs bg-primary/15 text-primary font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {aiReason}
              </span>
            )}
          </div>

          <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            View Profile
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function TrainersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([0, 150])
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [trainerList, setTrainerList] = useState<TrainerListItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [aiMatches, setAiMatches] = useState<AiMatch[] | null>(null)
  const [aiMatchLoading, setAiMatchLoading] = useState(false)
  const [aiMatchError, setAiMatchError] = useState<string | null>(null)
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState({
    primary_goal: "",
    experience_level: "",
    preferred_training_style: "",
    workout_days_per_week: "",
    injuries_limitations: "",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      const [{ data, error }, authResult] = await Promise.all([
        getTrainers(),
        supabase.auth.getUser(),
      ])

      if (!mounted) return

      if (error) {
        console.error("Error loading trainers from Supabase:", error)
        setLoadError("Could not load trainers right now. Please try again shortly.")
      } else {
        setTrainerList(data)
      }

      const userId = authResult.data.user?.id
      if (!userId) return

      const { data: goals } = await getClientGoals(userId)
      if (!mounted || !goals) return

      setGoalForm({
        primary_goal: goals.primary_goal ?? "",
        experience_level: goals.experience_level ?? "",
        preferred_training_style: goals.preferred_training_style ?? "",
        workout_days_per_week: goals.workout_days_per_week ? String(goals.workout_days_per_week) : "",
        injuries_limitations: goals.injuries_limitations ?? "",
      })
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [])

  const filteredTrainers = trainerList.filter((trainer) => {
    const matchesSearch =
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPrice = trainer.price >= priceRange[0] && trainer.price <= priceRange[1]
    const matchesRating = trainer.rating >= minRating
    const matchesSpecializations =
      selectedSpecs.length === 0 ||
      selectedSpecs.some((spec) => trainer.specializations.includes(spec))

    return matchesSearch && matchesPrice && matchesRating && matchesSpecializations
  })

  const aiMatchMap = new Map((aiMatches ?? []).map((match) => [match.id, match.reason]))

  const runAiMatch = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id
    if (!userId) {
      setAiMatchError("You need to be signed in to use AI matching.")
      return
    }

    await upsertClientGoals(userId, {
      primary_goal: goalForm.primary_goal,
      experience_level: goalForm.experience_level,
      preferred_training_style: goalForm.preferred_training_style,
      workout_days_per_week: goalForm.workout_days_per_week ? Number(goalForm.workout_days_per_week) : null,
      injuries_limitations: goalForm.injuries_limitations,
      notes: null,
    })

    const response = await fetch("/api/match-trainer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    const result = await response.json()
    if (!response.ok) {
      setAiMatchError(result.error ?? "Could not generate AI matches right now.")
      return
    }

    setAiMatches(Array.isArray(result.matches) ? result.matches : [])
    setAiMatchError(null)
    setMatchModalOpen(false)
  }

  return (
    <AthleteDashboardShell title="Find Trainers">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Find Trainers</h1>
            <p className="text-muted-foreground">Explore top coaches and let AI recommend the best fit.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Dialog open={matchModalOpen} onOpenChange={setMatchModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Match
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-card-foreground">
                <DialogHeader>
                  <DialogTitle>Tell AI what you need</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Primary goal" value={goalForm.primary_goal} onChange={(event) => setGoalForm((prev) => ({ ...prev, primary_goal: event.target.value }))} />
                  <Input placeholder="Experience level" value={goalForm.experience_level} onChange={(event) => setGoalForm((prev) => ({ ...prev, experience_level: event.target.value }))} />
                  <Input placeholder="Training style" value={goalForm.preferred_training_style} onChange={(event) => setGoalForm((prev) => ({ ...prev, preferred_training_style: event.target.value }))} />
                  <Input placeholder="Workout days per week" value={goalForm.workout_days_per_week} onChange={(event) => setGoalForm((prev) => ({ ...prev, workout_days_per_week: event.target.value }))} />
                  <Input className="sm:col-span-2" placeholder="Injuries or limitations" value={goalForm.injuries_limitations} onChange={(event) => setGoalForm((prev) => ({ ...prev, injuries_limitations: event.target.value }))} />
                </div>
                {aiMatchError && <p className="text-sm text-destructive">{aiMatchError}</p>}
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={aiMatchLoading} onClick={async () => {
                  setAiMatchLoading(true)
                  await runAiMatch()
                  setAiMatchLoading(false)
                }}>
                  {aiMatchLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Find matches
                </Button>
              </DialogContent>
            </Dialog>

            <Link href="/map">
              <Button variant="outline" className="border-border bg-transparent">
                <MapIcon className="w-4 h-4 mr-2" />
                Open Map
              </Button>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-border bg-transparent lg:hidden">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card border-border text-card-foreground">
                <SheetHeader>
                  <SheetTitle>Filter trainers</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    selectedSpecs={selectedSpecs}
                    setSelectedSpecs={setSelectedSpecs}
                    minRating={minRating}
                    setMinRating={setMinRating}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden lg:block rounded-2xl border border-border bg-card p-6 h-fit sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Filters</span>
            </div>
            <FilterSidebar
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedSpecs={selectedSpecs}
              setSelectedSpecs={setSelectedSpecs}
              minRating={minRating}
              setMinRating={setMinRating}
            />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trainers by name or specialty"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            {loadError && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="p-4 text-sm text-destructive">{loadError}</CardContent>
              </Card>
            )}

            {!mounted ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading trainers...
                </CardContent>
              </Card>
            ) : filteredTrainers.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No trainers matched your filters.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredTrainers.map((trainer) => (
                  <TrainerCard key={trainer.id} trainer={trainer} aiReason={aiMatchMap.get(trainer.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AthleteDashboardShell>
  )
}
