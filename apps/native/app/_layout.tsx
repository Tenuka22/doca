import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { env } from "@zen-doc/env/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";
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
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  const patientProfileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      throwOnError: false,
    })
  );

  useEffect(() => {
    console.log("OnboardingCheck deps:", {
      isLoaded,
      isSignedIn,
      isFetched: patientProfileQuery.isFetched,
      data: patientProfileQuery.data,
      pathname,
    });
    if (isLoaded && isSignedIn && patientProfileQuery.isFetched) {
      const needsSetup = !(
        patientProfileQuery.data?.secured &&
        patientProfileQuery.data?._securedData
      );
      console.log("OnboardingCheck needsSetup:", {
        needsSetup,
        secured: patientProfileQuery.data?.secured,
        _securedData: patientProfileQuery.data?._securedData,
        pathname,
        shouldRedirect:
          needsSetup &&
          pathname !== "/profile" &&
          !pathname.startsWith("/onboarding"),
      });
      if (
        needsSetup &&
        pathname !== "/profile" &&
        !pathname.startsWith("/onboarding")
      ) {
        console.log("OnboardingCheck redirecting to /profile");
        router.replace("/profile");
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    patientProfileQuery.isFetched,
    patientProfileQuery.data,
    router,
    pathname,
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
              <Stack.Screen name="(patient)" options={{ headerShown: false }} />
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
