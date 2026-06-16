import { getDoctorRoute } from "./routes/get-doctor";
import { getDoctorAvailableSlotsRoute } from "./routes/get-doctor-available-slots";
import { getTenantDetailRoute } from "./routes/get-tenant-detail";
import { healthCheckRoute } from "./routes/health-check";
import { listDoctorsRoute } from "./routes/list-doctors";
import { listTenantsRoute } from "./routes/list-tenants";
import { privateDataRoute } from "./routes/private-data";

export const publicRouter = {
  getDoctorAvailableSlots: getDoctorAvailableSlotsRoute,
  healthCheck: healthCheckRoute,
  privateData: privateDataRoute,
  listDoctors: listDoctorsRoute,
  getDoctor: getDoctorRoute,
  listTenants: listTenantsRoute,
  getTenantDetail: getTenantDetailRoute,
};
