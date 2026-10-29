export type PreviewAgent = {
  id: string;
  name: string;
  agency: string;
  initials: string;
  verified: boolean;
  areas: string[];
  specialisations: string[];
  responseTime: string;
  listings: number;
  bio: string;
  phone: string;
};

export const PREVIEW_AGENTS: readonly PreviewAgent[] = [
  {
    id: "agent-1",
    name: "Adebayo Ogundele",
    agency: "Harcourt Court Properties",
    initials: "AO",
    verified: true,
    areas: ["Victoria Island", "Ikoyi", "Oniru"],
    specialisations: ["Serviced apartments", "Short-let"],
    responseTime: "Usually replies within 2 hours",
    listings: 12,
    bio: "A Lagos property consultant focused on serviced apartments, short-let homes and well-placed residential listings.",
    phone: "0803 000 0001",
  },
  {
    id: "agent-2",
    name: "Ngozi Eze",
    agency: "Lekki Homes Ltd",
    initials: "NE",
    verified: true,
    areas: ["Lekki Phase 1", "Ajah", "Sangotedo"],
    specialisations: ["Family flats", "Estates"],
    responseTime: "Usually replies within 4 hours",
    listings: 9,
    bio: "Helping families find practical homes and estates across the Lekki corridor.",
    phone: "0803 000 0002",
  },
  {
    id: "agent-3",
    name: "Tunde Bakare",
    agency: "Mainland Realty",
    initials: "TB",
    verified: false,
    areas: ["Ikeja", "Yaba", "Surulere"],
    specialisations: ["Self contain", "Hostels"],
    responseTime: "Usually replies within a day",
    listings: 6,
    bio: "Covering mainland Lagos homes, student accommodation and affordable rental options.",
    phone: "0803 000 0003",
  },
  {
    id: "agent-4",
    name: "Funmi Adeyemi",
    agency: "Ikoyi Reserve",
    initials: "FA",
    verified: true,
    areas: ["Ikoyi", "Victoria Island"],
    specialisations: ["Luxury rentals", "Penthouses"],
    responseTime: "Usually replies within 1 hour",
    listings: 15,
    bio: "A specialist in premium Ikoyi and Victoria Island homes, including penthouses and luxury rentals.",
    phone: "0803 000 0004",
  },
  {
    id: "agent-5",
    name: "Chinedu Nwosu",
    agency: "Gbagada Estates",
    initials: "CN",
    verified: false,
    areas: ["Gbagada", "Magodo", "Kosofe"],
    specialisations: ["Terraces", "Bungalows"],
    responseTime: "Usually replies within 6 hours",
    listings: 4,
    bio: "A local consultant for terraces, bungalows and homes around Gbagada and Magodo.",
    phone: "0803 000 0005",
  },
  {
    id: "agent-6",
    name: "Aisha Bello",
    agency: "Yaba Living",
    initials: "AB",
    verified: true,
    areas: ["Yaba", "Surulere", "Ebute Metta"],
    specialisations: ["Studio flats", "New builds"],
    responseTime: "Usually replies within 3 hours",
    listings: 8,
    bio: "Helping renters and buyers find studio flats and new-build homes on the mainland.",
    phone: "0803 000 0006",
  },
];

export function searchPreviewAgents(query: string): readonly PreviewAgent[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return PREVIEW_AGENTS;
  return PREVIEW_AGENTS.filter((agent) =>
    [agent.name, agent.agency, ...agent.areas, ...agent.specialisations]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}
