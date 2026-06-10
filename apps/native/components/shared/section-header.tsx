import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface SectionHeaderProps {
  subtitle: string;
  title: string;
  description?: string;
}

export function SectionHeader({
  subtitle,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <Animated.View className="gap-2 px-1" entering={FadeInDown.duration(600)}>
      <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
        {title}
      </Text>
      <Text className="font-black font-sans text-3xl text-foreground leading-none tracking-tighter">
        {subtitle}
      </Text>
      {description && (
        <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-relaxed">
          {description}
        </Text>
      )}
    </Animated.View>
  );
}
