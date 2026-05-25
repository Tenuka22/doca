import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Check, Clock, User, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const statusColorMap: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  attended: {
    bg: "bg-success/20",
    border: "border-success/30",
    text: "text-success",
  },
  cancelled: {
    bg: "bg-destructive/15",
    border: "border-destructive/30",
    text: "text-destructive",
  },
  scheduled: {
    bg: "bg-warning/20",
    border: "border-warning/30",
    text: "text-warning",
  },
};

const defaultStatusColor = {
  bg: "bg-muted/20",
  border: "border-border",
  text: "text-muted-foreground",
};

function getStatusColor(status: string) {
  return statusColorMap[status] ?? defaultStatusColor;
}

export default function AppointmentsScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { bookingSuccess } = useLocalSearchParams<{
    bookingSuccess?: string;
  }>();
  const [showSuccessBanner, setShowSuccessBanner] = useState(
    bookingSuccess === "true"
  );

  const profileQuery = useQuery(orpc.getPatientProfile.queryOptions());

  const sessionsQuery = useQuery(orpc.listPatientSessions.queryOptions());

  const sessions = sessionsQuery.data?.sessions ?? [];
  const hasProfile = profileQuery.data?.isOnboardingComplete ?? false;

  if (profileQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="items-center justify-center px-page py-page">
          <ActivityIndicator size="large" />
        </Screen>
      </>
    );
  }

  if (!hasProfile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="gap-6 px-page py-page">
          <View className="gap-3">
            <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
              Appointments
            </Text>
            <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
              Your booked sessions with doctors. Once scheduled, appointments
              cannot be cancelled.
            </Text>
          </View>

          <Card className="gap-3">
            <User color={colors.foreground} size={24} />
            <Text className="font-bold font-sans text-base text-foreground">
              No patient profile
            </Text>
            <Text className="font-medium font-sans text-muted-foreground text-sm">
              Create a patient profile from the booking screen to view your
              appointments.
            </Text>
          </Card>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page">
        <View className="gap-3">
          <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
            Appointments
          </Text>
          <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
            Your booked sessions with doctors.
          </Text>
        </View>

        {showSuccessBanner ? (
          <View className="flex-row items-start gap-3 rounded-xl border-2 border-success bg-success/10 px-4 py-3">
            <View className="mt-0.5 rounded-full bg-success p-1">
              <Check color="#ffffff" size={14} />
            </View>
            <View className="flex-1">
              <Text className="font-bold font-sans text-sm text-success-foreground">
                Booking confirmed
              </Text>
              <Text className="font-sans text-success-foreground/80 text-xs">
                Your session has been booked successfully.
              </Text>
            </View>
            <View className="flex-row items-center justify-center self-center">
              <Button
                className="h-8 w-8 rounded-full p-0"
                icon={<X color={colors.foreground} size={16} />}
                onPress={() => setShowSuccessBanner(false)}
                size="sm"
                variant="secondary"
              />
            </View>
          </View>
        ) : null}

        {sessions.length === 0 ? (
          <Card className="gap-3">
            <Calendar color={colors.foreground} size={24} />
            <Text className="font-bold font-sans text-base text-foreground">
              No appointments yet
            </Text>
            <Text className="font-medium font-sans text-muted-foreground text-sm">
              Book a session with a doctor to see your appointments here.
            </Text>
          </Card>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-4">
              {sessions.map((session) => {
                const startAt = new Date(session.startAt);
                const endAt = new Date(session.endAt);
                const dateLabel = startAt.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                const timeLabel = `${startAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${endAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
                const statusColors = getStatusColor(session.status);

                return (
                  <Card className="gap-3" key={session.id}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <User color={colors.foreground} size={16} />
                        <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
                          Session
                        </Text>
                      </View>

                      <View
                        className={`rounded-full border px-3 py-1 ${statusColors.bg} ${statusColors.border}`}
                      >
                        <Text
                          className={`font-bold text-xs ${statusColors.text}`}
                        >
                          {session.status}
                        </Text>
                      </View>
                    </View>

                    <View className="gap-2 rounded-xl border border-border/50 bg-muted/5 p-3">
                      <View className="flex-row items-center gap-2">
                        <Calendar color={colors.foreground} size={14} />
                        <Text className="font-medium font-sans text-foreground text-sm">
                          {dateLabel}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <Clock color={colors.foreground} size={14} />
                        <Text className="font-medium font-sans text-foreground text-sm">
                          {timeLabel}
                        </Text>
                      </View>
                    </View>

                    <Text className="font-medium font-sans text-muted-foreground text-xs">
                      Doctor ID: {session.doctorId}
                    </Text>
                  </Card>
                );
              })}
            </View>
          </ScrollView>
        )}
      </Screen>
    </>
  );
}
