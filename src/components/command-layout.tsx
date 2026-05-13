"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { COMMAND_NAV_MAIN, isCommandNavActive } from "@/lib/command-nav";
import { ThemeToggle } from "@/components/theme-toggle";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="text-xs font-mono tracking-[1.5px] text-muted-foreground px-3 mb-2">
          OPERATIONS
        </div>
        <nav className="space-y-px">
          {COMMAND_NAV_MAIN.map((item) => {
            const active = isCommandNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-[13px] rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "nav-active bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border mt-auto shrink-0">
        <div className="flex items-center gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-xs">AD</AvatarFallback>
          </Avatar>
          <div className="text-sm min-w-0">
            <div className="font-medium truncate">Admin • Dilshan</div>
            <div className="text-[10px] text-muted-foreground truncate">
              Chief Security Officer
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SidebarBrand() {
  return (
    <div className="px-6 py-6 border-b border-sidebar-border shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold tracking-tight text-xl">AEGIS</div>
          <div className="text-[10px] text-muted-foreground -mt-0.5">COMMAND CENTER</div>
        </div>
      </div>
    </div>
  );
}

export type CommandLayoutProps = {
  /** Top bar (desktop); shown below mobile menu strip */
  header: React.ReactNode;
  /** Optional actions to the right of the theme toggle on desktop */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export function CommandLayout({ header, headerActions, children }: CommandLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarBrand />
        <SidebarNav />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[min(100vw,20rem)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <div className="flex h-full flex-col overflow-hidden">
            <SidebarBrand />
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-xl lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="size-4" />
          </Button>
          <span className="truncate font-semibold">AEGIS</span>
        </div>

        <div className="flex min-h-0 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl sm:h-16 sm:px-8 sm:py-0">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">{header}</div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {headerActions}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
