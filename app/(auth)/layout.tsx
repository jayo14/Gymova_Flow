import { Check, Dumbbell } from "lucide-react"

const authHighlights = [
  "Secure account recovery via Supabase email links",
  "Quick password reset with instant account protection",
  "Keeps your fitness plans and trainer chats safe",
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-secondary/50 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative z-10 text-center max-w-lg">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl" />
              <div className="relative h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                <Dumbbell className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">GymovaFlow Account Security</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Recover your account safely and get back to your workouts without losing progress.
          </p>

          <div className="space-y-4 text-left">
            {authHighlights.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 shrink-0">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">{children}</div>
    </div>
  )
}
