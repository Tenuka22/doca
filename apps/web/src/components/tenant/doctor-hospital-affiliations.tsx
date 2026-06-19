"use client";

import { Button, Chip, Separator, Skeleton, toast } from "@heroui/react";
import { XIcon } from "lucide-react";

import { PageTitle } from "@/components/typography";
import {
  useListDoctorAffiliations,
  useListDoctorInvitations,
  useRespondInvitation,
} from "@/hooks/queries/tenant";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DoctorHospitalAffiliations() {
  const { data: affiliationsData, isLoading: affLoading } =
    useListDoctorAffiliations();
  const { data: invitationsData, isLoading: invLoading } =
    useListDoctorInvitations();
  const respondInvitation = useRespondInvitation();

  const affiliations = affiliationsData?.affiliations ?? [];
  const pendingInvitations = (invitationsData?.invitations ?? []).filter(
    (i) => i.status === "PENDING"
  );

  const handleRespond = async (
    invitationId: string,
    action: "ACCEPTED" | "DECLINED"
  ) => {
    try {
      await respondInvitation.mutateAsync({
        invitationId,
        action,
        availabilityWindows:
          action === "ACCEPTED"
            ? [
                {
                  dayOfWeek: 1,
                  startTime: "09:00",
                  endTime: "17:00",
                },
              ]
            : undefined,
      });
      toast.success(
        action === "ACCEPTED"
          ? "Invitation accepted! You can now set your availability."
          : "Invitation declined."
      );
    } catch {
      toast.danger("Failed to respond to invitation");
    }
  };

  if (affLoading || invLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-5 w-80" />
        <Separator />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  const hasContent = affiliations.length > 0 || pendingInvitations.length > 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Hospital affiliations</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Your hospital memberships and pending invitations
          </p>
        </div>
        {affiliations.length > 0 && (
          <Chip color="default" variant="soft">
            {affiliations.length} active
          </Chip>
        )}
      </div>

      <Separator />

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-light text-amber-500 text-sm">
            Pending invitations ({pendingInvitations.length})
          </p>
          {pendingInvitations.map((inv) => (
            <div
              className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
              key={inv.id}
            >
              <div className="flex flex-col gap-1">
                <p className="font-light text-sm">Hospital Invitation</p>
                {inv.message && (
                  <p className="font-light text-foreground/60 text-xs">
                    &ldquo;{inv.message}&rdquo;
                  </p>
                )}
                <p className="font-light text-foreground/60 text-xs">
                  Received {new Date(inv.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  isDisabled={respondInvitation.isPending}
                  onPress={() => handleRespond(inv.id, "ACCEPTED")}
                  size="sm"
                >
                  Accept
                </Button>
                <Button
                  isDisabled={respondInvitation.isPending}
                  onPress={() => handleRespond(inv.id, "DECLINED")}
                  size="sm"
                  variant="outline"
                >
                  <XIcon className="size-3" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Affiliations */}
      {affiliations.length > 0 ? (
        <div className="flex flex-col gap-2">
          {affiliations.map((aff) => (
            <div
              className="rounded-xl border border-border px-4 py-3"
              key={aff.id}
            >
              <div className="flex items-center justify-between">
                <p className="font-light text-sm">{aff.tenantName}</p>
                <Chip
                  className="text-[10px]"
                  color={
                    aff.status === "ACTIVE"
                      ? "accent"
                      : aff.status === "INACTIVE"
                        ? "default"
                        : "default"
                  }
                  variant={aff.status === "ACTIVE" ? "soft" : "tertiary"}
                >
                  {aff.status}
                </Chip>
              </div>
              {aff.tenantType && (
                <p className="font-light text-foreground/60 text-xs">
                  {aff.tenantType === "PRIVATE_HOSPITAL"
                    ? "Private Hospital"
                    : "Public Hospital"}
                </p>
              )}
              {aff.availabilityWindows.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {aff.availabilityWindows.map((w, i) => (
                    <Chip className="text-[10px]" key={i} variant="tertiary">
                      {DAYS[w.dayOfWeek]} {w.startTime}&ndash;{w.endTime}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !hasContent && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-light text-sm">No hospital affiliations</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              You haven&rsquo;t joined any hospitals yet. Invitations will
              appear here.
            </p>
          </div>
        )
      )}
    </section>
  );
}
