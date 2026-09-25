import { PREVIEW_AGENTS } from "@/lib/preview-data";

export function searchPreviewAgents(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return PREVIEW_AGENTS;
  return PREVIEW_AGENTS.filter((agent) =>
    [agent.name, agent.agency, ...agent.areas, ...agent.specialisations]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}
