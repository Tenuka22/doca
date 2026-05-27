import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Label } from "@zen-doc/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import { Switch } from "@zen-doc/ui/components/switch";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/availability")({
  component: DoctorAvailabilityRoute,
});

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

interface AvailabilitySlot {
  dayOfWeek: number;
  endTime: string;
  id?: string;
  isAvailable: boolean;
  startTime: string;
}

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const getHoursForSlot = (slot: AvailabilitySlot) =>
  (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)) / 60;

function DoctorAvailabilityRoute() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const availabilityQuery = useQuery({
    queryKey: orpc.getWeeklyAvailability.queryKey(),
    queryFn: () => orpc.getWeeklyAvailability.call(),
  });

  const sessionsQuery = useQuery({
    queryKey: orpc.listDoctorSessions.queryKey(),
    queryFn: () => orpc.listDoctorSessions.call(),
  });

  useEffect(() => {
    if (availabilityQuery.data?.slots) {
      if (availabilityQuery.data.slots.length > 0) {
        setSlots(availabilityQuery.data.slots as AvailabilitySlot[]);
        setHasChanges(false);
        return;
      }

      setSlots([
        {
          dayOfWeek: 1,
          endTime: "17:00",
          isAvailable: true,
          startTime: "09:00",
        },
      ]);
    }
  }, [availabilityQuery.data]);

  const saveMutation = useMutation(
    orpc.saveWeeklyAvailability.mutationOptions({
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to save");
      },
      onSuccess: () => {
        toast.success("Availability saved");
        setHasChanges(false);
      },
    })
  );

  const addSlotForDay = (dayOfWeek: number) => {
    // Check for overlap with existing slots
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
    const lastSlot = daySlots[daySlots.length - 1];

    let newStart = "09:00";
    let newEnd = "10:00";

    if (lastSlot) {
      const lastEndMinutes = timeToMinutes(lastSlot.endTime);
      if (lastEndMinutes >= 1410) {
        // 23:30
        toast.error("No more space for slots today");
        return;
      }
      // Suggest next hour
      const nextStartMin = lastEndMinutes;
      const nextEndMin = Math.min(nextStartMin + 60, 1440);

      const format = (m: number) => {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      };

      newStart = format(nextStartMin);
      newEnd = format(nextEndMin);
    }

    setSlots((currentSlots) => [
      ...currentSlots,
      {
        dayOfWeek,
        endTime: newEnd,
        id: crypto.randomUUID(),
        isAvailable: true,
        startTime: newStart,
      },
    ]);
    setHasChanges(true);
  };

  const removeSlot = (index: number) => {
    setSlots((currentSlots) => currentSlots.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateSlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: string | boolean
  ) => {
    setSlots((currentSlots) => {
      const next = [...currentSlots];
      const slot = { ...next[index] };

      if (field === "startTime") {
        slot.startTime = value as string;
        // Ensure end > start
        if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
          const startMin = timeToMinutes(slot.startTime);
          const endMin = Math.min(startMin + 30, 1440);
          const h = Math.floor(endMin / 60);
          const m = endMin % 60;
          slot.endTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      } else if (field === "endTime") {
        slot.endTime = value as string;
      } else if (field === "isAvailable") {
        slot.isAvailable = value as boolean;
      }

      // Check overlap for all slots of this day (excluding current)
      const otherDaySlots = next.filter(
        (s, i) => s.dayOfWeek === slot.dayOfWeek && i !== index
      );
      const s1 = timeToMinutes(slot.startTime);
      const e1 = timeToMinutes(slot.endTime);

      const hasOverlap = otherDaySlots.some((s) => {
        const s2 = timeToMinutes(s.startTime);
        const e2 = timeToMinutes(s.endTime);
        return s1 < e2 && e1 > s2;
      });

      if (hasOverlap) {
        toast.error("Slots cannot overlap");
        return currentSlots;
      }

      next[index] = slot;
      return next;
    });
    setHasChanges(true);
  };

  const toggleDay = (dayOfWeek: number, isAvailable: boolean) => {
    setSlots((currentSlots) => {
      const daySlots = currentSlots.filter((s) => s.dayOfWeek === dayOfWeek);
      if (daySlots.length === 0 && isAvailable) {
        return [
          ...currentSlots,
          {
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
            id: crypto.randomUUID(),
          },
        ];
      }
      return currentSlots.map((slot) =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, isAvailable } : slot
      );
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate({ slots: slots.filter((slot) => slot.isAvailable) });
  };

  const availableDays = new Set(
    slots.filter((slot) => slot.isAvailable).map((slot) => slot.dayOfWeek)
  );
  const totalHours = slots
    .filter((slot) => slot.isAvailable)
    .reduce((acc, slot) => acc + getHoursForSlot(slot), 0);
  const pendingSessions = (sessionsQuery.data?.sessions ?? []).filter(
    (session: { status: string }) =>
      session.status === "requested" || session.status === "rescheduled"
  );

  if (availabilityQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Weekly Availability
        </h1>
        <p className="text-muted-foreground text-sm">
          Set your weekly working hours. Patients will request times based on
          your availability.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Active Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{availableDays.size}</div>
            <p className="text-muted-foreground text-xs">of 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Hours/Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalHours.toFixed(1)}</div>
            <p className="text-muted-foreground text-xs">total hours</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{pendingSessions.length}</div>
            <p className="text-muted-foreground text-xs">requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {DAYS.map((dayName, dayOfWeek) => {
          const daySlots = slots.filter((slot) => slot.dayOfWeek === dayOfWeek);
          const isDayAvailable = daySlots.some((slot) => slot.isAvailable);
          const dayHours = daySlots.reduce(
            (acc, slot) => acc + getHoursForSlot(slot),
            0
          );

          return (
            <Card
              className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm"
              key={dayName}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{dayName}</CardTitle>
                      <Badge
                        className={
                          isDayAvailable
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                        variant="outline"
                      >
                        {isDayAvailable ? "Available" : "Off"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {daySlots.length === 0
                        ? "No hours set"
                        : `${daySlots.length} slot${daySlots.length === 1 ? "" : "s"} · ${dayHours.toFixed(1)}h`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5">
                      <Switch
                        checked={isDayAvailable}
                        className="h-4 w-7"
                        onCheckedChange={(checked) =>
                          toggleDay(dayOfWeek, checked)
                        }
                      />
                      <Label className="text-muted-foreground text-xs">
                        {isDayAvailable ? "Working" : "Day off"}
                      </Label>
                    </div>
                    <Button
                      className="text-xs"
                      onClick={() => addSlotForDay(dayOfWeek)}
                      size="sm"
                      variant="outline"
                    >
                      Add Slot
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {daySlots.length === 0 ? (
                  <div className="rounded-lg border border-border/70 border-dashed bg-muted/20 px-4 py-6 text-center text-muted-foreground text-sm">
                    Add a slot for {dayName}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map((slot, slotOffset) => {
                      const slotIndex = slots.indexOf(slot);
                      const validEndOptions = TIME_OPTIONS.filter(
                        (t) => timeToMinutes(t) > timeToMinutes(slot.startTime)
                      );

                      return (
                        <div
                          className="rounded-lg border border-border/50 bg-muted/30 p-3"
                          key={
                            slot.id ??
                            `${dayName}-${slot.startTime}-${slot.endTime}-${slotOffset}`
                          }
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium text-xs">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <Button
                              className="h-8 w-8"
                              onClick={() => removeSlot(slotIndex)}
                              size="icon"
                              variant="ghost"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="space-y-1.5">
                              <Label className="text-muted-foreground text-xs">
                                Start
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  updateSlot(slotIndex, "startTime", value)
                                }
                                value={slot.startTime}
                              >
                                <SelectTrigger className="h-9 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-muted-foreground text-xs">
                                End
                              </Label>
                              <Select
                                disabled={!slot.startTime}
                                onValueChange={(value) =>
                                  updateSlot(slotIndex, "endTime", value)
                                }
                                value={slot.endTime}
                              >
                                <SelectTrigger className="h-9 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {validEndOptions.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-muted-foreground text-xs">
                                Status
                              </Label>
                              <div className="flex h-9 items-center rounded-md border border-border/50 bg-background px-3">
                                <Switch
                                  checked={slot.isAvailable}
                                  className="h-4 w-7"
                                  onCheckedChange={(checked) =>
                                    updateSlot(
                                      slotIndex,
                                      "isAvailable",
                                      checked
                                    )
                                  }
                                />
                                <span className="ml-2 text-muted-foreground text-sm">
                                  {slot.isAvailable ? "On" : "Off"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          {hasChanges ? (
            <Badge
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              variant="outline"
            >
              Unsaved changes
            </Badge>
          ) : null}
        </div>
        <Button
          disabled={
            saveMutation.isPending ||
            slots.filter((slot) => slot.isAvailable).length === 0 ||
            !hasChanges
          }
          onClick={handleSave}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save Availability
        </Button>
      </div>
    </div>
  );
}
