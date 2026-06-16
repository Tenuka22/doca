"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, Droplet, Zap } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playToneSequence } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const GLASS_GOAL = 8;

export default function HydrationActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [glasses, setGlasses] = useState(0);
  const [completed, setCompleted] = useState(false);

  const dropScale = useRef(new Animated.Value(1)).current;
  const waterLevel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dropScale, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dropScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(waterLevel, {
      toValue: glasses / GLASS_GOAL,
      duration: 500,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: false,
    }).start();
  }, [glasses]);

  const completeMutation = useMutation(
    orpc.completeWellnessAction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getSpriteState.key() });
        queryClient.invalidateQueries({
          queryKey: orpc.getMoonlightCredits.key(),
        });
        queryClient.invalidateQueries({ queryKey: orpc.getTodayTasks.key() });
        setCompleted(true);
        playToneSequence();
      },
    })
  );

  const handleComplete = useCallback(() => {
    vibrate(30);
    completeMutation.mutate({
      actionType: "hydration",
      metadata: JSON.stringify({ glasses }),
    });
  }, [glasses, completeMutation]);

  const addGlass = () => {
    if (glasses < GLASS_GOAL) {
      vibrate(20);
      setGlasses((g) => g + 1);
    }
  };

  const removeGlass = () => {
    if (glasses > 0) {
      vibrate(15);
      setGlasses((g) => g - 1);
    }
  };

  const progress = glasses / GLASS_GOAL;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="bg-background">
        <View className="flex-1 items-center justify-between px-page py-12">
          {/* Header */}
          <View className="items-center gap-2">
            <View className="flex-row items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
              <Droplet color={colors.primary} size={14} />
              <Text className="font-bold font-sans text-[10px] text-primary uppercase tracking-widest">
                Vitality Check
              </Text>
            </View>
            <Text className="text-center font-black font-sans text-4xl text-foreground">
              Hydration
            </Text>
            <Text className="max-w-[250px] text-center font-medium font-sans text-muted-foreground text-sm">
              Keep your Sprite hydrated for maximum energy.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="relative w-full flex-1 items-center justify-center">
            <View className="absolute h-64 w-64 rounded-full border-2 border-primary/20 opacity-30" />

            <Animated.View style={{ transform: [{ scale: dropScale }] }}>
              <View className="h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-primary/10 shadow-2xl shadow-primary/20">
                <Animated.View
                  style={{
                    height: waterLevel.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: colors.primary,
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    opacity: 0.6,
                  }}
                />
                <Droplet
                  color={glasses > 0 ? "white" : colors.primary}
                  fill={glasses > 0 ? "white" : "transparent"}
                  opacity={0.8}
                  size={48}
                />
              </View>
            </Animated.View>

            <View className="absolute bottom-[-60] items-center gap-1">
              <Text className="font-black font-sans text-5xl text-primary tracking-tight">
                {glasses}
                <Text className="text-2xl text-muted-foreground">
                  /{GLASS_GOAL}
                </Text>
              </Text>
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-widest">
                Glasses Today
              </Text>
            </View>
          </View>

          {/* Controls Area */}
          <View className="mt-16 w-full gap-6">
            {completed ? (
              <View className="items-center gap-4 rounded-card border-2 border-success/30 bg-success/10 p-6">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-success/20">
                  <Zap color={colors.success} size={24} />
                </View>
                <View className="items-center">
                  <Text className="font-black font-sans text-success text-xl">
                    Well Hydrated!
                  </Text>
                  <Text className="text-center font-bold font-sans text-success/80 text-xs">
                    Your Sprite is feeling refreshed. You earned +10 Moonlight
                    Credits.
                  </Text>
                </View>
                <Button
                  className="mt-2 w-full"
                  href="/sprite"
                  variant="secondary"
                >
                  Back to Mission Hub
                </Button>
              </View>
            ) : (
              <View className="flex-row gap-4">
                <Pressable
                  className="h-16 flex-1 items-center justify-center rounded-2xl border-2 border-border bg-card shadow-sm"
                  onPress={removeGlass}
                >
                  <Text className="font-black font-sans text-2xl text-foreground">
                    −
                  </Text>
                </Pressable>
                <Pressable
                  className="h-16 flex-[2] items-center justify-center rounded-2xl border-2 border-primary bg-primary/5 shadow-sm"
                  onPress={addGlass}
                >
                  <Text className="font-black font-sans text-lg text-primary">
                    + Add Glass
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Screen>

      <ScreenBottomBar>
        {completed ? (
          <View className="flex-1" />
        ) : (
          <>
            <View className="mr-2 h-12 flex-[1.2] flex-row items-center justify-center gap-3 rounded-control border-2 border-border bg-background px-3 py-2">
              <CheckCircle2 color={colors.success} size={14} />
              <View className="flex-1 gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bold font-sans text-[8px] text-muted-foreground uppercase">
                    Goal Progress
                  </Text>
                  <Text className="font-black font-sans text-[10px] text-foreground">
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <View className="h-1 overflow-hidden rounded-full bg-muted">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress * 100}%` }}
                  />
                </View>
              </View>
            </View>
            <Button
              className="h-12 flex-1 shadow-lg shadow-primary/20"
              disabled={glasses === 0 || completeMutation.isPending}
              onPress={handleComplete}
              variant="primary"
            >
              Log Session
            </Button>
          </>
        )}
        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            vibrate(15);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
