import {
  Building,
  Building2,
  Clock,
  FileCheck,
  HardHat,
  Home,
  KeyRound,
  LandPlot,
  Receipt,
  Search,
  ShieldCheck,
  Store,
  Tag,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryCard = {
  label: string;
  type: string;
  category?: "SHORTLET" | "NEWHOMES";
  icon: LucideIcon;
};

export type CategoryGroup = {
  title: string;
  blurb: string;
  listingType: "RENT" | "SALE";
  badge: string;
  icon: LucideIcon;
  cards: CategoryCard[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: "For rent",
    blurb: "Places to move into, with yearly rent and visible fees.",
    listingType: "RENT",
    badge: "Rent",
    icon: KeyRound,
    cards: [
      { label: "Apartments", type: "APARTMENT", icon: Building2 },
      { label: "Houses", type: "HOUSE", icon: Home },
      { label: "Townhouses", type: "TOWNHOUSE", icon: Building },
      { label: "Commercial", type: "COMMERCIAL", icon: Store },
      { label: "Short-let", type: "APARTMENT", category: "SHORTLET", icon: Clock },
    ],
  },
  {
    title: "For sale",
    blurb: "Homes to buy, plus land and commercial property.",
    listingType: "SALE",
    badge: "Sale",
    icon: Tag,
    cards: [
      { label: "Apartments", type: "APARTMENT", icon: Building2 },
      { label: "Houses", type: "HOUSE", icon: Home },
      { label: "Land", type: "LAND", icon: LandPlot },
      { label: "Commercial", type: "COMMERCIAL", icon: Store },
      { label: "New homes", type: "HOUSE", category: "NEWHOMES", icon: HardHat },
    ],
  },
];

export const TRUST_POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "Clear status",
    body: "Preview examples show what each check can mean instead of hiding it behind one vague badge.",
  },
  {
    icon: Receipt,
    title: "Visible costs",
    body: "Sample listing details make space for rent, agency fees, legal fees and deposits to appear together.",
  },
  {
    icon: FileCheck,
    title: "Illustrative freshness",
    body: "Sample dates help show how the future listing page will communicate information age.",
  },
  {
    icon: UserRound,
    title: "Human context",
    body: "The agent directory is a preview of the profiles and enquiry paths planned for the service.",
  },
];

export const LISTING_STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: FileCheck,
    title: "Create an account",
    body: "Choose the account path that matches the kind of property or person you represent.",
  },
  {
    icon: KeyRound,
    title: "Show your context",
    body: "The future profile can make agency, landlord and developer information easier to understand.",
  },
  {
    icon: Building2,
    title: "Prepare a listing",
    body: "Add the property details, photos, price and availability in one place.",
  },
  {
    icon: Search,
    title: "Manage interest",
    body: "The future workflow brings enquiries and viewing requests into a single account view.",
  },
];

export const AREAS = [
  "Lekki",
  "Victoria Island",
  "Ikoyi",
  "Ikeja GRA",
  "Yaba",
  "Surulere",
  "Ajah",
  "Magodo",
  "Gbagada",
  "Oniru",
];

export const AUDIENCE_PATHS: {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  cta: string;
}[] = [
  {
    icon: Search,
    title: "Looking for a place",
    body: "Search sample homes, compare the visible costs and preview a local enquiry.",
    href: "/listings",
    cta: "Explore listings",
  },
  {
    icon: UserRound,
    title: "Looking for an agent",
    body: "Browse sample profiles by area and speciality, then preview a local enquiry.",
    href: "/agents",
    cta: "View agent directory",
  },
  {
    icon: Building2,
    title: "Looking for something specific",
    body: "Save a structured request in this browser and see how the future flow will work.",
    href: "/requests",
    cta: "Post a property request",
  },
];

export const LANDLORD_PATHS: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: Building2,
    title: "Landlords and agents",
    body: "List a home or commercial property, keep the important facts together and prepare for enquiries.",
  },
  {
    icon: HardHat,
    title: "Property developers",
    body: "Present a development with its unit types, pricing and availability instead of splitting every unit into a separate ad.",
  },
];
