export const sessionStatusValues = [
  "requested",
  "rescheduled",
  "approved",
  "attended",
  "timing_balance_failure",
] as const;

export const scheduleKindValues = ["open", "block", "session"] as const;

export const scheduleNoteValues = [
  "home",
  "work",
  "pharmacy",
  "after_gym",
  "other",
] as const;

export const doctorFileKindValues = [
  "portrait",
  "qualification",
  "intro_video",
  "other",
] as const;

export {
  doctorConsultationModeValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
} from "../doctor-profile";
