import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stressPredictions = sqliteTable("stress_predictions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  prediction: text("prediction").notNull(),
  predictedClass: text("predicted_class"),
  probabilities: text("probabilities"),
  sampleCount: integer("sample_count").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export type StressPrediction = typeof stressPredictions.$inferSelect;
export type NewStressPrediction = typeof stressPredictions.$inferInsert;
