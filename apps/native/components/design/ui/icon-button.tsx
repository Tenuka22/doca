"use client";

import { Pressable, Text } from "react-native";

interface IconButtonProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconSize?: number;
  onPress: () => void;
  className?: string;
  disabled?: boolean;
}

export function IconButton({
  icon: Icon,
  iconSize = 24,
  onPress,
  className,
  disabled,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          onPress();
        }
      }}
      className={`h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background ${disabled ? "opacity-50" : ""} ${className ?? ""}`.trim()}
      disabled={disabled}
    >
      <Icon size={iconSize} />
    </Pressable>
  );
}
