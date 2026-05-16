import { useAuth } from "@clerk/expo";
import { Link, Stack } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { SignOutButton } from "@/components/sign-out-button";

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ flexGrow: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-between gap-section px-page py-page">
          <View className="gap-section">
            <View className="gap-chip">
              <Text className="font-medium font-sans text-primary text-sm uppercase tracking-[0.25em]">
                NativeWind v5
              </Text>
              <Text className="font-medium font-sans text-4xl text-foreground leading-tight">
                Neo brutalist home screen.
              </Text>
              <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
                The app uses shared design tokens for colors, spacing, and
                radius.
              </Text>
            </View>

            <View className="rounded-card border-2 border-border bg-card p-card">
              <View className="flex-row items-center justify-between gap-chip">
                <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                  Current theme
                </Text>
                <Text className="font-medium font-sans text-primary text-sm">
                  {colorScheme ?? "light"}
                </Text>
              </View>
              <View className="mt-section flex-row gap-chip">
                <View className="h-16 flex-1 rounded-control border-2 border-border bg-muted" />
                <View className="h-16 flex-1 rounded-control border-2 border-border bg-primary" />
              </View>
            </View>
          </View>

          <View className="gap-chip">
            {isSignedIn ? (
              <SignOutButton />
            ) : (
              <View className="flex-row gap-chip">
                <Link asChild href="/sign-in">
                  <Pressable
                    accessibilityRole="button"
                    className="flex-1 items-center rounded-control border-2 border-border bg-card px-card py-control active:opacity-80"
                  >
                    <Text className="font-medium font-sans text-foreground">
                      Sign in
                    </Text>
                  </Pressable>
                </Link>
                <Link asChild href="/sign-up">
                  <Pressable
                    accessibilityRole="button"
                    className="flex-1 items-center rounded-control border-2 border-border bg-primary px-card py-control active:opacity-80"
                  >
                    <Text className="font-medium font-sans text-primary-foreground">
                      Sign up
                    </Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
