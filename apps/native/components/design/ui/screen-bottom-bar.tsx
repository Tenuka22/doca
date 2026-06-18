"use client";

import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ScreenBottomBarAction {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}

interface ScreenBottomBarReturnAction {
  href: string;
  icon: ReactNode;
}

interface ScreenBottomBarProps {
  leftActions?: ScreenBottomBarAction[];
  returnAction?: ScreenBottomBarReturnAction;
}

export function ScreenBottomBar({
  leftActions,
  returnAction,
}: ScreenBottomBarProps) {
  const hasLeft = leftActions && leftActions.length > 0;
  const hasRight = !!returnAction;

  return (
    <View className="absolute bottom-4 left-0 right-0 px-6">
      <View className="flex-row items-center justify-between">
        {/* Left Pill */}
        {hasLeft && (
          <View className="flex-row items-center gap-6 rounded-full border-2 border-border bg-background-elevated px-8 py-3 shadow-md">
            {leftActions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                className="items-center gap-1"
              >
                <View className="h-8 w-8 items-center justify-center text-foreground">
                  {action.icon}
                </View>
                <Text className="font-sans text-[10px] font-medium text-foreground">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Right Circular Button */}
        {hasRight && (
          <Link asChild href={returnAction.href as Href}>
            <Pressable className="h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-background-elevated shadow-md">
              {returnAction.icon}
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
