import { Stack } from "expo-router";
import { HeartHandshake } from "lucide-react-native";
import { Text, View } from "react-native";

import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { useThemeColor } from "@/utils/theme";

export default function GuardianDashboardScreen() {
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
            <HeartHandshake color={colors.primary} size={36} />
          </View>
          <View className="gap-2">
            <Text className="text-center font-black font-sans text-3xl text-foreground tracking-tight">
              Guardian Dashboard
            </Text>
            <Text className="max-w-[300px] text-center font-normal font-sans text-muted-foreground text-base leading-6">
              You are managing a patient. Their wellness data will appear here.
            </Text>
          </View>
        </View>
      </Screen>
      <ScreenBottomBar>
        <View className="flex-1" />
      </ScreenBottomBar>
    </>
  );
}
