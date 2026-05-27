import { autoMarkAttendanceRoute } from "./routes/auto-mark-attendance";
import { getSessionAttendanceRoute } from "./routes/get-session-attendance";
import { recordAttendanceEventRoute } from "./routes/record-attendance-event";
import { recordSnapshotRoute } from "./routes/record-snapshot";

export const sessionAttendanceRouter = {
  recordAttendanceEvent: recordAttendanceEventRoute,
  getSessionAttendance: getSessionAttendanceRoute,
  autoMarkAttendance: autoMarkAttendanceRoute,
  recordSnapshot: recordSnapshotRoute,
};
