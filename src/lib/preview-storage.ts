const FAVORITES_KEY = "gida-preview-favorites";
const REQUESTS_KEY = "gida-preview-requests";
const ENQUIRIES_KEY = "gida-preview-enquiries";
const AGENT_ENQUIRIES_KEY = "gida-preview-agent-enquiries";

export type PreviewRequest = {
  id: string;
  title: string;
  listingType: "RENT" | "SALE";
  propertyType: string;
  location: string;
  minBudget: string;
  maxBudget: string;
  bedrooms: string;
  bathrooms: string;
  furnishing: string;
  amenities: string[];
  availability: string;
  notes: string;
  name: string;
  contact: string;
  createdAt: string;
};

export type PreviewEnquiry = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  action: "contact" | "viewing";
  name: string;
  contact: string;
  message: string;
  createdAt: string;
};

export type PreviewAgentEnquiry = {
  id: string;
  agentId: string;
  agentName: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A blocked or full localStorage should not break the preview UI.
  }
}

export function getFavoriteIds(): string[] {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function saveFavorite(id: string): string[] {
  const ids = getFavoriteIds();
  const next = ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
  writeJson(FAVORITES_KEY, next);
  return next;
}

export function getPreviewRequests(): PreviewRequest[] {
  return readJson<PreviewRequest[]>(REQUESTS_KEY, []);
}

export function savePreviewRequest(request: Omit<PreviewRequest, "id" | "createdAt">): PreviewRequest {
  const requests = getPreviewRequests();
  const saved = {
    ...request,
    id: `request-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeJson(REQUESTS_KEY, [saved, ...requests]);
  return saved;
}

export function getPreviewEnquiries(): PreviewEnquiry[] {
  return readJson<PreviewEnquiry[]>(ENQUIRIES_KEY, []);
}

export function savePreviewEnquiry(
  request: Omit<PreviewEnquiry, "id" | "createdAt">
): PreviewEnquiry {
  const enquiries = getPreviewEnquiries();
  const saved = {
    ...request,
    id: `enquiry-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeJson(ENQUIRIES_KEY, [saved, ...enquiries]);
  return saved;
}

export function getPreviewAgentEnquiries(): PreviewAgentEnquiry[] {
  return readJson<PreviewAgentEnquiry[]>(AGENT_ENQUIRIES_KEY, []);
}

export function savePreviewAgentEnquiry(
  request: Omit<PreviewAgentEnquiry, "id" | "createdAt">
): PreviewAgentEnquiry {
  const enquiries = getPreviewAgentEnquiries();
  const saved = {
    ...request,
    id: `agent-enquiry-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeJson(AGENT_ENQUIRIES_KEY, [saved, ...enquiries]);
  return saved;
}

export function clearPreviewData(): void {
  if (!canUseStorage()) return;
  for (const key of [FAVORITES_KEY, REQUESTS_KEY, ENQUIRIES_KEY, AGENT_ENQUIRIES_KEY]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage access failures.
    }
  }
}

export function validatePreviewContact(value: string): boolean {
  const contact = value.trim();
  if (!contact) return false;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phone = /^[+()\d\s-]{7,}$/;
  return email.test(contact) || phone.test(contact);
}

export function validateBudgetRange(min: string, max: string): boolean {
  const minimum = min.trim() === "" ? 0 : Number(min);
  const maximum = max.trim() === "" ? Number.POSITIVE_INFINITY : Number(max);
  return (
    Number.isFinite(minimum) &&
    !Number.isNaN(maximum) &&
    minimum >= 0 &&
    maximum >= 0 &&
    minimum <= maximum
  );
}
