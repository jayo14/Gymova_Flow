import { Bell, CalendarDays, Dumbbell, MessageCircle, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const notifications = [
  {
    id: "booking-reminder",
    title: "Upcoming session reminder",
    body: "You have a training session tomorrow at 7:00 AM. Review your notes and be ready.",
    icon: CalendarDays,
  },
  {
    id: "trainer-message",
    title: "New trainer message",
    body: "Your trainer sent a quick check-in message about your weekly goals.",
    icon: MessageCircle,
  },
  {
    id: "ai-tip",
    title: "AI coach tip",
    body: "Your AI coach has a fresh recovery suggestion based on your recent sessions.",
    icon: Sparkles,
  },
  {
    id: "location-update",
    title: "Map discovery update",
    body: "New approved trainers near your saved area are now available in the map view.",
    icon: Dumbbell,
  },
]

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground">Your latest platform updates, reminders, and trainer activity.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Recent notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl border border-border bg-background/70 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <notification.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{notification.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
