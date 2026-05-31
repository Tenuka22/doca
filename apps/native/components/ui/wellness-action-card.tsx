import { Text, View } from "react-native";

interface WellnessActionCardProps {
  completed?: boolean;
  credits: number;
  description: string;
  icon: string;
  timeSlot: "morning" | "evening" | "night";
  title: string;
}

const timeSlotColors: Record<string, { text: string; badge: string }> = {
  morning: { text: "Morning", badge: "bg-blue-200" },
  evening: { text: "Evening", badge: "bg-purple-200" },
  night: { text: "Night", badge: "bg-indigo-200" },
};

export function WellnessActionCard({
  icon,
  title,
  description,
  timeSlot,
  credits,
  completed,
}: WellnessActionCardProps) {
  const slot = timeSlotColors[timeSlot] ?? timeSlotColors.morning;

  return (
    <View
      className={`flex-row items-center gap-3 rounded-card border-2 border-border bg-card px-card py-card ${completed ? "opacity-50" : ""}`}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-primary">
        <Text className="font-black font-sans text-lg text-primary-foreground">
          {icon}
        </Text>
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <View className={`rounded-full px-2 py-0.5 ${slot.badge}`}>
            <Text className="font-bold text-[10px] text-black uppercase tracking-wider">
              {slot.text}
            </Text>
          </View>
          {completed && (
            <View className="rounded-full bg-green-200 px-2 py-0.5">
              <Text className="font-bold text-[10px] text-green-800 uppercase tracking-wider">
                Done
              </Text>
            </View>
          )}
        </View>
        <Text className="font-extrabold font-sans text-2xl text-foreground tracking-tight">
          {title}
        </Text>
        <Text className="font-normal font-sans text-muted-foreground text-sm leading-6">
          {description}
        </Text>
      </View>

      <View className="items-end gap-0.5">
        <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
          Earn
        </Text>
        <Text className="font-black font-sans text-foreground text-xl">
          +{credits}
        </Text>
        <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
          Credits
        </Text>
      </View>
    </View>
  );
}
