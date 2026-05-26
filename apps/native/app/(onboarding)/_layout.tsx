import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";

import { orpc } from "@/utils/orpc";

export default function OnboardingLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  const patientProfileQuery = useQuery({
    queryKey: orpc.getPatientProfile.queryKey(),
    queryFn: () => orpc.getPatientProfile.call(),
    enabled: isLoaded && isSignedIn,
    retry: false,
    throwOnError: false,
  });

  const guardianProfileQuery = useQuery({
    queryKey: orpc.getGuardianProfile.queryKey(),
    queryFn: () => orpc.getGuardianProfile.call(),
    enabled: isLoaded && isSignedIn,
    retry: false,
    throwOnError: false,
  });

  const hasPatientProfile = Boolean(patientProfileQuery.data);
  const hasGuardianProfile = Boolean(guardianProfileQuery.data);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
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
