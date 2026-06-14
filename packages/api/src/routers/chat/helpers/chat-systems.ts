export type ChatSystemType = "doctor_search" | "custom";

export interface ChatSystem {
  description: string;
  enabled: boolean;
  id: ChatSystemType;
  name: string;
}

export interface ChatSystemRegistry {
  getActive: () => ChatSystem[];
  getSystem: (id: ChatSystemType) => ChatSystem | undefined;
  systems: Record<ChatSystemType, ChatSystem>;
}

const SYSTEMS: Record<ChatSystemType, ChatSystem> = {
  doctor_search: {
    id: "doctor_search",
    name: "Doctor Search",
    description: "Find and learn about doctors with AI assistance",
    enabled: true,
  },
  custom: {
    id: "custom",
    name: "Custom Chat",
    description: "General chat interface",
    enabled: false,
  },
};

export const chatSystemRegistry: ChatSystemRegistry = {
  systems: SYSTEMS,
  getActive: () => Object.values(SYSTEMS).filter((s) => s.enabled),
  getSystem: (id) => SYSTEMS[id],
};

export interface Suggestion {
  description?: string;
  label: string;
  value: string;
}
