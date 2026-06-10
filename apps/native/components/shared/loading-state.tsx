import { Text, View } from "react-native";

import { useThemeColor } from "@/utils/theme";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  const colors = useThemeColor();

  return (
    <View className="items-center justify-center py-16">
      <Text
        className="font-bold font-sans text-muted-foreground"
        style={{ color: colors.mutedForeground }}
      >
        {message}
      </Text>
    </View>
  );
}
