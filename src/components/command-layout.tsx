"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  COMMAND_NAV_MAIN,
  COMMAND_NAV_MASTER,
  isCommandNavActive,
} from "@/lib/command-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/AuthContext";

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: readonly import("@/lib/command-nav").CommandNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="mb-2 px-3 text-xs font-mono tracking-[1.5px] text-muted-foreground">
        {title}
      </div>
      <nav className="mb-4 space-y-px">
        {items.map((item) => {
          const active = isCommandNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-[13px] text-sm font-medium transition-colors",
                active
                  ? "nav-active bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, isMaster, logout } = useAuth();

  const initials =
    user?.username?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    "??";

  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavSection
          title="OPERATIONS"
          items={COMMAND_NAV_MAIN}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        {isMaster ? (
          <NavSection
            title="MASTER SETUP"
            items={COMMAND_NAV_MASTER}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ) : null}
      </div>

      <div className="mt-auto shrink-0 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-sm">
            <div className="flex items-center gap-2 truncate font-medium">
              <span className="truncate">{user?.username ?? "User"}</span>
              {user?.role ? (
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
                    user.role === "MASTER" && "bg-violet-500/15 text-violet-700 dark:text-violet-300",
                    user.role === "ADMIN" && "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                    user.role === "USER" && "bg-muted text-muted-foreground"
                  )}
                >
                  {user.role}
                </span>
              ) : null}
            </div>
            <div className="truncate text-[10px] text-muted-foreground">
              {user?.email ?? ""}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start gap-2 text-muted-foreground"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </>
  );
}

function SidebarBrand() {
  return (
    <div className="shrink-0 border-b border-sidebar-border px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-semibold tracking-tight">AEGIS</div>
          <div className="-mt-0.5 text-[10px] text-muted-foreground">COMMAND CENTER</div>
        </div>
      </div>
    </div>
  );
}

export type CommandLayoutProps = {
  header: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export function CommandLayout({ header, headerActions, children }: CommandLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarBrand />
        <SidebarNav />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw,20rem)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
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
