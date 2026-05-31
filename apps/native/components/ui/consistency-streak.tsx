import { Text, View } from "react-native";

interface ConsistencyStreakProps {
  nextMilestone: number;
  streakDays: number;
}

export function ConsistencyStreak({
  streakDays,
  nextMilestone,
}: ConsistencyStreakProps) {
  const progress = (streakDays / nextMilestone) * 100;

  return (
    <View className="gap-2 rounded-card border-2 border-border bg-card px-card py-card">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
          Consistency Streak
        </Text>
        <Text className="font-black font-sans text-2xl text-foreground">
          {streakDays}
          <Text className="font-bold font-sans text-muted-foreground text-sm">
            d
          </Text>
        </Text>
      </View>

      <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="font-bold font-sans text-foreground text-xs">
          Daily Rewards
        </Text>
        <Text className="font-bold font-sans text-muted-foreground text-xs">
          Next bonus: {nextMilestone} days
        </Text>
      </View>
    </View>
  );
}
