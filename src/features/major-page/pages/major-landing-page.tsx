"use client";

import Image from "next/image";
import { Clock3, DoorOpen, Footprints, LogOut, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/features/auth/auth-context";
import { ModuleTile } from "@/components/module-tile";

const MODULES = [
  {
    href: "/attendance",
    label: "Attendance",
    description: "Track officer shift check-ins and attendance records.",
    icon: Clock3,
    iconWrap: "bg-blue-500/10 dark:bg-blue-500/20",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  {
    href: "/patrolling",
    label: "Patrolling",
    description: "Live operations, patrols, devices, checkpoints and schedules.",
    icon: Footprints,
    iconWrap: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/gatepass",
    label: "Gate Pass",
    description: "Issue and track visitor and vehicle gate passes.",
    icon: DoorOpen,
    iconWrap: "bg-amber-500/10 dark:bg-amber-500/20",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    href: "/master-changes",
    label: "Master Changes",
    description: "Review and approve pending changes to master records.",
    icon: Settings2,
    iconWrap: "bg-violet-500/10 dark:bg-violet-500/20",
    iconClass: "text-violet-600 dark:text-violet-400",
  },
] as const;

export default function MajorLandingPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-transparent">
            <Image src="/icon.png" alt="CatalystDigital Logo" width={36} height={36} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-tight">CatalystDigital</div>
            <div className="-mt-0.5 text-[10px] text-muted-foreground">COMMAND CENTER</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => logout()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="mb-8 sm:mb-12">
          <div className="text-sm text-muted-foreground">Welcome{user?.username ? `, ${user.username}` : ""}</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Select a module</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {MODULES.map((mod) => (
            <ModuleTile key={mod.href} {...mod} />
          ))}
        </div>
      </main>
    </div>
  );
}
