import { acceptRescheduledSessionRoute } from "./routes/accept-rescheduled-session";
import { bookSessionRoute } from "./routes/book-session";
import { cancelSessionRoute } from "./routes/cancel-session";
import { counterProposeSessionRoute } from "./routes/counter-propose-session";
import { createConnectAccountLinkRoute } from "./routes/create-connect-account-link";
import {
  getDoctorCreditsRoute,
  requestCashoutRoute,
} from "./routes/doctor-credits";
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
import { respondSessionRoute } from "./routes/respond-session";
import { syncConnectAccountStatusRoute } from "./routes/sync-connect-account-status";
import {
  getDoctorWeeklyAvailabilityRoute,
  getWeeklyAvailabilityRoute,
  saveWeeklyAvailabilityRoute,
} from "./routes/weekly-availability";

export const bookingRouter = {
  bookSession: bookSessionRoute,
  cancelSession: cancelSessionRoute,
  respondSession: respondSessionRoute,
  acceptRescheduledSession: acceptRescheduledSessionRoute,
  counterProposeSession: counterProposeSessionRoute,
  markSessionAttended: markSessionAttendedRoute,
  getConnectAccountStatus: getConnectAccountStatusRoute,
  createConnectAccountLink: createConnectAccountLinkRoute,
  syncConnectAccountStatus: syncConnectAccountStatusRoute,
  listPatientSessions: listPatientSessionsRoute,
  listDoctorSessions: listDoctorSessionsRoute,
  createDoctorPlan: createDoctorPlanRoute,
  updateDoctorPlan: updateDoctorPlanRoute,
  deleteDoctorPlan: deleteDoctorPlanRoute,
  listDoctorPlans: listDoctorPlansRoute,
  getDoctorPlans: getDoctorPlansRoute,
  getWeeklyAvailability: getWeeklyAvailabilityRoute,
  saveWeeklyAvailability: saveWeeklyAvailabilityRoute,
  getDoctorWeeklyAvailability: getDoctorWeeklyAvailabilityRoute,
  getDoctorCredits: getDoctorCreditsRoute,
  requestCashout: requestCashoutRoute,
};
