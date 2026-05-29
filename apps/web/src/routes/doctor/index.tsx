import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { buttonVariants } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@zen-doc/ui/components/chart";
import { format } from "date-fns";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { orpc } from "@/utils/orpc";

interface DoctorStats {
  monthlyEarnings: {
    month: string;
    earnings: number;
  }[];
  recentSessions: {
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    patientId: string;
    doctorEarnedCents: number | null;
  }[];
  totalEarnedCents: number;
  totalSessions: number;
  upcomingSessions: number;
}

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

export const Route = createFileRoute("/doctor/")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {
      const initialData = await context.queryClient.fetchQuery<DoctorStats>({
        queryKey: orpc.doctorStats.queryKey(),
        queryFn: () => orpc.doctorStats.call(),
      });
      return { initialData };
    } catch {
      return {
        initialData: {
          totalSessions: 0,
          totalEarnedCents: 0,
          upcomingSessions: 0,
          recentSessions: [],
          monthlyEarnings: [],
        },
      };
    }
  },
  component: DoctorDashboardRoute,
});

function DoctorDashboardRoute() {
  const user = useUser();
  const loaderData = Route.useLoaderData();
  const stats = loaderData.initialData;

  const doctorSessionsQuery = useQuery({
    queryKey: orpc.listDoctorSessions.queryKey(),
    queryFn: () => orpc.listDoctorSessions.call(),
  });

  if (!user.isLoaded) {
    return <div className="p-6">Loading...</div>;
  }
  if (!user.user) {
    return (
      <div className="p-6">
        <SignInButton />
      </div>
    );
  }

  const name = user.user?.fullName ?? user.user?.username ?? "Doctor";

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Dashboard</CardTitle>
          <CardDescription>Signed in as {name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>Current role: doctor</p>
          <div className="flex flex-wrap gap-4">
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/doctor/profile"
            >
              Profile
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/doctor/availability"
            >
              Availability
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/doctor/sessions"
            >
              All Sessions
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent className="font-bold text-2xl">
            {stats.totalSessions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Earned</CardTitle>
          </CardHeader>
          <CardContent className="font-bold text-2xl">
            ${(stats.totalEarnedCents / 100).toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="font-bold text-2xl">
            {stats.upcomingSessions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="font-bold text-2xl">
            {stats.recentSessions.length}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Earnings Trend (Last 6 Months)</CardTitle>
            <CardDescription>
              Monthly earnings over the past six months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.monthlyEarnings.length > 0 ? (
              <ChartContainer
                className="h-96 w-full"
                config={{
                  earnings: {
                    label: "Earnings",
                    color: "var(--chart-1)",
                  },
                }}
              >
                <AreaChart
                  accessibilityLayer
                  data={stats.monthlyEarnings}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    tickFormatter={(value: string) => {
                      const [year, month] = value.split("-");
                      const date = new Date(Number(year), Number(month) - 1);
                      return format(date, "MMM");
                    }}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickFormatter={(value: number) =>
                      `$${(value / 100).toFixed(0)}`
                    }
                    tickLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: number) =>
                          `$${(value / 100).toFixed(2)}`
                        }
                        indicator="line"
                      />
                    }
                    cursor={false}
                  />
                  <Area
                    dataKey="earnings"
                    fill="var(--color-earnings)"
                    fillOpacity={0.4}
                    stroke="var(--color-earnings)"
                    type="natural"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                No earnings data for the last 6 months
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentSessions.length > 0 ? (
              stats.recentSessions.map((session) => (
                <div
                  className="flex items-start justify-between gap-4 rounded-lg border border-border/40 bg-muted/50 p-4"
                  key={session.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
                      <ClockIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {session.patientId.slice(0, 8)}...
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(session.startAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <SessionStatusBadge status={session.status} />
                    {session.doctorEarnedCents !== null && (
                      <span className="ml-2 font-medium text-sm">
                        ${(session.doctorEarnedCents / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No recent sessions</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Incoming Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomingRequestsCard
              isPending={false} // We'll load the actual data from the stats or a separate query if needed
              sessions={
                (doctorSessionsQuery.data?.sessions as SessionItem[]) ?? []
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SignInButton() {
  return <ClerkSignInButton />;
}
