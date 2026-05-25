import { doctorProfileRoute } from "./routes/profile";
import { saveDoctorProfileRoute } from "./routes/save-profile";

export const doctorRouter = {
  doctorProfile: doctorProfileRoute,
  saveDoctorProfile: saveDoctorProfileRoute,
};
