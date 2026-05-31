import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { env } from "@zen-doc/env/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";
import { getStoredSecret } from "@/utils/privacy";
import { orpc, queryClient } from "@/utils/orpc";
import { StripePaymentProvider } from "@/utils/stripe";
import { useThemeColor } from "@/utils/theme";

preventAutoHideAsync().catch(() => undefined);

const satoshiFonts = {
  Satoshi: require("../assets/Satoshi_Complete/Fonts/TTF/Satoshi-Variable.ttf"),
};

function ClerkApiAuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkAuthTokenGetter(getToken);

    return () => {
      setClerkAuthTokenGetter(null);
    };
  }, [getToken]);

  return null;
}

function OnboardingCheck() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const patientProfileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      throwOnError: false,
      queryFn: async () => {
        try {
          return (await orpc.getPatientProfile.call()) ?? null;
        } catch {
          return null;
        }
      },
    })
  );
  const guardianProfileQuery = useQuery(
    orpc.getGuardianProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      throwOnError: false,
      queryFn: async () => {
        try {
          return (await orpc.getGuardianProfile.call()) ?? null;
        } catch {
          return null;
        }
      },
    })
  );

  const hasPatientProfile = Boolean(patientProfileQuery.data);
  const hasGuardianProfile = Boolean(guardianProfileQuery.data);

  useEffect(() => {
    if (
      isLoaded &&
      isSignedIn &&
      !patientProfileQuery.isLoading &&
      !guardianProfileQuery.isLoading
    ) {
      const profile = patientProfileQuery.data;
      const encryptionIncomplete =
        hasPatientProfile &&
        (!profile?.secured || (profile?.secured && !profile?._securedData));

      if (!(hasPatientProfile || hasGuardianProfile) || encryptionIncomplete) {
        router.replace("/onboarding");
        return;
      }

      if (profile?.secured && profile?._securedData) {
        getStoredSecret().then((secret) => {
          if (!secret) {
            router.replace("/onboarding");
          }
        });
      }
    }
  }, [
    guardianProfileQuery.isLoading,
    isLoaded,
    isSignedIn,
    hasGuardianProfile,
    hasPatientProfile,
    patientProfileQuery.data,
    patientProfileQuery.isLoading,
    router,
  ]);

  return null;
}

export default function RootLayout() {
  const { background, foreground } = useThemeColor();
  const [fontsLoaded, fontError] = useFonts(satoshiFonts);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideAsync().catch(() => undefined);
    }
  }, [fontError, fontsLoaded]);

  if (!(fontsLoaded || fontError)) {
    return null;
  }

  return (
    <ClerkProvider
      publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ClerkApiAuthBridge />
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StripePaymentProvider>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: background,
                },
                headerTitleStyle: {
                  fontFamily: "Satoshi",
                  fontWeight: "500",
                  color: foreground,
                },
                headerTintColor: foreground,
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(onboarding)"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="sprite" options={{ headerShown: false }} />
              <Stack.Screen name="test" options={{ headerShown: false }} />
            </Stack>
            <OnboardingCheck />
            <StatusBar style="auto" />
          </StripePaymentProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
