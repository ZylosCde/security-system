import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Clock,
  MapPin,
  Shield,
  Users,
  AlertTriangle,
  Building2,
  MapPinned,
  UserCog,
  Footprints,
  Timer,
  CalendarRange,
} from "lucide-react";

export type CommandNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Treat as active for these paths (e.g. schedules + routes) */
  match?: readonly string[];
};

export const COMMAND_NAV_MAIN: readonly CommandNavItem[] = [
  { href: "/patrolling", label: "Live Operations", icon: MapPin },
  { href: "/patrolling/patrols", label: "Patrols", icon: Footprints },
  { href: "/patrolling/officers", label: "Officers", icon: Users },
  { href: "/patrolling/roster", label: "Duty Roster", icon: CalendarRange },
  { href: "/patrolling/devices", label: "Devices", icon: Shield },
  { href: "/patrolling/checkpoints", label: "Checkpoints", icon: MapPin },
  {
    href: "/patrolling/schedules",
    label: "Routes & Schedules",
    icon: Clock,
    match: ["/patrolling/schedules", "/patrolling/routes"],
  },
  { href: "/patrolling/violations", label: "Violations", icon: AlertTriangle },
  { href: "/patrolling/incidents", label: "Incidents", icon: Bell },
  { href: "/patrolling/escalations", label: "Schedule Escalations", icon: Timer },
] as const;

export const COMMAND_NAV_MASTER: readonly CommandNavItem[] = [
  { href: "/patrolling/master/clients", label: "Clients", icon: Building2 },
  { href: "/patrolling/master/sites", label: "Sites", icon: MapPinned },
  { href: "/patrolling/master/users", label: "Users", icon: UserCog },
] as const;

export function isCommandNavActive(pathname: string, item: CommandNavItem): boolean {
  if (item.match?.length) {
    return item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  if (item.href === "/patrolling") return pathname === "/patrolling";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
