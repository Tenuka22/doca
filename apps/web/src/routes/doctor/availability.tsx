import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import { Loader2, PlusIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/availability")({
  component: DoctorAvailabilityRoute,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

function DoctorAvailabilityRoute() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const availabilityQuery = useQuery({
    queryKey: orpc.getWeeklyAvailability.queryKey(),
    queryFn: () => orpc.getWeeklyAvailability.call(),
  });

  useEffect(() => {
    if (availabilityQuery.data?.slots && availabilityQuery.data.slots.length > 0) {
      setSlots(availabilityQuery.data.slots as AvailabilitySlot[]);
    }
  }, [availabilityQuery.data]);

  useEffect(() => {
    if (!availabilityQuery.isPending && !availabilityQuery.data?.slots?.length && slots.length === 0) {
      setSlots([
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: true },
      ]);
    }
  }, [availabilityQuery.isPending]);

  const saveMutation = useMutation(
    orpc.saveWeeklyAvailability.mutationOptions({
      onSuccess: () => {
        toast.success("Availability saved");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to save");
      },
    })
  );

  function addSlot() {
    const usedDays = new Set(slots.filter((s) => s.isAvailable).map((s) => s.dayOfWeek));
    const nextDay = DAYS.findIndex((_, i) => !usedDays.has(i));
    if (nextDay === -1) {
      toast.error("All days already have availability");
      return;
    }
    setSlots([
      ...slots,
      { dayOfWeek: nextDay, startTime: "09:00", endTime: "17:00", isAvailable: true },
    ]);
  }

  function removeSlot(index: number) {
    setSlots(slots.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, field: keyof AvailabilitySlot, value: unknown) {
    const next = slots.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setSlots(next);
  }

  function handleSave() {
    saveMutation.mutate({ slots: slots.filter((s) => s.isAvailable) });
  }

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
          Set your weekly working hours. Patients will request times based on your availability.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Available Hours</CardTitle>
          <Button onClick={addSlot} size="sm" variant="outline">
            <PlusIcon className="mr-1 h-3 w-3" />
            Add Slot
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {slots.length === 0 && (
            <p className="py-4 text-center text-muted-foreground text-sm">
              No availability set. Add your weekly hours above.
            </p>
          )}

          {slots.map((slot, index) => (
            <div
              className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
              key={index}
            >
              <div className="grid gap-2">
                <Label>Day</Label>
                <Select
                  onValueChange={(v) => updateSlot(index, "dayOfWeek", Number(v))}
                  value={String(slot.dayOfWeek)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, i) => (
                      <SelectItem key={day} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Start</Label>
                <Select
                  onValueChange={(v) => updateSlot(index, "startTime", v)}
                  value={slot.startTime}
                >
                  <SelectTrigger className="w-24">
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

              <div className="grid gap-2">
                <Label>End</Label>
                <Select
                  onValueChange={(v) => updateSlot(index, "endTime", v)}
                  value={slot.endTime}
                >
                  <SelectTrigger className="w-24">
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

              <div className="flex items-center gap-2 pb-1">
                <Switch
                  checked={slot.isAvailable}
                  onCheckedChange={(v) => updateSlot(index, "isAvailable", v)}
                />
                <Label className="text-sm text-muted-foreground">
                  {slot.isAvailable ? "Available" : "Unavailable"}
                </Label>
              </div>

              <Button
                className="mb-0.5"
                onClick={() => removeSlot(index)}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}

          <Button
            disabled={saveMutation.isPending || slots.filter((s) => s.isAvailable).length === 0}
            onClick={handleSave}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : null}
            Save Availability
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
