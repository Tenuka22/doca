import { useUser } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { format } from "date-fns";
import {
  BanIcon,
  CheckCircleIcon,
  ClockIcon,
  Loader2,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
import { Button } from "@zen-doc/ui/components/button";
import { Badge } from "@zen-doc/ui/components/badge";

export const Route = createFileRoute("/doctor/")({
  component: DoctorDashboardRoute,
});

interface SessionItem {
  endAt: string;
  id: string;
  patientId: string;
  payoutAmount?: number | null;
  payoutStatus: string;
  startAt: string;
  status: string;
}

function formatPaymentLabel(status: string): string {
  if (status === "paid") {
    return "Payment completed";
  }
  if (status === "pending_payment") {
    return "Awaiting payment";
  }
  if (status === "refunded") {
    return "Refunded";
  }
  return status;
}

function getPaymentStatusColor(status: string): string {
  if (status === "paid") {
    return "text-emerald-500";
  }
  if (status === "pending_payment") {
    return "text-amber-500";
  }
  if (status === "refunded") {
    return "text-muted-foreground";
  }
  return "text-muted-foreground";
}

function SessionStatusBadge({ status }: { status: string }) {
  if (status === "requested") {
    return (
      <Badge
        className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
        variant="outline"
      >
        <ClockIcon className="mr-1 h-3 w-3" />
        Requested
      </Badge>
    );
  }

  if (status === "scheduled") {
    return (
      <Badge
        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
        variant="outline"
      >
        <CheckCircleIcon className="mr-1 h-3 w-3" />
        Scheduled
      </Badge>
    );
  }

  if (status === "attended") {
    return (
      <Badge
        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
        variant="outline"
      >
        <CheckCircleIcon className="mr-1 h-3 w-3" />
        Attended
      </Badge>
    );
  }

  return (
    <Badge
      className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
      variant="outline"
    >
      <XCircleIcon className="mr-1 h-3 w-3" />
      {status === "declined" ? "Declined" : "Cancelled"}
    </Badge>
  );
}

function BookedSessionsCard({
  sessions,
  isPending,
  isMarkingAttended,
  onMarkAttended,
}: {
  isMarkingAttended: boolean;
  isPending: boolean;
  onMarkAttended: (sessionId: string) => void;
  sessions: SessionItem[];
}) {
  return (
    <Card className="border border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm backdrop-blur-md">
      <CardHeader className="pb-3">
        <span className="font-semibold text-lg tracking-tight">
          Incoming Requests
        </span>
      </CardHeader>
      <CardContent className="h-[250px] overflow-y-auto pr-1">
        {isPending && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Loading requests...
          </div>
        )}

        {!isPending && sessions.length === 0 && (
          <div className="flex h-[200px] flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-muted-foreground text-sm">
              No pending requests
            </span>
          </div>
        )}

        {!isPending && sessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => {
              const start = new Date(session.startAt);
              const end = new Date(session.endAt);
              const formattedTime = `${format(
                start,
                "MMM d, h:mm a"
              )} - ${format(end, "h:mm a")}`;

              return (
                <div
                  className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/60 p-3 transition-colors hover:bg-card"
                  key={session.id}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        Patient ID: {session.patientId.slice(0, 12)}...
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formattedTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <SessionStatusBadge status={session.status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DoctorDashboardRoute() {
  const doctorSessionsQuery = useQuery({
    queryKey: orpc.listDoctorSessions.queryKey(),
    queryFn: () => orpc.listDoctorSessions.call(),
  });

  const markAttended = useMutation(
    orpc.markSessionAttended.mutationOptions({
      onSuccess: async () => {
        await doctorSessionsQuery.refetch();
      },
    })
  );

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <BookedSessionsCard
          isMarkingAttended={markAttended.isPending}
          isPending={doctorSessionsQuery.isPending}
          onMarkAttended={(id) => markAttended.mutate({ sessionId: id })}
          sessions={(doctorSessionsQuery.data?.sessions as SessionItem[]) ?? []}
        />
      </div>
    </div>
  );
}
