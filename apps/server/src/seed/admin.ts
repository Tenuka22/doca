import { createDb, users, accounts } from "@suwa/db";
import bcrypt from "bcryptjs";

export async function seedAdmin() {
  const db = createDb();

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where({ email: "admin@suwa.life" })
      .limit(1);

    if (existing.length > 0) {
      return { skipped: true, userId: existing[0]!.id };
    }

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(users).values({
      id,
      name: "Admin",
      email: "admin@suwa.life",
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync("12345678", salt);

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return { created: true, userId: id };
  } catch (error) {
    console.error("Failed to seed admin user:", error);
    throw error;
  }
}
