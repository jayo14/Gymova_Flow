import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dumbbell, Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-primary shadow-2xl">
              <Dumbbell className="h-12 w-12 text-primary-foreground animate-bounce" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-8xl font-black tracking-tighter text-foreground">404</h1>
          <h2 className="text-2xl font-bold text-foreground">Out of Bounds!</h2>
          <p className="text-muted-foreground text-lg">
            Looks like you've wandered off the track. The page you're looking for doesn't exist or has been relocated.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <Link href="/">
            <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
          <Link href="/trainers">
            <Button variant="outline" className="w-full h-12 border-border text-foreground hover:bg-secondary font-semibold gap-2">
              <Search className="h-4 w-4" />
              Find a Trainer
            </Button>
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="pt-8 flex justify-center gap-8 text-muted-foreground/30">
          <div className="h-1 w-12 rounded-full bg-current" />
          <div className="h-1 w-1 rounded-full bg-current" />
          <div className="h-1 w-12 rounded-full bg-current" />
        </div>
      </div>
    </div>
  )
}
