import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";

import type { DoctorProfileData } from "../doctor";

export const Route = createFileRoute("/doctor/")({
  component: DoctorIndexRoute,
});

function DoctorIndexRoute() {
  const user = useUser();
  const loaderData = useLoaderData({ from: "/doctor" }) as {
    initialData: DoctorProfileData;
  };

  const profile = loaderData.initialData.profile;
  const role =
    loaderData.initialData.role ?? getMetadataRole(user.user?.publicMetadata);
  const name = user.user?.fullName ?? user.user?.username ?? "Doctor";

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Portal</CardTitle>
          <CardDescription>Signed in as {name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>Role: {role}</p>
          <p>Status: {getDoctorStatusLabel(profile)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function getMetadataRole(
  metadata: Record<string, unknown> | null | undefined
): string {
  const role = metadata?.role;
  return typeof role === "string" ? role : "user";
}

function getDoctorStatusLabel(
  profile: { permanent: boolean } | null | undefined
): string {
  if (!profile) {
    return "pending";
  }

  if (profile.permanent) {
    return "permanent";
  }

  return "pending";
}
