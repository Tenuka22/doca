import { getSessionRoute } from "./routes/get-session";
import { setOnboardingRoleRoute } from "./routes/set-onboarding-role";

export const authRouter = {
  getSession: getSessionRoute,
  setOnboardingRole: setOnboardingRoleRoute,
};
