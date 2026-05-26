import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";

import { orpc } from "@/utils/orpc";

export default function OnboardingLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  const patientProfileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      throwOnError: false,
      queryFn: async () => {
        try {
          const data = await orpc.getPatientProfile.call();
          return data ?? {};
        } catch (e) {
          console.error(e);
          return {};
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
          const data = await orpc.getGuardianProfile.call();
          return data ?? {};
        } catch (e) {
          console.error(e);
          return {};
        }
      },
    })
  );

  const hasPatientProfile = Boolean(patientProfileQuery.data);
  const hasGuardianProfile = Boolean(guardianProfileQuery.data);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (patientProfileQuery.isLoading || guardianProfileQuery.isLoading) {
    return null;
  }

  if (hasPatientProfile || hasGuardianProfile) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
