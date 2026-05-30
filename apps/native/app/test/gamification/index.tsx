import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";

export default function GamificationTestScreen() {
  return (
    <Screen contentClassName="gap-section px-page py-page bg-background">
      <View className="mb-2 gap-2">
        <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
          Test Lab
        </Text>
        <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
          Gamification
        </Text>
        <Text className="mt-1 font-normal font-sans text-base text-muted-foreground leading-6">
          This is the gamify logic testing area.
        </Text>
      </View>

      <Card className="gap-4">
        <View className="gap-1">
          <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.18em]">
            Scenario
          </Text>
          <Text className="font-extrabold font-sans text-2xl text-foreground tracking-tight">
            Rewards and progression
          </Text>
          <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-6">
            Add gamification flows here to verify points, badges, streaks, and
            unlock states.
          </Text>
        </View>

        <Button
          className="w-full"
          href="/test/gamification/sprite"
          variant="secondary"
        >
          Open Sprite Lab ›
        </Button>

        <Button
          className="w-full"
          href="/test/gamification/actions"
          variant="secondary"
        >
          Open Wellness Actions ›
        </Button>

        <Button className="w-full" href="/test" variant="secondary">
          Back to Test Home ›
        </Button>
      </Card>
    </Screen>
  );
}
