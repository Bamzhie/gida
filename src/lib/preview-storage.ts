const REQUESTS_KEY = "gida-preview-requests";
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
  for (const key of [REQUESTS_KEY, AGENT_ENQUIRIES_KEY]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage access failures.
    }
  }
}
