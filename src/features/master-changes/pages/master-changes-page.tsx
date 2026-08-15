"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, UserCog } from "lucide-react";
import { ModuleTile } from "@/components/module-tile";

const SECTIONS = [
  {
    href: "/master-changes/roles",
    label: "Roles",
    description: "Manage the dashboard user roles and permissions.",
    icon: ShieldCheck,
    iconWrap: "bg-violet-500/10 dark:bg-violet-500/20",
    iconClass: "text-violet-600 dark:text-violet-400",
  },
  {
    href: "/master-changes/officer-types",
    label: "Officer Types",
    description: "Manage the officer type categories used at registration.",
    icon: UserCog,
    iconWrap: "bg-blue-500/10 dark:bg-blue-500/20",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
] as const;

export default function MasterChangesPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Modules
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Master Changes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage reference data used across patrolling operations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {SECTIONS.map((section) => (
            <ModuleTile key={section.href} {...section} />
          ))}
        </div>
      </main>
    </div>
  );
}
