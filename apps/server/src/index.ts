import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@zen-doc/api/context";
import { appRouter } from "@zen-doc/api/routers/index";
import {
  createDb,
  doctorScheduleEntries,
  doctorSessions,
  paymentIntents,
} from "@zen-doc/db";
import { env } from "@zen-doc/env/server";
import { and, eq, inArray, lt, ne } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import webhookApp from "./webhooks";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN.split(","),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.route("/", webhookApp);

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => c.text("OK"));

async function runCleanup() {
  const db = createDb();
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  // Find sessions that:
  // 1. Are older than 10 minutes
  // 2. Haven't been paid (payoutStatus is 'none', 'pending_payment', or 'failed')
  // 3. Haven't been confirmed/scheduled (status is 'pending')
  const abandonedSessions = await db
    .select({ id: doctorSessions.id })
    .from(doctorSessions)
    .where(
      and(
        lt(doctorSessions.createdAt, tenMinutesAgo),
        ne(doctorSessions.payoutStatus, "paid"),
        eq(doctorSessions.status, "pending")
      )
    );

  if (abandonedSessions.length > 0) {
    const sessionIds = abandonedSessions.map((s) => s.id);
    const now = new Date().toISOString();

    // Mark sessions as cancelled instead of deleting
    await db
      .update(doctorSessions)
      .set({
        status: "cancelled",
        updatedAt: now,
      })
      .where(inArray(doctorSessions.id, sessionIds));

    // Free up the schedule slots so others can book them
    await db
      .update(doctorScheduleEntries)
      .set({
        kind: "open",
        sessionId: null,
        updatedAt: now,
      })
      .where(inArray(doctorScheduleEntries.sessionId, sessionIds));

    // Cancel the pending payment intents
    await db
      .update(paymentIntents)
      .set({
        status: "cancelled",
        updatedAt: now,
      })
      .where(inArray(paymentIntents.sessionId, sessionIds));

    console.log(`Cancelled ${abandonedSessions.length} abandoned sessions`);
  }

  return abandonedSessions.length;
}

app.get("/crons", async (c) => {
  const count = await runCleanup();
  return c.json({ ok: true, cleanedUp: count });
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext) {
    await runCleanup();
  },
};
