import { Link, Stack } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ flexGrow: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center px-page py-page">
          <View className="items-center gap-section rounded-card border-2 border-border bg-card p-card">
            <Text className="font-normal font-sans text-6xl">🤔</Text>
            <Text className="text-center font-medium font-sans text-2xl text-foreground">
              Page Not Found
            </Text>
            <Text className="max-w-sm text-center font-normal font-sans text-base text-muted-foreground leading-6">
              Sorry, the page you&apos;re looking for doesn&apos;t exist.
            </Text>
            <Link asChild href="/">
              <Pressable
                accessibilityRole="button"
                className="rounded-control border-2 border-border bg-primary px-card py-control active:opacity-80"
              >
                <Text className="font-medium font-sans text-primary-foreground">
                  Go to Home
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
