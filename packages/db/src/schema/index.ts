import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const doctorProfiles = sqliteTable("doctor_profiles", {
  userId: text("user_id").primaryKey(),
  bio: text("bio"),
  licenseNumber: text("license_number"),
  permanent: integer("permanent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export type DoctorProfile = typeof doctorProfiles.$inferSelect;
