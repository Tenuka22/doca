"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, Wind, Zap } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { playToneSequence } from "@/utils/audio";
import { vibrate } from "@/utils/haptics";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function StretchingActionScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [completed, setCompleted] = useState(false);

  const flowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flowScale, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flowScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      actionType: "stretching",
      metadata: JSON.stringify({ completed: true }),
    });
  }, [completeMutation]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="bg-background">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-8 px-page py-12 pb-32"
        >
          {/* Header */}
          <View className="items-center gap-2">
            <View className="flex-row items-center gap-2 rounded-full bg-success/10 px-4 py-1.5">
              <Wind color={colors.success} size={14} />
              <Text className="font-bold font-sans text-[10px] text-success uppercase tracking-widest">
                Morning Flow
              </Text>
            </View>
            <Text className="text-center font-black font-sans text-4xl text-foreground">
              Stretching
            </Text>
            <Text className="max-w-[250px] text-center font-medium font-sans text-muted-foreground text-sm">
              Awaken your muscles and release tension.
            </Text>
          </View>

          {/* Visualizer Area */}
          <View className="relative items-center justify-center py-4">
            <View className="absolute h-48 w-48 rounded-full bg-success/5 blur-3xl" />
            <Animated.View style={{ transform: [{ scale: flowScale }] }}>
              <View className="h-32 w-32 items-center justify-center rounded-full border-4 border-success/20 bg-success/10 shadow-2xl shadow-success/20">
                <Wind color={colors.success} opacity={0.8} size={48} />
              </View>
            </Animated.View>
          </View>

          {completed ? (
            <View className="items-center gap-4 rounded-card border-2 border-success/30 bg-success/10 p-6">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <Zap color={colors.success} size={24} />
              </View>
              <View className="items-center">
                <Text className="font-black font-sans text-success text-xl">
                  Flow Complete!
                </Text>
                <Text className="text-center font-bold font-sans text-success/80 text-xs">
                  Your body feels fluid and energized. You earned +10 Credits.
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
            <View className="gap-6">
              <View className="rounded-card border-2 border-border bg-card p-5 shadow-sm">
                <Text className="mb-4 text-center font-black font-sans text-foreground text-xs uppercase tracking-widest">
                  Recommended Sequence
                </Text>
                <View className="gap-3">
                  {[
                    "Neck Rolls",
                    "Shoulder Shrugs",
                    "Forward Fold",
                    "Side Reach",
                  ].map((item, i) => (
                    <View
                      className="flex-row items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-4"
                      key={i}
                    >
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-success/20">
                        <Text className="font-black text-[10px] text-success">
                          {i + 1}
                        </Text>
                      </View>
                      <Text className="font-bold font-sans text-foreground text-sm">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
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
                    Flow Status
                  </Text>
                  <Text className="font-black font-sans text-[10px] text-foreground">
                    Ready
                  </Text>
                </View>
                <View className="h-1 overflow-hidden rounded-full bg-muted">
                  <View
                    className="h-full rounded-full bg-success"
                    style={{ width: "0%" }}
                  />
                </View>
              </View>
            </View>
            <Button
              className="h-12 flex-1 shadow-lg shadow-success/20"
              disabled={completeMutation.isPending}
              onPress={handleComplete}
              variant="primary"
            >
              Finish Flow
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
