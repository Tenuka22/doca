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
import { Switch } from "@zen-doc/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@zen-doc/ui/components/tooltip";
import { Clock, Loader2, PlusIcon, Trash2 } from "lucide-react";
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
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function DayCard({
  dayOfWeek,
  dayName,
  slots,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  onToggleDay,
}: {
  dayOfWeek: number;
  dayName: string;
  slots: AvailabilitySlot[];
  onAddSlot: (dayOfWeek: number) => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (
    index: number,
    field: keyof AvailabilitySlot,
    value: unknown
  ) => void;
  onToggleDay: (dayOfWeek: number, isAvailable: boolean) => void;
}) {
  const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
  const isAvailable =
    daySlots.length > 0 && daySlots.some((s) => s.isAvailable);
  const totalHours = daySlots.reduce((acc, slot) => {
    const start = Number.parseInt(slot.startTime.split(":")[0]);
    const end = Number.parseInt(slot.endTime.split(":")[0]);
    const startMin = Number.parseInt(slot.startTime.split(":")[1]);
    const endMin = Number.parseInt(slot.endTime.split(":")[1]);
    return acc + (end - start) + (endMin - startMin) / 60;
  }, 0);

  return (
    <Card className="flex flex-col border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm backdrop-blur-md transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-base">{dayName}</CardTitle>
              <p className="text-muted-foreground text-xs">
                {daySlots.length === 0 ? "Off" : `${totalHours.toFixed(1)}h`}
              </p>
            </div>
          </div>
          <Badge
            className={
              isAvailable
                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }
            variant="outline"
          >
            {isAvailable ? "Available" : "Off"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {daySlots.length === 0 ? (
          <p className="text-muted-foreground text-xs">No hours set</p>
        ) : (
          <div className="space-y-2">
            {daySlots.map((slot, idx) => {
              const slotIndex = slots.indexOf(slot);
              return (
                <div
                  className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5 text-xs"
                  key={`${slot.startTime}-${slot.endTime}-${idx}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="h-5 w-5"
                        onClick={() => onRemoveSlot(slotIndex)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs" side="left">
                      Remove slot
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="w-full text-xs" size="sm" variant="outline">
                <PlusIcon className="mr-1 h-3 w-3" />
                Add Time
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <AddSlotForm
                dayOfWeek={dayOfWeek}
                 onAdd={(start, end) => {
                   onAddSlot(dayOfWeek);
                   const newSlot = slots.at(-1);
                   if (newSlot && newSlot.dayOfWeek === dayOfWeek) {
                     const newIdx = slots.length - 1;
                     onUpdateSlot(newIdx, "startTime", start);
                     onUpdateSlot(newIdx, "endTime", end);
                   }
                 }}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5">
            <Switch
              checked={isAvailable}
              className="h-4 w-7"
              onCheckedChange={(checked) => onToggleDay(dayOfWeek, checked)}
            />
            <Label className="flex-1 cursor-pointer text-muted-foreground text-xs">
              {isAvailable ? "Working" : "Day off"}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddSlotForm({
  dayOfWeek,
  onAdd,
}: {
  dayOfWeek: number;
  onAdd: (start: string, end: string) => void;
}) {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Start Time</Label>
        <Select onValueChange={setStart} value={start}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">End Time</Label>
        <Select onValueChange={setEnd} value={end}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full text-xs"
        onClick={() => onAdd(start, end)}
        size="sm"
      >
        Add Slot
      </Button>
    </div>
  );
}

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
    if (
      availabilityQuery.data?.slots &&
      availabilityQuery.data.slots.length > 0
    ) {
      setSlots(availabilityQuery.data.slots as AvailabilitySlot[]);
      setHasChanges(false);
    }
  }, [availabilityQuery.data]);

  useEffect(() => {
    if (
      !(availabilityQuery.isPending || availabilityQuery.data?.slots?.length) &&
      slots.length === 0
    ) {
      setSlots([
        {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: true,
        },
      ]);
    }
  }, [availabilityQuery.isPending]);

  const saveMutation = useMutation(
    orpc.saveWeeklyAvailability.mutationOptions({
      onSuccess: () => {
        toast.success("Availability saved");
        setHasChanges(false);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to save");
      },
    })
  );

  function addSlot(dayOfWeek: number) {
    setSlots([
      ...slots,
      {
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
    ]);
    setHasChanges(true);
  }

  function removeSlot(index: number) {
    setSlots(slots.filter((_, i) => i !== index));
    setHasChanges(true);
  }

  function updateSlot(
    index: number,
    field: keyof AvailabilitySlot,
    value: unknown
  ) {
    const next = slots.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setSlots(next);
    setHasChanges(true);
  }

  function toggleDay(dayOfWeek: number, isAvailable: boolean) {
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
    const next = slots.map((s) =>
      s.dayOfWeek === dayOfWeek ? { ...s, isAvailable } : s
    );
    setSlots(next);
    setHasChanges(true);
  }

  function handleSave() {
    saveMutation.mutate({ slots: slots.filter((s) => s.isAvailable) });
  }

  const availableDays = new Set(
    slots.filter((s) => s.isAvailable).map((s) => s.dayOfWeek)
  );
  const totalHours = slots
    .filter((s) => s.isAvailable)
    .reduce((acc, slot) => {
      const start = Number.parseInt(slot.startTime.split(":")[0]);
      const end = Number.parseInt(slot.endTime.split(":")[0]);
      const startMin = Number.parseInt(slot.startTime.split(":")[1]);
      const endMin = Number.parseInt(slot.endTime.split(":")[1]);
      return acc + (end - start) + (endMin - startMin) / 60;
    }, 0);

  const sessions = sessionsQuery.data?.sessions ?? [];
  const pendingSessions = sessions.filter(
    (s: { status: string }) =>
      s.status === "requested" || s.status === "rescheduled"
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {DAYS.map((day, i) => (
          <DayCard
            dayName={DAYS_SHORT[i]}
            dayOfWeek={i}
            key={i}
            onAddSlot={addSlot}
            onRemoveSlot={removeSlot}
            onToggleDay={toggleDay}
            onUpdateSlot={updateSlot}
            slots={slots}
          />
        ))}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              variant="outline"
            >
              Unsaved changes
            </Badge>
          )}
        </div>
        <Button
          disabled={
            saveMutation.isPending ||
            slots.filter((s) => s.isAvailable).length === 0 ||
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
