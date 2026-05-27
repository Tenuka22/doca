import { Stack, useRouter } from "expo-router";
import { Video, VideoOff } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { VideoRoom } from "@/components/ui/video-room";
import { useThemeColor } from "@/utils/theme";

export default function TestSessionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [sessionId, setSessionId] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleJoin = useCallback(() => {
    if (sessionId.trim()) {
      router.push(`/appointments/${sessionId.trim()}`);
    }
  }, [sessionId, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-section px-page py-page bg-background">
        <View className="mb-2 gap-2">
          <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
            Test Lab
          </Text>
          <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
            Video Session
          </Text>
          <Text className="mt-1 font-normal font-sans text-base text-muted-foreground leading-6">
            Enter a session ID to join as admin with no time restrictions.
          </Text>
        </View>

        <Card className="gap-4">
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Video color={colors.foreground} size={20} />
              <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                Join Session
              </Text>
            </View>

            <Field
              label="Session ID"
              onChangeText={setSessionId}
              placeholder="Paste a session ID..."
              value={sessionId}
            />

            <Button
              className="w-full"
              disabled={!sessionId.trim()}
              icon={<Video color={colors.primaryForeground} size={16} />}
              onPress={handleJoin}
            >
              Join as Admin
            </Button>
          </View>
        </Card>
      </Screen>
    </>
  );
}
