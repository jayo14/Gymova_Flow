"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Star,
} from "lucide-react"

import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getTrainerAvailability } from "@/lib/supabase/availability"
import { createBooking } from "@/lib/supabase/bookings"
import { getTrainerById } from "@/lib/supabase/trainers"
import type { TrainerListItem } from "@/types/trainer"

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const JS_DAY_TO_AVAILABILITY_DAY = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

function generateCalendarDays(year: number, month: number): Array<number | null> {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDay = firstDay.getDay()

  const days: Array<number | null> = []
  for (let i = 0; i < startingDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateKey(year: number, month: number, day: number): string {
  const monthStr = String(month + 1).padStart(2, "0")
  const dayStr = String(day).padStart(2, "0")
  return `${year}-${monthStr}-${dayStr}`
}

function normalizeToDbTime(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null

  if (value.includes("AM") || value.includes("PM")) {
    const [time, period] = value.split(" ")
    const [hours, minutes] = time.split(":")
    const parsedHours = parseInt(hours, 10)
    if (Number.isNaN(parsedHours) || !minutes) return null

    let h = parsedHours
    if (period === "PM" && h !== 12) h += 12
    if (period === "AM" && h === 12) h = 0
    return `${String(h).padStart(2, "0")}:${minutes}:00`
  }

  const pieces = value.split(":")
  if (pieces.length < 2) return null

  const hours = parseInt(pieces[0], 10)
  const minutes = parseInt(pieces[1], 10)
  const seconds = pieces.length >= 3 ? parseInt(pieces[2], 10) : 0

  if ([hours, minutes, seconds].some(Number.isNaN)) return null
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function addOneHour(time: string): string {
  const [h, m, s] = time.split(":").map((piece) => parseInt(piece, 10))
  const newH = (h + 1) % 24
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function toDisplayTime(raw: string): string {
  if (raw.includes("AM") || raw.includes("PM")) return raw

  const pieces = raw.split(":")
  if (pieces.length < 2) return raw

  const hour = parseInt(pieces[0], 10)
  const minute = pieces[1]
  if (Number.isNaN(hour)) return raw

  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute} ${ampm}`
}

function getAvailableDatesFromWeeklySchedule(
  availability: Record<string, string[]>,
  daysAhead = 60
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let offset = 0; offset <= daysAhead; offset++) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)

    const dayKey = JS_DAY_TO_AVAILABILITY_DAY[date.getDay()]
    const slots = availability[dayKey] ?? []
    if (slots.length === 0) continue

    const dateKey = formatLocalDateKey(date)
    const uniqueDisplaySlots = Array.from(new Set(slots.map((slot) => toDisplayTime(slot))))
    result[dateKey] = uniqueDisplaySlots
  }

  return result
}

export default function BookingPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const trainerId = params.id

  const [trainer, setTrainer] = useState<TrainerListItem | null>(null)
  const [trainerLoading, setTrainerLoading] = useState(true)
  const [trainerError, setTrainerError] = useState<string | null>(null)

  const [availability, setAvailability] = useState<Record<string, string[]>>({})
  const [availabilityLoading, setAvailabilityLoading] = useState(true)

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [goalNote, setGoalNote] = useState("")
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTrainer() {
      setTrainerLoading(true)
      setTrainerError(null)

      const { data, error } = await getTrainerById(trainerId)

      if (cancelled) return

      if (error) {
        setTrainerError(error)
        setTrainer(null)
      } else if (!data) {
        setTrainerError("Trainer not found.")
        setTrainer(null)
      } else {
        setTrainer(data)
      }

      setTrainerLoading(false)
    }

    void loadTrainer()

    return () => {
      cancelled = true
    }
  }, [trainerId])

  useEffect(() => {
    let cancelled = false

    async function loadAvailability() {
      if (!trainer?.user_id) {
        setAvailability({})
        setAvailabilityLoading(false)
        return
      }

      setAvailabilityLoading(true)
      const { data } = await getTrainerAvailability(trainer.user_id)
      if (!cancelled) {
        setAvailability(data)
        setAvailabilityLoading(false)
      }
    }

    void loadAvailability()

    return () => {
      cancelled = true
    }
  }, [trainer])

  const days = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentMonth, currentYear]
  )

  const availableSlots = useMemo(
    () => getAvailableDatesFromWeeklySchedule(availability),
    [availability]
  )

  const isDateAvailable = (day: number | null) => {
    if (!day) return false
    const dateKey = formatDateKey(currentYear, currentMonth, day)
    return (availableSlots[dateKey] ?? []).length > 0
  }

  const getAvailableSlotsForDate = () => {
    if (!selectedDate) return []
    return availableSlots[selectedDate] ?? []
  }

  const handleDateSelect = (day: number) => {
    const dateKey = formatDateKey(currentYear, currentMonth, day)
    setSelectedDate(dateKey)
    setSelectedTime(null)
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((prev) => prev - 1)
      return
    }
    setCurrentMonth((prev) => prev - 1)
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((prev) => prev + 1)
      return
    }
    setCurrentMonth((prev) => prev + 1)
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return ""
    const [year, month, day] = selectedDate.split("-").map((value) => parseInt(value, 10))
    const selected = new Date(year, month - 1, day)
    return selected.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleConfirmBooking = async () => {
    if (!user) {
      setBookingError("You must be logged in to book a session.")
      return
    }
    if (!selectedDate || !selectedTime) {
      setBookingError("Please select a date and time.")
      return
    }
    if (!trainer) {
      setBookingError("Trainer data is not available.")
      return
    }

    const startTime = normalizeToDbTime(selectedTime)
    if (!startTime) {
      setBookingError("Invalid time slot selected. Please choose another time.")
      return
    }

    const numericTrainerId =
      typeof trainer.id === "string" ? parseInt(trainer.id, 10) : trainer.id

    if (Number.isNaN(numericTrainerId)) {
      setBookingError("Invalid trainer ID. Please try again.")
      return
    }

    setIsSubmitting(true)
    setBookingError(null)

    const { error } = await createBooking({
      client_id: user.id,
      trainer_id:
        typeof trainer.id === "string" ? parseInt(trainer.id, 10) : trainer.id,
      booking_date: selectedDate,
      start_time: startTime,
      end_time: addOneHour(startTime),
      status: "pending",
      goal_note: goalNote.trim() || null,
    })

    setIsSubmitting(false)

    if (error) {
      setBookingError(error)
      return
    }

    toast({
      title: "Booking request sent to trainer",
      description: `Your session with ${trainer.name} on ${formatSelectedDate()} at ${selectedTime} is pending confirmation.`,
    })

    router.push("/dashboard/bookings")
  }

  if (trainerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (trainerError || !trainer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {trainerError ?? "Trainer not found."}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href={`/trainers/${trainer.id}`}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Profile</span>
          </Link>
          <span className="text-muted-foreground">Step {step} of 2</span>
        </div>
      </header>

      <main className="pt-16 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-8">Book a Session</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {step === 1 && (
                <>
                  <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-card-foreground">Select Date</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium text-card-foreground min-w-[120px] text-center">
                          {MONTH_NAMES[currentMonth]} {currentYear}
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAY_NAMES.map((dayName) => (
                          <div key={dayName} className="text-center text-xs font-medium text-muted-foreground py-2">
                            {dayName}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                          const dateKey = day ? formatDateKey(currentYear, currentMonth, day) : ""
                          const isAvailable = isDateAvailable(day)
                          const isSelected = selectedDate === dateKey

                          return (
                            <button
                              key={`${dateKey}-${index}`}
                              disabled={!isAvailable}
                              onClick={() => day && isAvailable && handleDateSelect(day)}
                              className={[
                                "aspect-square rounded-lg text-sm font-medium transition-colors",
                                !day ? "invisible" : "",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : isAvailable
                                    ? "bg-secondary hover:bg-primary/20 text-card-foreground"
                                    : "text-muted-foreground/50 cursor-not-allowed",
                              ].join(" ")}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedDate && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-card-foreground">Select Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{formatSelectedDate()}</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {getAvailableSlotsForDate().map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={[
                                "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                selectedTime === time
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary hover:bg-primary/20 text-card-foreground",
                              ].join(" ")}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    disabled={!selectedDate || !selectedTime || availabilityLoading}
                    onClick={() => setStep(2)}
                  >
                    Continue to Review
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-card-foreground">Review Your Booking</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-secondary" />
                        <div>
                          <h3 className="font-semibold text-card-foreground">{trainer.name}</h3>
                          <p className="text-sm text-muted-foreground">{trainer.specialty}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            <span className="text-sm text-card-foreground">{trainer.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 py-4 border-y border-border">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span className="text-card-foreground">{formatSelectedDate()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-primary" />
                          <span className="text-card-foreground">{selectedTime} (60 minutes)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span className="text-card-foreground">{trainer.location}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">
                          Goal note <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea
                          value={goalNote}
                          onChange={(e) => setGoalNote(e.target.value)}
                          placeholder="e.g. I want to lose weight and improve my endurance..."
                          rows={3}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-card-foreground">Session Fee</span>
                        <span className="text-xl font-bold text-primary">${trainer.price}</span>
                      </div>

                      {bookingError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          {bookingError}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 border-border text-foreground hover:bg-secondary"
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleConfirmBooking}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary" />
                      <div>
                        <p className="font-medium text-card-foreground">{trainer.name}</p>
                        <p className="text-sm text-muted-foreground">{trainer.specialty}</p>
                      </div>
                    </div>

                    <div className="space-y-2 py-4 border-y border-border text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="text-card-foreground">
                          {selectedDate ? formatSelectedDate().split(",")[0] : "Not selected"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span className="text-card-foreground">{selectedTime || "Not selected"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="text-card-foreground">60 minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-card-foreground">Total</span>
                      <span className="text-2xl font-bold text-primary">${trainer.price}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Free cancellation up to 24h before</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
