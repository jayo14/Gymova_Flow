"use client"

import { RoleGate } from "@/components/auth/RoleGate"

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allowedRoles={["client"]}>{children}</RoleGate>
}
