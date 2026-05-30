import { useEffect, useMemo, useState } from "react";
import { Text, useColorScheme, View } from "react-native";

import { useThemeColor } from "@/utils/theme";

type RobotAction = "idle" | "sleep" | "yawn";

interface RobotProps {
  action?: RobotAction;
  duration?: number;
}

const ACTIONS: RobotAction[] = ["idle", "sleep", "yawn"];

export function Sprite({ action = "idle", duration = 2000 }: RobotProps) {
  const [currentAction, setCurrentAction] = useState<RobotAction>(action);
  useThemeColor();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    setCurrentAction(action);

    if (action !== "idle") {
      const timer = setTimeout(() => {
        setCurrentAction("idle");
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [action, duration]);

  const bodyState = useMemo(() => {
    switch (currentAction) {
      case "sleep":
        return {
          head: "translate-y-1 rotate-12",
          body: "translate-y-2 scale-y-90",
          eye: "scale-y-0",
          mouth: "opacity-0",
        };
      case "yawn":
        return {
          head: "-translate-y-1",
          body: "scale-105",
          eye: "scale-90",
          mouth: "scale-y-150",
        };
      default:
        return {
          head: "translate-y-0",
          body: "translate-y-0",
          eye: "scale-100",
          mouth: "opacity-100",
        };
    }
  }, [currentAction]);

  const eyeColorClass = isDark ? "bg-secondary" : "bg-foreground";
  const bodyColorClass = isDark ? "bg-primary/45" : "bg-primary/60";

  return (
    <View className="flex h-full w-full items-center justify-center bg-background">
      <View className="items-center justify-center rounded-card border-2 border-border bg-card p-card">
        <View className="relative flex flex-col items-center">
          <View
            className={`flex h-20 w-24 items-center justify-center rounded-2xl border-2 border-border bg-background transition-all duration-500 ease-in-out ${bodyState.head}`}
          >
            <View className="flex-row gap-3">
              <View
                className={`h-2.5 w-2.5 rounded-full ${eyeColorClass} transition-transform duration-300 ${bodyState.eye}`}
              />
              <View
                className={`h-2.5 w-2.5 rounded-full ${eyeColorClass} transition-transform duration-300 ${bodyState.eye}`}
              />
            </View>

            <View
              className={`absolute bottom-3 h-2 w-6 rounded-full border-b-2 border-border transition-all duration-300 ${bodyState.mouth}`}
            />
          </View>

          <View className="h-3 w-2 border-x-2 border-border" />

          <View
            className={`flex h-24 w-20 flex-col items-center justify-center gap-2 rounded-xl border-2 border-border ${bodyColorClass} transition-all duration-500 ease-in-out ${bodyState.body}`}
          >
            <View className="h-6 w-10 rounded-md border-2 border-border bg-background" />
            <View className="h-3 w-3 rounded-full border border-border bg-primary" />
          </View>

          <View className="mt-1 flex-row gap-4">
            <View className="h-6 w-4 rounded-md border-2 border-border bg-background" />
            <View className="h-6 w-4 rounded-md border-2 border-border bg-background" />
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap justify-center gap-2">
        {ACTIONS.map((item) => (
          <View
            key={item}
            className={`rounded-chip border-2 border-border px-chip py-chip ${currentAction === item ? "bg-primary" : "bg-secondary"}`}
          >
            <Text
              className={`font-bold font-sans text-xs uppercase tracking-[0.12em] ${currentAction === item ? "text-primary-foreground" : "text-secondary-foreground"}`}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
