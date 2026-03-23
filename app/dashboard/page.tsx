"use client"

import { getClientBookings } from "@/lib/supabase/bookings"
import { getTrainers } from "@/lib/supabase/trainers"
import type { BookingWithTrainer } from "@/types/booking"
import type { TrainerListItem } from "@/types/trainer"

const aiSuggestions = [
  "Create a beginner workout routine",
  "Help me lose 10 pounds",
  "Suggest trainers for muscle gain"
]

export default function DashboardPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login")
    }
  }, [loading, session, router])
  if (loading || (!session && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Checking your session...</span>
      </div>
    )
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [aiMessage, setAiMessage] = useState("")
  const [bookings, setBookings] = useState<BookingWithTrainer[]>([])
  const [trainerList, setTrainerList] = useState<TrainerListItem[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  const displayName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email?.split("@")[0] ||
    "there"

  useEffect(() => {
    if (!user) return
    getClientBookings(user.id).then(({ data }) => {
      setBookings(data)
      setLoadingBookings(false)
    })
    getTrainers().then(({ data }) => {
      if (data.length > 0) setTrainerList(data)
    })
  }, [user])

  // Derive stats from real bookings
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const workoutsThisWeek = bookings.filter(b =>
    b.status === "completed" &&
    new Date(b.booking_date) >= weekStart
  ).length

  const sessionsThisMonth = bookings.filter(b =>
    b.status === "completed" &&
    new Date(b.booking_date) >= monthStart
  ).length

  const completedDates = bookings
    .filter(b => b.status === "completed")
    .map(b => b.booking_date)
    .sort()

  // Compute streak: count consecutive days ending today/yesterday
  let streak = 0
  if (completedDates.length > 0) {
    const daySet = new Set(completedDates)
    let check = new Date(now)
    check.setHours(0, 0, 0, 0)
    // If no workout today, start from yesterday
    if (!daySet.has(check.toISOString().slice(0, 10))) {
      check.setDate(check.getDate() - 1)
    }
    while (daySet.has(check.toISOString().slice(0, 10))) {
      streak++
      check.setDate(check.getDate() - 1)
    }
  }

  const progressStats = [
    {
      label: "Workouts This Week",
      value: loadingBookings ? "—" : String(workoutsThisWeek),
      icon: Flame,
      change: loadingBookings ? "" : workoutsThisWeek === 0 ? "No sessions yet" : `${workoutsThisWeek} completed`
    },
    {
      label: "Sessions This Month",
      value: loadingBookings ? "—" : String(sessionsThisMonth),
      icon: Target,
      change: loadingBookings ? "" : sessionsThisMonth === 0 ? "Start booking sessions" : "This month"
    },
    {
      label: "Current Streak",
      value: loadingBookings ? "—" : streak > 0 ? `${streak} day${streak !== 1 ? "s" : ""}` : "0 days",
      icon: TrendingUp,
      change: loadingBookings ? "" : streak >= 7 ? "Keep it up! 🔥" : streak > 0 ? "Great consistency!" : "Book a session to start"
    }
  ]

  // Upcoming sessions: confirmed/pending bookings from today onwards
  const upcomingSessions = bookings
    .filter(b =>
      (b.status === "confirmed" || b.status === "pending") &&
      new Date(b.booking_date) >= new Date(now.toDateString())
    )
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date))
    .slice(0, 3)

  // Format date nicely
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00")
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    if (d.toDateString() === today.toDateString()) return "Today"
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Recommended trainers: top-rated from DB or fallback demo
  const recommendedTrainers = trainerList
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {displayName}</h1>
          <p className="text-muted-foreground">Here is your fitness overview for today.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search trainers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {progressStats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-card-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-primary mt-1">{stat.change}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-card-foreground">Upcoming Sessions</CardTitle>
              <Link href="/dashboard/bookings">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingBookings ? (
                <p className="text-sm text-muted-foreground py-4">Loading sessions...</p>
              ) : upcomingSessions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">No upcoming sessions.</p>
                  <Link href="/trainers">
                    <Button variant="ghost" size="sm" className="mt-2 text-primary">
                      Find a Trainer
                    </Button>
                  </Link>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-card-foreground">{session.trainers.name}</p>
                      <p className="text-sm text-muted-foreground">{session.trainers.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-card-foreground">{formatDate(session.booking_date)}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {session.start_time.slice(0, 5)}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{session.trainers.location}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-card-foreground">Recommended Trainers</CardTitle>
              <Link href="/trainers">
                <Button variant="ghost" size="sm" className="text-primary">
                  Browse All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendedTrainers.map((trainer) => (
                  <Link key={trainer.id} href={`/trainers/${trainer.id}`}>
                    <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-center">
                      <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3" />
                      <p className="font-medium text-card-foreground">{trainer.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{trainer.specialty}</p>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-xs text-card-foreground">{trainer.rating}</span>
                        <span className="text-xs text-muted-foreground">({trainer.reviews})</span>
                      </div>
                      <p className="text-sm font-semibold text-primary">${trainer.price}/session</p>
                    </div>
                  </Link>
                ))}
              </div>
              {recommendedTrainers.length === 0 && !loadingBookings && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No trainers available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Fitness Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ask me anything about fitness, workouts, or finding the right trainer.
              </p>
              
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setAiMessage(suggestion)}
                    className="w-full text-left text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-card-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Input
                  placeholder="Ask AI Coach..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  className="pr-10 bg-input border-border"
                />
                <Link href={`/ai-coach${aiMessage ? `?q=${encodeURIComponent(aiMessage)}` : ""}`}>
                  <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-primary hover:bg-primary/90">
                    <Send className="w-3 h-3 text-primary-foreground" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/trainers" className="block">
                <Button variant="outline" className="w-full justify-start border-border text-foreground hover:bg-secondary">
                  <Search className="w-4 h-4 mr-2" />
                  Find a Trainer
                </Button>
              </Link>
              <Link href="/map" className="block">
                <Button variant="outline" className="w-full justify-start border-border text-foreground hover:bg-secondary">
                  <MapPin className="w-4 h-4 mr-2" />
                  View Map
                </Button>
              </Link>
              <Link href="/messages" className="block">
                <Button variant="outline" className="w-full justify-start border-border text-foreground hover:bg-secondary">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
