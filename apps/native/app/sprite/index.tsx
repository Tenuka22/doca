import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoonlightCreditsDisplay } from "@/components/ui/moonlight-credits-display";
import { Screen } from "@/components/ui/screen";
import type { SpriteAction } from "@/components/ui/sprite-animation";
import { SpriteAnimation } from "@/components/ui/sprite-animation";
import { SpriteHealthBar } from "@/components/ui/sprite-health-bar";
import { WellnessActionCard } from "@/components/ui/wellness-action-card";
import { orpc } from "@/utils/orpc";

function moodToAction(mood: string): SpriteAction {
  if (mood === "sleep") {
    return "sleep";
  }
  if (mood === "yawn") {
    return "yawn";
  }
  return "idle";
}

const WELLNESS_ACTIONS = [
  {
    icon: "B",
    title: "Breath Rhythm",
    description:
      "Morning breathing exercise to start your day calm and centered.",
    timeSlot: "morning" as const,
    actionType: "breathing_morning",
    credits: 10,
  },
  {
    icon: "B",
    title: "Evening Breath",
    description: "Wind down with a guided evening breathing session.",
    timeSlot: "evening" as const,
    actionType: "breathing_evening",
    credits: 10,
  },
  {
    icon: "B",
    title: "Night Calm",
    description: "Deep breathing for a restful night's sleep.",
    timeSlot: "night" as const,
    actionType: "breathing_night",
    credits: 10,
  },
  {
    icon: "M",
    title: "Morning Meditation",
    description: "Set your intention for the day with a short meditation.",
    timeSlot: "morning" as const,
    actionType: "meditation_morning",
    credits: 10,
  },
  {
    icon: "M",
    title: "Evening Meditation",
    description: "Release the day's tension with a calming meditation.",
    timeSlot: "evening" as const,
    actionType: "meditation_evening",
    credits: 10,
  },
] as const;

export default function SpriteScreen() {
  const spriteQuery = useQuery(
    orpc.getSpriteState.queryOptions({ queryKey: ["getSpriteState"] })
  );
  const creditsQuery = useQuery(
    orpc.getMoonlightCredits.queryOptions({ queryKey: ["getMoonlightCredits"] })
  );
  const historyQuery = useQuery(
    orpc.getWellnessHistory.queryOptions({ queryKey: ["getWellnessHistory"] })
  );

  const sprite = spriteQuery.data;
  const credits = creditsQuery.data;
  const todayActions =
    historyQuery.data?.filter((a) => {
      const today = new Date().toISOString().split("T")[0];
      return a.completedAt.startsWith(today);
    }) ?? [];

  const completedTypes = new Set(todayActions.map((a) => a.actionType));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="gap-section bg-background px-page py-page"
        scrollClassName="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-section py-page"
        >
          {/* Header */}
          <View className="gap-2">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              Wellness
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Your Sprite
            </Text>
            <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
              Keep your Sprite healthy through consistent wellness actions.
              Rewarded for showing up every day.
            </Text>
          </View>

          {/* Sprite Visual */}
          <Card>
            <View className="items-center py-4">
              <View className="h-32 w-32 items-center justify-center rounded-[34px] border-2 border-border bg-muted/30">
                <SpriteAnimation
                  action={moodToAction(sprite?.mood ?? "idle")}
                  size="md"
                />
              </View>
            </View>
          </Card>

          {/* Sprite Health */}
          {sprite && (
            <SpriteHealthBar
              health={sprite.health}
              mood={sprite.mood}
              streakDays={sprite.streakDays}
            />
          )}

          {/* Moonlight Credits */}
          {credits && (
            <MoonlightCreditsDisplay
              balance={credits.balance}
              consistencyScore={credits.consistencyScore}
              totalEarned={credits.totalEarned}
            />
          )}

          {/* Today's Actions */}
          <View className="gap-3">
            <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.2em]">
              Today's Wellness Actions
            </Text>

            {WELLNESS_ACTIONS.map((action) => {
              const completed = completedTypes.has(action.actionType);

              return (
                <WellnessActionCard
                  completed={completed}
                  credits={action.credits}
                  description={action.description}
                  icon={completed ? "✓" : action.icon}
                  key={action.actionType}
                  timeSlot={action.timeSlot}
                  title={action.title}
                />
              );
            })}
          </View>

          {/* Action Buttons */}
          <View className="gap-2">
            <Button className="w-full" href="/sprite/actions" variant="primary">
              Start Wellness Action
            </Button>
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}
