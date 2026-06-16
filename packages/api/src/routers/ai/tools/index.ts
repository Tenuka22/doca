import type { ClerkRequestContext } from "../../../context";
import { createCheckAvailabilityTool } from "./check-availability";
import { createGetDoctorProfileTool } from "./get-doctor-profile";
import { createGetStressTipsTool } from "./get-stress-tips";
import { createGetUpcomingSessionsTool } from "./get-upcoming-sessions";
import { createGetWellnessInfoTool } from "./get-wellness-info";
import { createSearchDoctorsTool } from "./search-doctors";
import { createTransferToAgentTool } from "./transfer-to-agent";

export function getAgentInfo() {
  return [
    {
      id: "coordinator",
      name: "Coordinator",
      description: "Routes queries to the right agent",
      tools: ["transfer_to_agent"],
    },
    {
      id: "db",
      name: "Database Assistant",
      description: "Doctor search, profiles, appointments, availability",
      tools: [
        "search_doctors",
        "get_doctor_profile",
        "check_availability",
        "get_upcoming_sessions",
      ],
    },
    {
      id: "general",
      name: "General Assistant",
      description: "Wellness tips, stress management, general Q&A",
      tools: ["get_wellness_info", "get_stress_tips"],
    },
  ];
}

export function createAiTools(context: ClerkRequestContext) {
  return {
    transferToAgent: createTransferToAgentTool(context),
    searchDoctors: createSearchDoctorsTool(context),
    getDoctorProfile: createGetDoctorProfileTool(context),
    checkAvailability: createCheckAvailabilityTool(context),
    getUpcomingSessions: createGetUpcomingSessionsTool(context),
    getWellnessInfo: createGetWellnessInfoTool(context),
    getStressTips: createGetStressTipsTool(context),
  };
}
