import { env } from "@zen-doc/env/server";
import { drizzle } from "drizzle-orm/d1";

import {
  type DoctorProfile as DoctorProfileSchema,
  doctorProfiles as doctorProfilesTable,
} from "./schema";

export const doctorProfiles = doctorProfilesTable;
export type DoctorProfile = DoctorProfileSchema;

export function createDb() {
  return drizzle(env.DB, { schema: { doctorProfiles } });
}
