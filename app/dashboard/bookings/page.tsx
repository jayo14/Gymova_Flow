"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, MoreVertical, User, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getClientBookings } from "@/lib/supabase/bookings"
import { useAuth } from "@/components/auth/AuthProvider"
import type { BookingWithTrainer } from "@/types/booking"

type DisplayBooking = {
  id: string
  trainer: string
  specialty: string
  date: string
  time: string
  location: string
  status: string
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function formatTime(startTime: string, endTime: string): string {
  const toDisplay = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    const period = h >= 12 ? "PM" : "AM"
    const displayH = h % 12 === 0 ? 12 : h % 12
    return `${displayH}:${String(m).padStart(2, "0")} ${period}`
  }
  return `${toDisplay(startTime)} - ${toDisplay(endTime)}`
}

function mapToDisplay(booking: BookingWithTrainer): DisplayBooking {
  return {
    id: booking.id,
    trainer: booking.trainers?.name ?? "Unknown Trainer",
    specialty: booking.trainers?.specialty ?? "",
    date: formatDate(booking.booking_date),
    time: formatTime(booking.start_time, booking.end_time),
    location: booking.trainers?.location ?? "",
    status: booking.status,
  }
}

const UPCOMING_STATUSES = ["pending", "confirmed"]
const PAST_STATUSES = ["completed", "cancelled"]

function BookingCard({ booking }: { booking: DisplayBooking }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary" />
            <div>
              <h3 className="font-semibold text-card-foreground">{booking.trainer}</h3>
              <p className="text-sm text-muted-foreground">{booking.specialty}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              booking.status === "confirmed" 
                ? "bg-primary/20 text-primary" 
                : booking.status === "pending"
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-muted text-muted-foreground"
            }`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Reschedule</DropdownMenuItem>
                <DropdownMenuItem>Message Trainer</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Cancel Booking</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {booking.date}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {booking.time}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {booking.location}
          </div>
        </div>

        {booking.status !== "completed" && booking.status !== "cancelled" && (
          <div className="flex items-center gap-2">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              <User className="w-4 h-4 mr-2" />
              View Trainer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function BookingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [upcomingBookings, setUpcomingBookings] = useState<DisplayBooking[]>([])
  const [pastBookings, setPastBookings] = useState<DisplayBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    setLoading(true)
    setError(null)

    getClientBookings(user.id).then(({ data, error: fetchError }) => {
      setLoading(false)

      if (fetchError) {
        setError("Failed to load bookings. Please try again.")
        toast({
          title: "Error loading bookings",
          description: "Failed to load bookings. Please try again.",
          variant: "destructive",
        })
        return
      }

      setUpcomingBookings(
        data
          .filter((b) => UPCOMING_STATUSES.includes(b.status))
          .sort((a, b) => a.booking_date.localeCompare(b.booking_date))
          .map(mapToDisplay)
      )
      setPastBookings(
        data
          .filter((b) => PAST_STATUSES.includes(b.status))
          .map(mapToDisplay)
      )
    })
  }, [user, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">Manage your training sessions</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">Manage your training sessions</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground">Manage your training sessions</p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-background">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-background">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <p className="text-muted-foreground py-4">No upcoming bookings.</p>
          ) : (
            upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length === 0 ? (
            <p className="text-muted-foreground py-4">No past bookings.</p>
          ) : (
            pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
