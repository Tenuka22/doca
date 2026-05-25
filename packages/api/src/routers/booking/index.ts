import { bookSessionRoute } from "./routes/book-session";
import { cancelSessionRoute } from "./routes/cancel-session";
import { confirmSessionRoute } from "./routes/confirm-session";
import { createConnectAccountLinkRoute } from "./routes/create-connect-account-link";
import {
  createDoctorPlanRoute,
  deleteDoctorPlanRoute,
  getDoctorPlansRoute,
  listDoctorPlansRoute,
  updateDoctorPlanRoute,
} from "./routes/doctor-plans";
import { getConnectAccountStatusRoute } from "./routes/get-connect-account-status";
import { listDoctorSessionsRoute } from "./routes/list-doctor-sessions";
import { listPatientSessionsRoute } from "./routes/list-patient-sessions";
import { markSessionAttendedRoute } from "./routes/mark-session-attended";
import { syncConnectAccountStatusRoute } from "./routes/sync-connect-account-status";

export const bookingRouter = {
  bookSession: bookSessionRoute,
  cancelSession: cancelSessionRoute,
  confirmSession: confirmSessionRoute,
  getConnectAccountStatus: getConnectAccountStatusRoute,
  createConnectAccountLink: createConnectAccountLinkRoute,
  syncConnectAccountStatus: syncConnectAccountStatusRoute,
  markSessionAttended: markSessionAttendedRoute,
  listPatientSessions: listPatientSessionsRoute,
  listDoctorSessions: listDoctorSessionsRoute,
  createDoctorPlan: createDoctorPlanRoute,
  updateDoctorPlan: updateDoctorPlanRoute,
  deleteDoctorPlan: deleteDoctorPlanRoute,
  listDoctorPlans: listDoctorPlansRoute,
  getDoctorPlans: getDoctorPlansRoute,
};
