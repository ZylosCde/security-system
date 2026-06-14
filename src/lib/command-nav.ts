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
} from "lucide-react";

export type CommandNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Treat as active for these paths (e.g. schedules + routes) */
  match?: readonly string[];
};

export const COMMAND_NAV_MAIN: readonly CommandNavItem[] = [
  { href: "/", label: "Live Operations", icon: MapPin },
  { href: "/patrols", label: "Patrols", icon: Footprints },
  { href: "/officers", label: "Officers", icon: Users },
  { href: "/devices", label: "Devices", icon: Shield },
  { href: "/checkpoints", label: "Checkpoints", icon: MapPin },
  {
    href: "/schedules",
    label: "Routes & Schedules",
    icon: Clock,
    match: ["/schedules", "/routes"],
  },
  { href: "/violations", label: "Violations", icon: AlertTriangle },
  { href: "/incidents", label: "Incidents", icon: Bell },
] as const;

export const COMMAND_NAV_MASTER: readonly CommandNavItem[] = [
  { href: "/master/clients", label: "Clients", icon: Building2 },
  { href: "/master/sites", label: "Sites", icon: MapPinned },
  { href: "/master/users", label: "Users", icon: UserCog },
] as const;

export function isCommandNavActive(pathname: string, item: CommandNavItem): boolean {
  if (item.match?.length) {
    return item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
