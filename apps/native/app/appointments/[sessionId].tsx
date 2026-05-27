import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Text, View } from "react-native";
import { useUser } from "@clerk/expo";
import { User } from "lucide-react-native";
import { orpc } from "@/utils/orpc";
import { VideoRoom } from "@/components/ui/video-room";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";
import { useThemeColor } from "@/utils/theme";
import { ArrowLeft } from "lucide-react-native";

export default function AppointmentSessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const colors = useThemeColor();
  const { user } = useUser();
  const metadataRole = user?.publicMetadata?.role;
  const userRole: "patient" | "doctor" | "admin" =
    metadataRole === "admin"
      ? "admin"
      : metadataRole === "doctor"
        ? "doctor"
        : "patient";

  const sessionQuery = useQuery({
    queryKey: orpc.getLiveKitToken.queryKey({ sessionId: sessionId ?? "" }),
    queryFn: () => orpc.getLiveKitToken.call({ sessionId: sessionId ?? "" }),
    enabled: !!sessionId,
  });

  if (sessionQuery.isPending) {
    return (
      <Screen contentClassName="items-center justify-center px-page py-page">
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <Screen contentClassName="items-center justify-center px-page py-page gap-4">
        <Text className="text-destructive">Failed to load session</Text>
        <Button onPress={() => router.back()} variant="secondary">
          Back
        </Button>
      </Screen>
    );
  }

  const { session } = sessionQuery.data;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="px-page py-page gap-6">
        <View className="flex-row items-center gap-4">
          <Button
            onPress={() => router.back()}
            size="sm"
            variant="secondary"
            icon={<ArrowLeft color={colors.foreground} size={16} />}
          >
            Back
          </Button>
          <View className="flex-1">
            <Text className="font-black font-sans text-xl text-foreground uppercase tracking-tight">
              Session Room
            </Text>
            <Text className="font-medium font-sans text-muted-foreground text-xs">
              ID: {sessionId}
            </Text>
          </View>
        </View>

        <VideoRoom
          endAt={session.endAt}
          onClose={() => router.back()}
          role={userRole}
          sessionId={sessionId ?? ""}
          startAt={session.startAt}
        />
      </Screen>
    </>
  );
}
