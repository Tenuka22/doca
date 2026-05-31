import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

const DEFAULT_PHASES = { inhale: 4, hold: 4, exhale: 6, rest: 2 };
const PHASES: BreathingPhase[] = ["inhale", "hold", "exhale", "rest"];

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "navigator" in window) {
    const nav = window.navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };
    nav.vibrate?.(pattern);
  }
}

function playTone(frequency: number, duration: number) {
  if (typeof window === "undefined") {
    return;
  }
  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    context.currentTime + duration
  );
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration + 0.05);
}

export default function BreathingActionScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { type, action: actionType } = useLocalSearchParams<{
    type: string;
    action: string;
  }>();

  const tasksQuery = useQuery(
    orpc.getTodayTasks.queryOptions({ queryKey: ["getTodayTasks"] })
  );

  const currentTask = tasksQuery.data?.tasks.find(
    (t) => t.actionType === actionType
  );
  const requiredCycles = currentTask?.requiredCycles ?? 4;

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fill = useRef(new Animated.Value(0)).current;

  const currentPhase = PHASES[phaseIndex] ?? "inhale";
  const duration = DEFAULT_PHASES[currentPhase] * 1000;
  const phaseLabel = currentPhase.toUpperCase();
  const progress = Math.min(cycles / requiredCycles, 1);

  const completeMutation = useMutation(
    orpc.completeWellnessAction.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: ["getSpriteState"] });
        queryClient.invalidateQueries({ queryKey: ["getMoonlightCredits"] });
        queryClient.invalidateQueries({ queryKey: ["getWellnessHistory"] });
        queryClient.invalidateQueries({ queryKey: ["getTodayTasks"] });
        setCompleted(true);
        setRunning(false);
      },
    })
  );

  const handleComplete = useCallback(() => {
    if (!actionType) {
      return;
    }
    completeMutation.mutate({
      actionType: actionType as
        | "breathing_morning"
        | "breathing_evening"
        | "breathing_night",
      durationSeconds: cycles * 16,
    });
  }, [actionType, completeMutation, cycles]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!running) {
      Animated.timing(fill, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      return;
    }

    const startValue =
      currentPhase === "inhale"
        ? 0
        : currentPhase === "hold"
          ? 1
          : currentPhase === "exhale"
            ? 1
            : 0.15;
    const endValue =
      currentPhase === "inhale"
        ? 1
        : currentPhase === "hold"
          ? 1
          : currentPhase === "exhale"
            ? 0
            : 0;

    fill.setValue(startValue);

    if (currentPhase === "inhale") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      vibrate(25);
      playTone(220, 0.1);
    } else if (currentPhase === "hold") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
      vibrate([20, 30, 20]);
      playTone(330, 0.08);
    } else if (currentPhase === "exhale") {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start();
      vibrate(25);
      playTone(180, 0.15);
    } else {
      Animated.timing(fill, {
        toValue: endValue,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }

    timerRef.current = setTimeout(() => {
      setPhaseIndex((current) => {
        const next = (current + 1) % PHASES.length;
        if (next === 0) {
          setCycles((value) => value + 1);
        }
        return next;
      });
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentPhase, duration, fill, running]);

  useEffect(() => {
    if (!running) {
      return;
    }
    vibrate([20, 30, 20]);
  }, [currentPhase, running]);

  useEffect(() => {
    if (cycles >= requiredCycles && running) {
      setRunning(false);
    }
  }, [cycles, requiredCycles, running]);

  const handleStart = () => {
    setCycles(0);
    setPhaseIndex(0);
    setRunning(true);
    setCompleted(false);
  };

  const handleStop = () => {
    setRunning(false);
    setPhaseIndex(0);
  };

  const isComplete = cycles >= requiredCycles;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-section bg-background px-page py-page">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="gap-4 border-border border-b-2 px-card py-card">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.3em]">
              {type === "morning"
                ? "Morning"
                : type === "afternoon"
                  ? "Afternoon"
                  : "Night"}{" "}
              Breathing
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              {currentTask?.title ?? "Breath Rhythm"}
            </Text>
            <Text className="max-w-[28rem] font-normal font-sans text-base text-muted-foreground leading-6">
              {currentTask?.description ??
                "Complete a breathing session to earn Moonlight Credits."}
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            {/* Cycles Progress */}
            <View className="rounded-card border-2 border-border bg-background px-card py-card">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                  Progress
                </Text>
                <Text className="font-black font-sans text-foreground text-lg">
                  {Math.min(cycles, requiredCycles)}/{requiredCycles} cycles
                </Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
              <Text className="mt-1 text-right font-normal font-sans text-muted-foreground text-xs">
                {isComplete
                  ? "All cycles complete!"
                  : `${requiredCycles - cycles} cycle${requiredCycles - cycles > 1 ? "s" : ""} to go`}
              </Text>
            </View>

            {/* Breathing Visual - simplified: one container, one scaling square */}
            <View className="items-center gap-4 rounded-card border-2 border-border bg-background px-card py-card">
              <View className="items-center gap-1">
                <Text className="text-center font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  {running ? "Current Phase" : "Ready"}
                </Text>
                <Text className="text-center font-black font-sans text-4xl text-foreground tracking-tight">
                  {running ? phaseLabel : "Breathe"}
                </Text>
                <Text className="text-center font-normal font-sans text-muted-foreground text-sm">
                  {running
                    ? `${DEFAULT_PHASES[currentPhase]} seconds`
                    : "Press Start to begin"}
                </Text>
              </View>

              <View className="w-full items-center justify-center py-2">
                <View className="h-48 w-48 items-center justify-center rounded-[34px] border-2 border-border bg-muted/30">
                  <Animated.View
                    className="rounded-[20px] border-2 border-border"
                    style={{
                      width: fill.interpolate({
                        inputRange: [0, 1],
                        outputRange: [48, 144],
                      }),
                      height: fill.interpolate({
                        inputRange: [0, 1],
                        outputRange: [48, 144],
                      }),
                      backgroundColor: fill.interpolate({
                        inputRange: [0, 0.15, 1],
                        outputRange: [
                          colors.background,
                          colors.primary,
                          colors.secondary,
                        ],
                      }),
                    }}
                  />
                </View>
              </View>

              <View className="w-full flex-row items-center justify-between">
                <View>
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Cycles
                  </Text>
                  <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                    {cycles}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Status
                  </Text>
                  <Text className="mt-1 font-black font-sans text-2xl text-foreground">
                    {completed
                      ? "Done ✓"
                      : isComplete
                        ? "Ready ✓"
                        : running
                          ? "Running"
                          : "Ready"}
                  </Text>
                </View>
              </View>
            </View>

            {completed || isComplete ? (
              <View className="items-center gap-3 rounded-card border-2 border-green-300 bg-green-50 px-card py-card">
                <Text className="font-black font-sans text-2xl text-green-800">
                  ✓ {completed ? "Session Complete" : "All Cycles Done"}
                </Text>
                <Text className="text-center font-normal font-sans text-green-700 text-sm">
                  {completed
                    ? `You earned Moonlight Credits for completing ${cycles} breathing cycles!`
                    : "Great work! Complete the session to earn credits."}
                </Text>
                {!completed && (
                  <Button
                    className="w-full"
                    loading={completeMutation.isPending}
                    onPress={handleComplete}
                    variant="primary"
                  >
                    Complete & Earn Credits
                  </Button>
                )}
                {completed && (
                  <Button className="w-full" href="/sprite" variant="primary">
                    Back to Dashboard
                  </Button>
                )}
              </View>
            ) : (
              <View className="flex-row gap-2">
                <Button
                  className="flex-1"
                  onPress={running ? handleStop : handleStart}
                  variant={running ? "secondary" : "primary"}
                >
                  {running ? "Stop" : "Start"}
                </Button>
              </View>
            )}

            <Button
              className="w-full"
              href="/sprite/actions"
              variant="secondary"
            >
              Back to Actions ›
            </Button>
          </View>
        </View>
      </Screen>
    </>
  );
}
