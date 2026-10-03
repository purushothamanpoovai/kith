import {
  CalendarDays,
  Compass,
  Home,
  Landmark,
  MessageCircle,
  PenLine,
  Search,
  Settings,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { NavItemKey } from "@/config/navigation";

const ICONS: Record<NavItemKey | "heritage" | "admin" | "publisherStudio" | "orgDashboard", LucideIcon> = {
  home: Home,
  explore: Compass,
  community: MessageCircle,
  events: CalendarDays,
  create: PenLine,
  mySpace: UserRound,
  search: Search,
  settings: Settings,
  heritage: Landmark,
  admin: Sparkles,
  publisherStudio: PenLine,
  orgDashboard: Landmark,
};

type Props = {
  name: keyof typeof ICONS;
  className?: string;
  strokeWidth?: number;
};

export function NavIcon({ name, className, strokeWidth = 1.75 }: Props) {
  const Icon = ICONS[name];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
