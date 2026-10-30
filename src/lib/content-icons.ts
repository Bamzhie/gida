import {
  Building, Building2, Calculator, Clock, FileCheck, FileText, HardHat, Heart,
  Home, KeyRound, LandPlot, MapPinned, Receipt, Search, Send, ShieldCheck,
  Store, Tag, UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  building: Building,
  "building-2": Building2,
  calculator: Calculator,
  clock: Clock,
  "file-check": FileCheck,
  "file-text": FileText,
  "hard-hat": HardHat,
  heart: Heart,
  home: Home,
  "key-round": KeyRound,
  "land-plot": LandPlot,
  "map-pinned": MapPinned,
  receipt: Receipt,
  search: Search,
  send: Send,
  "shield-check": ShieldCheck,
  store: Store,
  tag: Tag,
  "user-round": UserRound,
};

export function iconFor(name: string | null): LucideIcon | null {
  return name ? (ICONS[name] ?? null) : null;
}
