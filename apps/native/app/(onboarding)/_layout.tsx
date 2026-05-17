import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";

import { orpc } from "@/utils/orpc";

export default function OnboardingLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  const profileQuery = useQuery({
    queryKey: orpc.getPatientProfile.queryKey(),
    queryFn: () => orpc.getPatientProfile.call(),
    enabled: isLoaded && isSignedIn,
    retry: false,
    throwOnError: false,
  });

  const isOnboardingComplete = profileQuery.data?.isOnboardingComplete ?? false;

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  if (profileQuery.isLoading) {
    return null;
  }

  if (isOnboardingComplete) {
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
