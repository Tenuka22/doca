import { useUser } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zen-doc/ui/components/alert-dialog";
import { Button } from "@zen-doc/ui/components/button";
import { Calendar } from "@zen-doc/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zen-doc/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@zen-doc/ui/components/tooltip";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { orpc } from "@/utils/orpc";

import { CalendarHeader, CalendarMonthView } from "./components";
import { scheduleNotes, schedulePageSchema, timeOptions } from "./utils/types";

function parseScheduleEntry(entry: unknown): ScheduleEntry {
  return entry as ScheduleEntry;
}

function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function subMonths(date: Date, amount: number): Date {
  return addMonths(date, -amount);
}

function formatLabel(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function toLocalDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function getDayLabel(date: Date | null): string {
  return date ? format(date, "PP") : "Pick a date";
}

function getEventTone(kind: "open" | "block" | "session"): string {
  if (kind === "open") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (kind === "block") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isBeforeToday(date: Date): boolean {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
}

function overlaps(
  a: { startAt: string; endAt: string },
  b: { startAt: string; endAt: string }
): boolean {
  return (
    new Date(a.startAt).getTime() <= new Date(b.endAt).getTime() &&
    new Date(a.endAt).getTime() >= new Date(b.startAt).getTime()
  );
}

export const Route = createFileRoute("/doctor/")({
  validateSearch: schedulePageSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }) => {
    const now = new Date();
    const fromDate = startOfMonth(subMonths(now, 1));
    const toDate = endOfMonth(addMonths(now, 1));
    try {
      const initialData = await context.queryClient.fetchQuery({
        queryKey: orpc.listScheduleEntries.queryKey({
          input: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            page: deps.page,
            pageSize: 150,
          },
        }),
        queryFn: () =>
          orpc.listScheduleEntries.call({
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            page: deps.page,
            pageSize: 150,
          }),
      });

      return { initialData, month: now.toISOString() };
    } catch {
      return { initialData: { items: [] }, month: now.toISOString() };
    }
  },
  component: DoctorScheduleRoute,
});

interface ScheduleEntry {
  endAt: string;
  id: string;
  kind: "open" | "block" | "session";
  noteKind: "home" | "work" | "pharmacy" | "after_gym" | "other" | null;
  session: {
    id: string;
    patientId: string;
    startAt: string;
    endAt: string;
    status: string;
  } | null;
  sessionId: string | null;
  startAt: string;
}

function DoctorScheduleRoute() {
  const user = useUser();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const [month, setMonth] = useState(new Date(loaderData.month));
  const [selectedDate, setSelectedDate] = useState(new Date(loaderData.month));
  const [kind, setKind] = useState<"open" | "block">("open");
  const [noteKind, setNoteKind] = useState("home");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);

  const [minMonth, setMinMonth] = useState(() =>
    startOfMonth(subMonths(new Date(loaderData.month), 1))
  );
  const [maxMonth, setMaxMonth] = useState(() =>
    endOfMonth(addMonths(new Date(loaderData.month), 1))
  );

  const handleMonthChange = (nextMonth: Date) => {
    setMonth(nextMonth);
    const startOfPrev = startOfMonth(subMonths(nextMonth, 1));
    const endOfNext = endOfMonth(addMonths(nextMonth, 1));
    if (startOfPrev.getTime() < minMonth.getTime()) {
      setMinMonth(startOfPrev);
    }
    if (endOfNext.getTime() > maxMonth.getTime()) {
      setMaxMonth(endOfNext);
    }
  };

  const range = useMemo(
    () => ({ from: minMonth.toISOString(), to: maxMonth.toISOString() }),
    [minMonth, maxMonth]
  );

  const scheduleQuery = useQuery({
    queryKey: orpc.listScheduleEntries.queryKey({
      input: { ...range, page: search.page, pageSize: 150 },
    }),
    queryFn: () =>
      orpc.listScheduleEntries.call({
        ...range,
        page: search.page,
        pageSize: 150,
      }),
    initialData: loaderData.initialData,
    enabled: user.isLoaded && !!user.user,
  });

  const createEntry = useMutation(
    orpc.createScheduleEntry.mutationOptions({
      onSuccess: async () => {
        await scheduleQuery.refetch();
      },
    })
  );

  const deleteEntry = useMutation(
    orpc.deleteScheduleEntry.mutationOptions({
      onSuccess: async () => {
        await scheduleQuery.refetch();
      },
    })
  );

  const entries: ScheduleEntry[] = (scheduleQuery.data?.items ?? []).map(
    (entry) => parseScheduleEntry(entry)
  );

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const allDayEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const start = new Date(entry.startAt);
        const end = new Date(entry.endAt);
        const startKey = format(start, "yyyy-MM-dd");
        const endKey = format(end, "yyyy-MM-dd");
        return selectedDateKey >= startKey && selectedDateKey <= endKey;
      }),
    [entries, selectedDateKey]
  );

  const canCreate =
    !!startDate &&
    !!endDate &&
    !isBeforeToday(startDate) &&
    !isBeforeToday(endDate) &&
    startOfDay(startDate).getTime() <= startOfDay(endDate).getTime();

  const invalidReason = useMemo(() => {
    if (!(startDate && endDate)) {
      return "Pick start and end dates.";
    }
    if (isBeforeToday(startDate) || isBeforeToday(endDate)) {
      return "Past dates are disabled.";
    }
    if (startOfDay(startDate).getTime() > startOfDay(endDate).getTime()) {
      return "End date must be on or after start date.";
    }
    return null;
  }, [endDate, startDate]);

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleMonthChange(subMonths(month, 1))}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-36 text-center font-medium">
              {formatLabel(month)}
            </div>
            <Button
              onClick={() => handleMonthChange(addMonths(month, 1))}
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="schedule-kind"
            >
              Type
            </label>
            <Select
              onValueChange={(value) => setKind(value as typeof kind)}
              value={kind}
            >
              <SelectTrigger className="h-9 w-full" id="schedule-kind">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open time</SelectItem>
                <SelectItem value="block">Block time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="schedule-note"
            >
              Note
            </label>
            <Select
              disabled={kind !== "open"}
              onValueChange={setNoteKind}
              value={noteKind}
            >
              <SelectTrigger className="h-9 w-full" id="schedule-note">
                <SelectValue placeholder="Select note" />
              </SelectTrigger>
              <SelectContent>
                {scheduleNotes.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="schedule-start-picker"
            >
              Start
            </label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger>
                  <Button
                    className="w-full justify-start"
                    id="schedule-start-picker"
                    variant="outline"
                  >
                    {getDayLabel(startDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date: Date) => isBeforeToday(date)}
                    mode="single"
                    onSelect={(date: Date | undefined) =>
                      setStartDate(date ?? null)
                    }
                    selected={startDate ?? undefined}
                  />
                </PopoverContent>
              </Popover>
              <Select
                onValueChange={(value) => setStartTime(value ?? "08:00")}
                value={startTime}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1">
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="schedule-end-picker"
            >
              End
            </label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger>
                  <Button
                    className="w-full justify-start"
                    id="schedule-end-picker"
                    variant="outline"
                  >
                    {getDayLabel(endDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date: Date) => isBeforeToday(date)}
                    mode="single"
                    onSelect={(date: Date | undefined) =>
                      setEndDate(date ?? null)
                    }
                    selected={endDate ?? undefined}
                  />
                </PopoverContent>
              </Popover>
              <Select
                onValueChange={(value) => setEndTime(value ?? "09:00")}
                value={endTime}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    disabled={createEntry.isPending || !canCreate}
                    onClick={() => {
                      if (!(startDate && endDate)) {
                        return;
                      }

                      createEntry.mutate({
                        kind,
                        noteKind:
                          kind === "open"
                            ? (noteKind as
                                | "home"
                                | "work"
                                | "pharmacy"
                                | "after_gym"
                                | "other")
                            : undefined,
                        startAt: toLocalDateTime(
                          startDate,
                          startTime
                        ).toISOString(),
                        endAt: toLocalDateTime(endDate, endTime).toISOString(),
                      });
                    }}
                    variant="default"
                  >
                    <Plus className="mr-2 h-4 w-4" />{" "}
                    {kind === "open" ? "Open" : "Block"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {invalidReason ?? "Create the selected schedule range."}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Calendar</CardTitle>
            <CalendarHeader
              currentMonth={month}
              onMonthChange={handleMonthChange}
            />
          </CardHeader>
          <CardContent>
            <CalendarMonthView
              currentMonth={month}
              entries={entries}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allDayEntries.length > 0 ? (
              allDayEntries.map((entry) => {
                const disabledByBlock =
                  entry.kind === "open" &&
                  entries.some(
                    (other) =>
                      other.id !== entry.id &&
                      (other.kind === "block" || other.kind === "session") &&
                      overlaps(entry, other)
                  );

                return (
                  <div
                    className={`rounded-lg border p-3 ${getEventTone(entry.kind)}`}
                    key={entry.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {entry.kind.toUpperCase()}
                        </div>
                        <div className="text-xs opacity-80">
                          {format(new Date(entry.startAt), "p")} -{" "}
                          {format(new Date(entry.endAt), "p")}
                        </div>
                      </div>
                      {entry.kind === "session" ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Button
                          onClick={() => setDeleteTarget(entry)}
                          size="sm"
                          variant="outline"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 text-xs opacity-80">
                      {entry.noteKind ? `Note: ${entry.noteKind}` : null}
                      {entry.session
                        ? `Session: ${entry.session.status}`
                        : null}
                      {disabledByBlock ? "Disabled by block or session" : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm">
                No entries on this day.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cut off{" "}
              {deleteTarget
                ? format(new Date(deleteTarget.startAt), "PPpp")
                : ""}{" "}
              to{" "}
              {deleteTarget ? format(new Date(deleteTarget.endAt), "PPpp") : ""}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteEntry.mutate({ id: deleteTarget.id });
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
