import { doctorSessions, doctorWeeklyAvailability } from "@zen-doc/db";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../../../index";

const SLOT_DURATION_MS = 30 * 60 * 1000;

function getDayOfWeek(date: Date): number {
  return date.getDay();
}

function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  return h * 60 + m;
}

function minutesToDate(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
}

export const getDoctorAvailableSlotsRoute = publicProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      from: z.string().min(1),
      to: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    const fromDate = new Date(input.from);
    const toDate = new Date(input.to);

    const availability = await context.db
      .select()
      .from(doctorWeeklyAvailability)
      .where(
        and(
          eq(doctorWeeklyAvailability.doctorId, input.doctorId),
          eq(doctorWeeklyAvailability.isAvailable, true)
        )
      );

    const bookedSessions = await context.db
      .select({
        startAt: doctorSessions.startAt,
        endAt: doctorSessions.endAt,
      })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, input.doctorId),
          ne(doctorSessions.status, "timing_balance_failure"),
          ne(doctorSessions.status, "attended"),
          lte(doctorSessions.startAt, input.to),
          gte(doctorSessions.endAt, input.from)
        )
      );

    const bookedRanges = bookedSessions.map((s) => ({
      start: new Date(s.startAt).getTime(),
      end: new Date(s.endAt).getTime(),
    }));

    const slots: Array<{ startAt: string; endAt: string }> = [];

    // Iterate through each day in the range
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dayOfWeek = getDayOfWeek(currentDate);

      const dayAvailability = availability.filter(
        (a) => a.dayOfWeek === dayOfWeek
      );

      for (const avail of dayAvailability) {
        const startMinutes = timeToMinutes(avail.startTime);
        const endMinutes = timeToMinutes(avail.endTime);

        const slotStart = minutesToDate(currentDate, startMinutes);
        const slotEndBase = minutesToDate(currentDate, endMinutes);

        // Generate 30-min slots within this availability range
        let cursor = new Date(slotStart);
        while (cursor < slotEndBase) {
          const slotEnd = new Date(cursor.getTime() + SLOT_DURATION_MS);

          if (slotEnd > slotEndBase) {
            break;
          }

          // Check if slot overlaps with any booked session
          const cursorTime = cursor.getTime();
          const slotEndTime = slotEnd.getTime();

          const hasOverlap = bookedRanges.some(
            (b) => cursorTime < b.end && slotEndTime > b.start
          );

          if (!hasOverlap) {
            slots.push({
              startAt: cursor.toISOString(),
              endAt: slotEnd.toISOString(),
            });
          }

          cursor = slotEnd;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { slots };
  });
