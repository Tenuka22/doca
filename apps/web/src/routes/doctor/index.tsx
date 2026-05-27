import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Card, CardContent, CardHeader } from "@zen-doc/ui/components/card";
import { format } from "date-fns";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/")({
  component: DoctorDashboardRoute,
});

interface SessionItem {
  doctorEarnedCents?: number | null;
  endAt: string;
  id: string;
  patientId: string;
  startAt: string;
  status: string;
}

function SessionStatusBadge({ status }: { status: string }) {
  if (status === "requested" || status === "rescheduled") {
    return (
      <Badge
        className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
        variant="outline"
      >
        <ClockIcon className="mr-1 h-3 w-3" />
        {status === "rescheduled" ? "Rescheduled" : "Requested"}
      </Badge>
    );
  }

  if (status === "approved") {
    return (
      <Badge
        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
        variant="outline"
      >
        <CheckCircleIcon className="mr-1 h-3 w-3" />
        Approved
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

  if (status === "timing_balance_failure") {
    return (
      <Badge
        className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
        variant="outline"
      >
        <XCircleIcon className="mr-1 h-3 w-3" />
        Failed to Agree
      </Badge>
    );
  }

  return (
    <Badge
      className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
      variant="outline"
    >
      <XCircleIcon className="mr-1 h-3 w-3" />
      Failed
    </Badge>
  );
}

function IncomingRequestsCard({
  sessions,
  isPending,
}: {
  isPending: boolean;
  sessions: SessionItem[];
}) {
  const pendingSessions = sessions.filter(
    (s) => s.status === "requested" || s.status === "rescheduled"
  );

  return (
    <Card className="border border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm backdrop-blur-md">
      <CardHeader className="pb-3">
        <span className="font-semibold text-lg tracking-tight">
          Pending Requests
        </span>
      </CardHeader>
      <CardContent className="h-[250px] overflow-y-auto pr-1">
        {isPending && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Loading requests...
          </div>
        )}

        {!isPending && pendingSessions.length === 0 && (
          <div className="flex h-[200px] flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-muted-foreground text-sm">
              No pending requests
            </span>
          </div>
        )}

        {!isPending && pendingSessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {pendingSessions.map((session) => {
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

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <IncomingRequestsCard
          isPending={doctorSessionsQuery.isPending}
          sessions={(doctorSessionsQuery.data?.sessions as SessionItem[]) ?? []}
        />
      </div>
    </div>
  );
}
