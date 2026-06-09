import { acceptRequestRoute } from "./routes/accept-request";
import { getGuardianProfileRoute } from "./routes/get-guardian-profile";
import { getManagedPatientSpriteRoute } from "./routes/get-managed-patient-sprite";
import { getManagedPatientStressMetricsRoute } from "./routes/get-managed-patient-stress";
import { getManagedPatientWellnessRoute } from "./routes/get-managed-patient-wellness";
import { getManagedPatientsRoute } from "./routes/get-managed-patients";
import { getPendingRequestsRoute } from "./routes/get-pending-requests";

export const guardianRouter = {
  getGuardianProfile: getGuardianProfileRoute,
  getPendingRequests: getPendingRequestsRoute,
  acceptRequest: acceptRequestRoute,
  getManagedPatients: getManagedPatientsRoute,
  getManagedPatientWellness: getManagedPatientWellnessRoute,
  getManagedPatientStressMetrics: getManagedPatientStressMetricsRoute,
  getManagedPatientSprite: getManagedPatientSpriteRoute,
};
