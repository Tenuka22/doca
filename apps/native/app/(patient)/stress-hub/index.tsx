import { Stack } from "expo-router";
import { Activity } from "lucide-react-native";
import { Text, View } from "react-native";

import { Screen } from "@/components/ui/screen";
import { useThemeColor } from "@/utils/theme";

export default function StressHubScreen() {
  const colors = useThemeColor();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="flex-1 justify-center gap-section px-page py-page bg-background"
        scrollClassName="flex-1 bg-background"
      >
        <View className="items-center gap-6">
          <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-muted">
            <Activity color={colors.primary} size={36} />
          </View>
          <View className="gap-2">
            <Text className="text-center font-black font-sans text-3xl text-foreground tracking-tight">
              Stress Hub
            </Text>
            <Text className="max-w-[300px] text-center font-normal font-sans text-muted-foreground text-base leading-6">
              Monitor and manage your stress levels. Coming soon.
            </Text>
          </View>
        </View>
      </Screen>
    </>
  );
}
