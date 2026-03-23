import React from "react"
import { Providers } from "@/components/providers"

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex items-center justify-center bg-background">
        {children}
      </div>
    </Providers>
  )
}
