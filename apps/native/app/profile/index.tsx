import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { orpc, queryClient } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "navigator" in window) {
    const nav = window.navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };
    nav.vibrate?.(pattern);
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [alias, setAlias] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dirty, setDirty] = useState(false);

  const profileQuery = useQuery(
    orpc.getPatientProfile.queryOptions()
  );

  useEffect(() => {
    if (profileQuery.data) {
      setAlias(profileQuery.data.alias ?? "");
      setPhone(profileQuery.data.phone ?? "");
      setEmail(profileQuery.data.email ?? "");
    }
  }, [profileQuery.data]);

  const updateMutation = useMutation(
    orpc.updatePatientProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getPatientProfile"] });
        setDirty(false);
        vibrate([40, 20, 40]);
      },
    })
  );

  const handleSave = () => {
    updateMutation.mutate({
      alias,
      phone: phone || undefined,
      email: email || undefined,
    });
  };

  const handleBack = () => {
    vibrate(15);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const changed =
    alias !== (profileQuery.data?.alias ?? "") ||
    phone !== (profileQuery.data?.phone ?? "") ||
    email !== (profileQuery.data?.email ?? "");

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-section bg-background px-page py-page pb-24">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="items-center gap-2 border-border border-b-2 px-card py-6">
            <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted">
              <User color={colors.mutedForeground} size={28} />
            </View>
            <Text className="font-black font-sans text-2xl text-foreground tracking-tight">
              Profile
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            <Field
              label="Display Name"
              onChangeText={(text) => {
                setAlias(text);
                setDirty(true);
              }}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={alias}
            />

            <Field
              keyboardType="phone-pad"
              label="Phone"
              onChangeText={(text) => {
                setPhone(text);
                setDirty(true);
              }}
              placeholder="Phone number"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
            />

            <Field
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              onChangeText={(text) => {
                setEmail(text);
                setDirty(true);
              }}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              value={email}
            />

            <Button
              disabled={!changed || updateMutation.isPending}
              onPress={handleSave}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>

            {updateMutation.isSuccess && (
              <Text className="text-center font-bold font-sans text-success text-sm">
                Profile updated successfully!
              </Text>
            )}

            {updateMutation.isError && (
              <Text className="text-center font-bold font-sans text-destructive text-sm">
                Failed to update profile. Please try again.
              </Text>
            )}
          </View>
        </View>
      </Screen>
      <ScreenBottomBar>
        <View className="flex-1" />
        <Pressable
          className="aspect-square h-12 items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
          onPress={handleBack}
        >
          <ArrowLeft color="#ffffff" size={16} />
        </Pressable>
      </ScreenBottomBar>
    </>
  );
}
