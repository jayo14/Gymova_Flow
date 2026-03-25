"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  MapPin,
  Star,
  Filter,
  X,
  SlidersHorizontal,
  Map as MapIcon,
  Sparkles,
  Loader2,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { getTrainers } from "@/lib/supabase/trainers"
import { getClientGoals, upsertClientGoals } from "@/lib/supabase/clientGoals"
import { supabase } from "@/lib/supabaseClient"
import { AthleteDashboardShell } from "@/components/dashboard/AthleteDashboardShell"
import type { TrainerListItem } from "@/types/trainer"

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
  "MMA"
]


function FilterSidebar({ 
  priceRange, 
  setPriceRange,
  selectedSpecs,
  setSelectedSpecs,
  minRating,
  setMinRating
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
      setSelectedSpecs(selectedSpecs.filter(s => s !== spec))
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
            <div className="w-16 h-16 rounded-xl bg-secondary flex-shrink-0" />
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

  // AI match state
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

      const { data: savedGoals, error: goalsError } = await getClientGoals(userId)
      if (!mounted || goalsError || !savedGoals) return

      setGoalForm({
        primary_goal: savedGoals.primary_goal ?? "",
        experience_level: savedGoals.experience_level ?? "",
        preferred_training_style: savedGoals.preferred_training_style ?? "",
        workout_days_per_week: savedGoals.workout_days_per_week?.toString() ?? "",
        injuries_limitations: savedGoals.injuries_limitations ?? "",
      })
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [])

  const handleFindMatch = async () => {
    setAiMatchError(null)
    setAiMatchLoading(true)

    try {
      const { data: latestTrainers, error: trainerError } = await getTrainers()
      if (trainerError) {
        setAiMatchError("Could not refresh trainers for matching. Try again.")
        return
      }

      setTrainerList(latestTrainers)

      const { data: authResult } = await supabase.auth.getUser()
      const clientId = authResult.user?.id
      const workoutDays = Number(goalForm.workout_days_per_week)
      const normalizedGoals = {
        ...goalForm,
        workout_days_per_week: Number.isFinite(workoutDays) && workoutDays >= 1 && workoutDays <= 7
          ? workoutDays
          : null,
      }

      if (clientId) {
        const { error: saveError } = await upsertClientGoals(clientId, normalizedGoals)
        if (saveError) {
          console.warn("Could not save client goals:", saveError)
        }
      }

      const res = await fetch("/api/match-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: normalizedGoals,
          trainers: latestTrainers.map((t) => ({
            id: t.id,
            name: t.name,
            specialty: t.specialty,
            specializations: t.specializations,
            rating: t.rating,
            price: t.price,
          })),
        }),
      })

      const { matches } = await res.json()
      if (Array.isArray(matches) && matches.length > 0) {
        setAiMatches(matches)
      } else {
        setAiMatches(null)
        setAiMatchError("No clear matches yet. Try adding more goal details.")
      }
    } catch (err) {
      console.error("match-trainer error:", err)
      setAiMatchError("AI matching failed. Please try again in a moment.")
    } finally {
      setAiMatchLoading(false)
      setMatchModalOpen(false)
    }
  }

  const clearAiMatch = () => setAiMatches(null)

  // If AI match active, show trainers in ranked order with reasons
  const aiMatchMap = aiMatches
    ? new Map(aiMatches.map((m, i) => [m.id, { reason: m.reason, rank: i }]))
    : null

  const filteredTrainers = trainerList
    .filter(trainer => {
      const matchesSearch = trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           trainer.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPrice = trainer.price >= priceRange[0] && trainer.price <= priceRange[1]
      const matchesRating = trainer.rating === 0 ? true : trainer.rating >= minRating
      const matchesSpec = selectedSpecs.length === 0 || 
                         trainer.specializations.some(s => selectedSpecs.includes(s))
      return matchesSearch && matchesPrice && matchesRating && matchesSpec
    })
    .sort((a, b) => {
      if (!aiMatchMap) return 0
      const ra = aiMatchMap.get(a.id)?.rank ?? 999
      const rb = aiMatchMap.get(b.id)?.rank ?? 999
      return ra - rb
    })

  return (
    <AthleteDashboardShell title="Find Trainers" contentClassName="p-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Find Your Perfect Trainer</h1>
                <p className="text-muted-foreground">Discover certified personal trainers near you</p>
              </div>
              <Link href="/map">
                <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
                  <MapIcon className="w-4 h-4 mr-2" />
                  Map View
                </Button>
              </Link>
            </div>
          </div>

          {loadError && (
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-600">
              {loadError}
            </div>
          )}

          {aiMatchError && (
            <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-600">
              {aiMatchError}
            </div>
          )}

          {/* AI Match banner */}
          {aiMatches && (
            <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Showing AI-ranked results for your goals. Top matches are highlighted.</span>
              </div>
              <button onClick={clearAiMatch} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <SlidersHorizontal className="w-5 h-5 text-foreground" />
                  <h2 className="font-semibold text-foreground">Filters</h2>
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
            </aside>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search trainers by name or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>

                {/* Find My Match dialog */}
                <Dialog open={matchModalOpen} onOpenChange={setMatchModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Find My Match
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border-border max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Trainer Matching
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <p className="text-sm text-muted-foreground">Tell us about your goals and we&apos;ll rank the best trainers for you.</p>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-foreground text-sm mb-1 block">Primary Goal</Label>
                          <Input
                            placeholder="e.g. Lose weight, Build muscle, Run a 5K"
                            value={goalForm.primary_goal}
                            onChange={(e) => setGoalForm(f => ({ ...f, primary_goal: e.target.value }))}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-sm mb-1 block">Experience Level</Label>
                          <Input
                            placeholder="e.g. Beginner, Intermediate, Advanced"
                            value={goalForm.experience_level}
                            onChange={(e) => setGoalForm(f => ({ ...f, experience_level: e.target.value }))}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-sm mb-1 block">Preferred Training Style</Label>
                          <Input
                            placeholder="e.g. HIIT, Strength, Yoga, Outdoor"
                            value={goalForm.preferred_training_style}
                            onChange={(e) => setGoalForm(f => ({ ...f, preferred_training_style: e.target.value }))}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-sm mb-1 block">Workouts per Week</Label>
                          <Input
                            placeholder="e.g. 3"
                            type="number"
                            min={1}
                            max={7}
                            value={goalForm.workout_days_per_week}
                            onChange={(e) => setGoalForm(f => ({ ...f, workout_days_per_week: e.target.value }))}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-sm mb-1 block">Injuries / Limitations <span className="text-muted-foreground font-normal">(optional)</span></Label>
                          <Input
                            placeholder="e.g. Bad knee, Lower back pain"
                            value={goalForm.injuries_limitations}
                            onChange={(e) => setGoalForm(f => ({ ...f, injuries_limitations: e.target.value }))}
                            className="bg-input border-border"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleFindMatch}
                        disabled={
                          aiMatchLoading ||
                          !goalForm.primary_goal.trim() ||
                          !goalForm.experience_level.trim() ||
                          !goalForm.preferred_training_style.trim()
                        }
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {aiMatchLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Finding your matches...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Find My Best Trainers
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {mounted ? (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden border-border text-foreground hover:bg-secondary">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="bg-background border-border">
                      <SheetHeader>
                        <SheetTitle className="text-foreground">Filters</SheetTitle>
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
                ) : (
                  <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground lg:hidden">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredTrainers.length} trainers found
                </p>
                {selectedSpecs.length > 0 && (
                  <div className="flex items-center gap-2">
                    {selectedSpecs.map(spec => (
                      <button
                        key={spec}
                        onClick={() => setSelectedSpecs(selectedSpecs.filter(s => s !== spec))}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                      >
                        {spec}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTrainers.map((trainer) => (
                  <TrainerCard
                    key={trainer.id}
                    trainer={trainer}
                    aiReason={aiMatchMap?.get(trainer.id)?.reason}
                  />
                ))}
              </div>

              {filteredTrainers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No trainers found matching your criteria.</p>
                  <Button
                    variant="ghost"
                    className="mt-4 text-primary"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedSpecs([])
                      setPriceRange([0, 150])
                      setMinRating(0)
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
      </div>
    </AthleteDashboardShell>
  )
}
