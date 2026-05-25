import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Languages,
  MapPin,
  Sparkles,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";

import { orpc } from "@/utils/orpc";
import { usePaymentSheet } from "@/utils/stripe";
import { useThemeColor } from "@/utils/theme";


function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNext7Days(): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Slot {
  endAt: string;
  id: string;
  startAt: string;
}

function SlotsContent({
  selectedDate,
  selectedSlotId,
  slots,
  onSelectSlot,
}: {
  onSelectSlot: (id: string) => void;
  selectedDate: Date | null;
  selectedSlotId: string | null;
  slots: Slot[];
}) {
  if (!selectedDate) {
    return (
      <Text className="py-4 text-center font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
        Select a date above
      </Text>
    );
  }

  if (slots.length === 0) {
    return (
      <Text className="py-4 text-center font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
        No slots available
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {slots.map((slot) => {
        const isSelected = slot.id === selectedSlotId;
        return (
          <Button
            key={slot.id}
            onPress={() => onSelectSlot(slot.id)}
            size="sm"
            variant={isSelected ? "primary" : "secondary"}
          >
            {`${formatTime(new Date(slot.startAt))} - ${formatTime(new Date(slot.endAt))}`}
          </Button>
        );
      })}
    </View>
  );
}

/* ─── Plan Card Sub-Component ───────────────────────────────────────────────── */

function PlanCard({
  plan,
  isSelected,
  onSelect,
  colors,
}: {
  colors: { foreground: string; mutedForeground: string };
  isSelected: boolean;
  onSelect: () => void;
  plan: {
    description: string | null;
    durationMinutes: number;
    features: string | null;
    id: string;
    name: string;
    price: number;
  };
}) {
  const features: string[] = plan.features
    ? (JSON.parse(plan.features) as string[])
    : [];

  return (
    <Card
      className={isSelected ? "border-primary bg-primary/10" : "bg-background"}
      onPress={onSelect}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text
          className={`font-black font-sans text-sm ${isSelected ? "text-primary" : "text-foreground"}`}
        >
          {plan.name}
        </Text>
        <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
          <Text className="font-black font-sans text-primary text-xs">
            ${(plan.price / 100).toFixed(2)}
          </Text>
        </View>
      </View>
      {plan.description ? (
        <Text className="mb-1 font-medium font-sans text-muted-foreground text-xs leading-relaxed">
          {plan.description}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap items-center gap-1.5">
        <View className="flex-row items-center gap-1 rounded-chip border border-border bg-secondary px-2 py-0.5">
          <Clock color={colors.mutedForeground} size={10} strokeWidth={2.5} />
          <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-wider">
            {plan.durationMinutes} min
          </Text>
        </View>
        {features.map((feature: string) => (
          <View
            className="rounded-chip border border-border bg-card px-2 py-0.5"
            key={feature}
          >
            <Text className="font-bold font-sans text-[9px] text-foreground uppercase tracking-wider">
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

/* ─── Plan Selection Section ───────────────────────────────────────────────── */

function PlanSelection({
  plans,
  selectedPlanId,
  onSelectPlan,
}: {
  onSelectPlan: (planId: string) => void;
  plans: {
    durationMinutes: number;
    id: string;
    name: string;
  }[];
  selectedPlanId: string | null;
}) {
  if (plans.length === 0) {
    return null;
  }

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <Sparkles color="#000" size={16} strokeWidth={2.5} />
        <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
          Select Plan
        </Text>
      </View>
      <View className="gap-2">
        {plans.map((plan) => (
          <Card
            className={plan.id === selectedPlanId ? "border-primary bg-primary/10" : "bg-background"}
            key={plan.id}
            onPress={() => onSelectPlan(plan.id)}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-black font-sans text-sm text-foreground">
                {plan.name}
              </Text>
              <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5">
                <Clock color="#a22a2a" size={10} strokeWidth={2.5} />
                <Text className="font-bold font-sans text-primary text-xs">
                  {plan.durationMinutes} min
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Card>
  );
}

/* ─── Summary Sub-Component ────────────────────────────────────────────────── */

function SummaryContent({
  bookingStep,
  handleBook,
  selectedPlan,
  selectedSlotId,
}: {
  bookingStep: string;
  handleBook: () => void;
  selectedPlan:
    | { durationMinutes: number; name: string; price: number }
    | undefined;
  selectedSlotId: string | null;
}) {
  const colors = useThemeColor();
  if (!selectedSlotId) {
    return (
      <Text className="py-4 text-center font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
        Select a time slot and plan
      </Text>
    );
  }

  return (
    <>
      {selectedPlan ? (
        <View className="gap-2 rounded-xl border-2 border-border bg-card p-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
              {selectedPlan.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Clock color={colors.foreground} size={12} strokeWidth={2.5} />
            <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
              {selectedPlan.durationMinutes} min
            </Text>
          </View>
        </View>
      ) : null}
      <Button
        disabled={!(selectedSlotId) || bookingStep !== "select"}
        onPress={handleBook}
        variant="primary"
      >
        {bookingStep === "processing" ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <View className="flex-row items-center gap-2">
            <Text className="font-bold font-sans text-primary-foreground text-sm uppercase tracking-wider">
              Book Appointment
            </Text>
          </View>
        )}
      </Button>
    </>
  );
}

export default function BookingScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookingStep, setBookingStep] = useState<
    "select" | "processing" | "confirming" | "error" | "done"
  >("select");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["doctor-plans", id],
    queryFn: () => orpc.getDoctorPlans.call({ doctorId: id ?? "" }),
    enabled: !!id,
  });

  const today = useMemo(() => new Date(), []);
  const fromDate = useMemo(() => selectedDate?.toISOString(), [selectedDate]);
  const toDate = useMemo(() => {
    if (!selectedDate) {
      return;
    }
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }, [selectedDate]);

  const doctorQuery = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => orpc.getDoctor.call({ doctorId: id ?? "" }),
    enabled: !!id,
  });

  const slotsQuery = useQuery({
    queryKey: ["doctor-slots", id, fromDate],
    queryFn: () => {
      if (!(fromDate && toDate)) {
        throw new Error("No date selected");
      }
      return orpc.getDoctorAvailableSlots.call({
        doctorId: id ?? "",
        from: fromDate,
        to: toDate,
      });
    },
    enabled: !!id && !!selectedDate,
  });

  const slots = (slotsQuery.data?.slots ?? []) as Slot[];
  const plans = plansQuery.data?.plans ?? [];
  const doctor = doctorQuery.data?.profile;
  const selectedPlan = plans.find(
    (p: { id: string }) => p.id === selectedPlanId
  );

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!(selectedSlotId && id)) {
        throw new Error("Missing required selections");
      }

      const result = await orpc.bookSession.call({
        doctorId: id,
        scheduleEntryId: selectedSlotId,
        planId: selectedPlanId ?? undefined,
      });

      if (!result.ok) {
        throw new Error("Booking failed");
      }

      return result;
    },
    onSuccess: async () => {
      setBookingStep("done");
      setTimeout(() => {
        router.replace("/appointments?bookingSuccess=true");
      }, 1500);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setBookingStep("error");
    },
  });

  const handleBook = useCallback(() => {
    if (!selectedSlotId) {
      return;
    }
    setBookingStep("processing");
    bookMutation.mutate();
  }, [bookMutation, selectedSlotId]);

  const next7Days = getNext7Days();

  if (bookingStep === "error") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center gap-6 px-page py-page">
          <View className="rounded-full bg-destructive/20 p-4">
            <X color={colors.destructive} size={32} />
          </View>
          <Text className="text-center font-black text-2xl text-foreground">
            Booking Failed
          </Text>
          <Text className="max-w-[300px] text-center text-muted-foreground text-sm">
            {errorMessage ?? "An unexpected error occurred. Please try again."}
          </Text>
          <Button
            onPress={() => {
              setBookingStep("select");
              setErrorMessage(null);
            }}
            variant="primary"
          >
            Try Again
          </Button>
        </Screen>
      </>
    );
  }

  if (bookingStep === "done") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center gap-6 px-page py-page">
          <View className="rounded-full bg-success/20 p-4">
            <Check color={colors.success} size={32} />
          </View>
          <Text className="text-center font-black text-2xl text-foreground">
            Booking Confirmed
          </Text>
          <Text className="max-w-[300px] text-center text-muted-foreground text-sm">
            Your session has been booked successfully. Redirecting to
            appointments...
          </Text>
          <ActivityIndicator size="small" />
        </Screen>
      </>
    );
  }

  const isLoading =
    plansQuery.isLoading || slotsQuery.isLoading || doctorQuery.isLoading;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page">
        <View className="flex-row items-center justify-between">
          <Button
            icon={<ArrowLeft color={colors.foreground} size={16} />}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            size="sm"
            variant="secondary"
          >
            Back
          </Button>
          <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
            Book Session
          </Text>
          <View style={{ width: 80 }} />
        </View>

        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            {doctor && (
              <Card className="gap-4">
                <View className="flex-row items-center gap-4">
                  <View className="h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-secondary">
                    <Text className="font-black font-sans text-foreground text-lg">
                      {getInitials(doctor.displayName ?? "Dr")}
                    </Text>
                  </View>
                  <View className="flex-1 justify-center gap-0.5">
                    <Text className="font-black font-sans text-foreground text-xl uppercase tracking-tight">
                      {doctor.displayName}
                    </Text>
                    {doctor.location && (
                      <View className="flex-row items-center gap-1">
                        <MapPin
                          color={colors.mutedForeground}
                          size={12}
                          strokeWidth={2.5}
                        />
                        <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
                          {doctor.location}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
                  {doctor.headline ??
                    "Licensed medical practitioner dedicated to safe, private clinical care."}
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {doctor.specialties?.slice(0, 3).map((s: string) => (
                    <View
                      className="flex-row items-center gap-1 rounded-chip border border-border bg-card px-2 py-0.5"
                      key={s}
                    >
                      <Sparkles
                        color={colors.foreground}
                        size={10}
                        strokeWidth={2.5}
                      />
                      <Text className="font-bold font-sans text-[9px] text-foreground uppercase tracking-wider">
                        {s}
                      </Text>
                    </View>
                  ))}
                  {doctor.consultationModes?.length ? (
                    <View className="flex-row items-center gap-1 rounded-chip border border-border bg-card px-2 py-0.5">
                      <Languages
                        color={colors.foreground}
                        size={10}
                        strokeWidth={2.5}
                      />
                      <Text className="font-bold font-sans text-[9px] text-foreground uppercase tracking-wider">
                        {doctor.consultationModes[0]}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            )}

            <Card className="gap-4">
              <View className="flex-row items-center gap-2">
                <Calendar
                  color={colors.foreground}
                  size={16}
                  strokeWidth={2.5}
                />
                <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                  Select Date
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {next7Days.map((day) => {
                  const isSelected =
                    selectedDate?.toDateString() === day.toDateString();
                  const isToday = day.toDateString() === today.toDateString();
                  return (
                    <Button
                      key={day.toISOString()}
                      onPress={() => setSelectedDate(day)}
                      size="sm"
                      variant={isSelected ? "primary" : "secondary"}
                    >
                      {isToday ? "Today" : formatDate(day)}
                    </Button>
                  );
                })}
              </View>
              {selectedDate ? (
                <View className="rounded-card border-2 border-border bg-card px-3 py-2">
                  <Text className="font-bold font-sans text-[10px] text-primary uppercase tracking-widest">
                    {formatDate(selectedDate)}
                  </Text>
                </View>
              ) : null}
            </Card>

            <Card className="gap-4">
              <View className="flex-row items-center gap-2">
                <Clock color={colors.foreground} size={16} strokeWidth={2.5} />
                <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                  Available Slots
                </Text>
              </View>
              <SlotsContent
                onSelectSlot={setSelectedSlotId}
                selectedDate={selectedDate}
                selectedSlotId={selectedSlotId}
                slots={slots}
              />
            </Card>

            <PlanSelection
              onSelectPlan={setSelectedPlanId}
              plans={plans.map((p) => ({
                durationMinutes: p.durationMinutes,
                id: p.id,
                name: p.name,
              }))}
              selectedPlanId={selectedPlanId}
            />

            <Card className="gap-4">
              <View className="flex-row items-center gap-2">
                <Sparkles
                  color={colors.foreground}
                  size={16}
                  strokeWidth={2.5}
                />
                <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                  Booking Summary
                </Text>
              </View>
              <SummaryContent
                bookingStep={bookingStep}
                handleBook={handleBook}
                selectedPlan={selectedPlan}
                selectedSlotId={selectedSlotId}
              />
            </Card>
          </>
        )}
      </Screen>
    </>
  );
}
