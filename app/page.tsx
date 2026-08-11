"use client"

import { AppStateProvider } from "@/hooks/use-app-state"
import { AppShell } from "@/components/app-shell"

export default function Page() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  )
}
