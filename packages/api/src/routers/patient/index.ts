import { approveGuardianRequestRoute } from "./routes/approve-guardian-request";
import { checkGuardianMatchRoute } from "./routes/check-guardian-match";
import { completeOnboardingRoute } from "./routes/complete-onboarding";
import { getGuardianProfileRoute } from "./routes/get-guardian-profile";
import { getPatientProfileRoute } from "./routes/get-patient-profile";
import { getPendingGuardianRequestsRoute } from "./routes/get-pending-guardian-requests";
import { getUserCreditsRoute } from "./routes/get-user-credits";
import { ingestModelFeaturesRoute } from "./routes/ingest-model-features";
import { purchaseCreditsRoute } from "./routes/purchase-credits";

export const patientRouter = {
  getPatientProfile: getPatientProfileRoute,
  getGuardianProfile: getGuardianProfileRoute,
  checkGuardianMatch: checkGuardianMatchRoute,
  getPendingGuardianRequests: getPendingGuardianRequestsRoute,
  approveGuardianRequest: approveGuardianRequestRoute,
  completeOnboarding: completeOnboardingRoute,
  ingestModelFeatures: ingestModelFeaturesRoute,
  getUserCredits: getUserCreditsRoute,
  purchaseCredits: purchaseCreditsRoute,
};
