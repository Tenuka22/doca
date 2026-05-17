import { env } from "@zen-doc/env/server";
import { drizzle } from "drizzle-orm/d1";

import {
  type DoctorProfile as DoctorProfileSchema,
  type DoctorScheduleEntry as DoctorScheduleEntrySchema,
  type DoctorSession as DoctorSessionSchema,
  doctorProfiles as doctorProfilesTable,
  doctorScheduleEntries as doctorScheduleEntriesTable,
  doctorSessions as doctorSessionsTable,
  type GuardianProfile as GuardianProfileSchema,
  guardianProfiles as guardianProfilesTable,
  type PatientProfile as PatientProfileSchema,
  patientProfiles as patientProfilesTable,
} from "./schema";

export const doctorProfiles = doctorProfilesTable;
export const doctorSessions = doctorSessionsTable;
export const doctorScheduleEntries = doctorScheduleEntriesTable;
export const patientProfiles = patientProfilesTable;
export const guardianProfiles = guardianProfilesTable;
export type DoctorProfile = DoctorProfileSchema;
export type DoctorSession = DoctorSessionSchema;
export type DoctorScheduleEntry = DoctorScheduleEntrySchema;
export type PatientProfile = PatientProfileSchema;
export type GuardianProfile = GuardianProfileSchema;

export function createDb() {
  return drizzle(env.DB, {
    schema: {
      doctorProfiles,
      doctorSessions,
      doctorScheduleEntries,
      patientProfiles,
      guardianProfiles,
    },
  });
}
