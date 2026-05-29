import { doctorProfileRoute } from "./routes/profile";
import { saveDoctorProfileRoute } from "./routes/save-profile";
import { doctorStatsRoute } from "./routes/stats";
import { profileStatsRoute } from "./routes/profile-stats";

export const doctorRouter = {
  doctorProfile: doctorProfileRoute,
  saveDoctorProfile: saveDoctorProfileRoute,
  doctorStats: doctorStatsRoute,
  profileStats: profileStatsRoute,
};
