import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type ButtonVariant = "primary" | "secondary" | "destructive" | "outline" | "ghost";
type ButtonSize = "sm" | "default";

interface ButtonProps {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  icon?: ReactNode;
  onPress?: () => unknown;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const Button = ({
  children,
  className,
  disabled,
  href,
  icon,
  onPress,
  variant = "primary",
  size = "default",
}: ButtonProps) => {
  const isString = typeof children === "string";
  const paddingClass = size === "sm" ? "px-4 py-1.5" : "px-card py-control";
  const isPrimary = variant === "primary";
  const isDestructive = variant === "destructive";
  const textColor = isPrimary
    ? "text-primary-foreground"
    : isDestructive
      ? "text-destructive-foreground"
      : "text-foreground";

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {icon && <View className={isString ? "" : ""}>{icon}</View>}
      {isString ? (
        <Text
          className={`text-center font-bold font-sans ${
            size === "sm" ? "text-sm" : "text-base"
          } ${textColor}`}
        >
          {children}
        </Text>
      ) : (
        <Text
          className={`font-bold font-sans ${size === "sm" ? "text-sm" : "text-base"} ${textColor}`}
        >
          {children}
        </Text>
      )}
    </View>
  );

  const button = (
    <Pressable
      accessibilityRole="button"
      className={`relative ${disabled ? "opacity-60" : ""} ${className ?? ""}`.trim()}
      disabled={disabled}
      onPress={() => onPress?.()}
      style={{ position: "relative", overflow: "visible" }}
    >
      {({ pressed }) => (
        <>
          <View
            className="absolute inset-0 size-full rounded-control bg-border"
            style={{
              transform: [{ translateX: 4 }, { translateY: 4 }],
            }}
          />

          <View
            className={`w-full flex-row items-center justify-center rounded-control border-1 border-border ${paddingClass} ${
              isPrimary
                ? "bg-primary"
                : isDestructive
                  ? "bg-destructive"
                  : "bg-card"
            }`}
            style={{
              transform:
                pressed && !disabled
                  ? [{ translateX: 4 }, { translateY: 4 }]
                  : [{ translateX: 0 }, { translateY: 0 }],
            }}
          >
            {content}
          </View>
        </>
      )}
    </Pressable>
  );

  if (href) {
    return (
      <Link asChild href={href as Href}>
        {button}
      </Link>
    );
  }

  return button;
};
