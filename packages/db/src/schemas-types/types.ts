import type { z } from "zod";

import type {
  createDoctorFileSchema,
  createScheduleEntrySchema,
  doctorApproachStepSchema,
  doctorEducationEntrySchema,
  doctorFileInputSchema,
  doctorProfileInputSchema,
  fileKeySchema,
  listDoctorsInputSchema,
  listScheduleEntriesSchema,
  paginationSchema,
  scheduleRangeSchema,
  updateDoctorFileSchema,
} from "./index";

export type DoctorApproachStep = z.infer<typeof doctorApproachStepSchema>;
export type DoctorEducationEntryInput = z.infer<
  typeof doctorEducationEntrySchema
>;
export type ScheduleRange = z.infer<typeof scheduleRangeSchema>;
export type CreateScheduleEntryInput = z.infer<
  typeof createScheduleEntrySchema
>;
export type ListScheduleEntriesInput = z.infer<
  typeof listScheduleEntriesSchema
>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ListDoctorsInput = z.infer<typeof listDoctorsInputSchema>;
export type DoctorProfileInput = z.infer<typeof doctorProfileInputSchema>;
export type CreateDoctorFileInput = z.infer<typeof createDoctorFileSchema>;
export type UpdateDoctorFileInput = z.infer<typeof updateDoctorFileSchema>;
export type FileKeyInput = z.infer<typeof fileKeySchema>;
export type DoctorFileInput = z.infer<typeof doctorFileInputSchema>;
