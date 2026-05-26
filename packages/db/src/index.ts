import { env } from "@zen-doc/env/server";
import { drizzle } from "drizzle-orm/d1";

import {
  type CreditTransaction as CreditTransactionSchema,
  creditTransactions as creditTransactionsTable,
  type DoctorCashoutRequest as DoctorCashoutRequestSchema,
  doctorCashoutRequests as doctorCashoutRequestsTable,
  type DoctorCredit as DoctorCreditSchema,
  doctorCredits as doctorCreditsTable,
  type DoctorEducationEntry as DoctorEducationEntrySchema,
  type DoctorFile as DoctorFileSchema,
  type DoctorPlan as DoctorPlanSchema,
  type DoctorProfile as DoctorProfileSchema,
  type DoctorScheduleEntry as DoctorScheduleEntrySchema,
  type DoctorSession as DoctorSessionSchema,
  type DoctorWeeklyAvailability as DoctorWeeklyAvailabilitySchema,
  doctorEducationEntries as doctorEducationEntriesTable,
  doctorFiles as doctorFilesTable,
  doctorPlans as doctorPlansTable,
  doctorProfiles as doctorProfilesTable,
  doctorScheduleEntries as doctorScheduleEntriesTable,
  doctorSessions as doctorSessionsTable,
  doctorWeeklyAvailability as doctorWeeklyAvailabilityTable,
  type GuardianProfile as GuardianProfileSchema,
  guardianProfiles as guardianProfilesTable,
  type PatientProfile as PatientProfileSchema,
  patientProfiles as patientProfilesTable,
  type UserCredit as UserCreditSchema,
  userCredits as userCreditsTable,
} from "./schema";

export {
  doctorConsultationModeValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
  parseJsonApproachSteps,
  parseJsonStringArray,
  stringifyJsonApproachSteps,
  stringifyJsonStringArray,
} from "./doctor-profile";

export const doctorProfiles = doctorProfilesTable;
export const doctorFiles = doctorFilesTable;
export const doctorEducationEntries = doctorEducationEntriesTable;
export const doctorSessions = doctorSessionsTable;
export const doctorScheduleEntries = doctorScheduleEntriesTable;
export const patientProfiles = patientProfilesTable;
export const guardianProfiles = guardianProfilesTable;
export const doctorPlans = doctorPlansTable;
export const userCredits = userCreditsTable;
export const creditTransactions = creditTransactionsTable;
export const doctorWeeklyAvailability = doctorWeeklyAvailabilityTable;
export const doctorCredits = doctorCreditsTable;
export const doctorCashoutRequests = doctorCashoutRequestsTable;

export type DoctorProfile = DoctorProfileSchema;
export type DoctorFile = DoctorFileSchema;
export type DoctorSession = DoctorSessionSchema;
export type DoctorScheduleEntry = DoctorScheduleEntrySchema;
export type DoctorEducationEntry = DoctorEducationEntrySchema;
export type PatientProfile = PatientProfileSchema;
export type GuardianProfile = GuardianProfileSchema;
export type DoctorPlan = DoctorPlanSchema;
export type UserCredit = UserCreditSchema;
export type CreditTransaction = CreditTransactionSchema;
export type DoctorWeeklyAvailability = DoctorWeeklyAvailabilitySchema;
export type DoctorCredit = DoctorCreditSchema;
export type DoctorCashoutRequest = DoctorCashoutRequestSchema;

export function createDb() {
  return drizzle(env.DB, {
    schema: {
      doctorProfiles,
      doctorFiles,
      doctorSessions,
      doctorScheduleEntries,
      patientProfiles,
      guardianProfiles,
      doctorPlans,
      userCredits,
      creditTransactions,
      doctorWeeklyAvailability,
      doctorCredits,
      doctorCashoutRequests,
    },
  });
}
