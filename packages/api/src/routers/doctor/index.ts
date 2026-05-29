import { doctorProfileRoute } from "./routes/profile";
import { saveDoctorProfileRoute } from "./routes/save-profile";
import { doctorStatsRoute } from "./routes/stats";

export const doctorRouter = {
  doctorProfile: doctorProfileRoute,
  saveDoctorProfile: saveDoctorProfileRoute,
  doctorStats: doctorStatsRoute,
};
