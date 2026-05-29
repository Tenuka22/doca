import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent, CardHeader } from "@zen-doc/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@zen-doc/ui/components/empty";
import { Separator } from "@zen-doc/ui/components/separator";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { format } from "date-fns";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeft,
  ChevronRight,
  Clock3Icon,
  ShieldIcon,
  XCircleIcon,
} from "lucide-react";
import { z } from "zod";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

interface SessionItem {
  createdAt: string;
  doctorId: string;
  endAt: string;
  id: string;
  patientId: string;
  startAt: string;
  status: string;
}

interface SessionsPage {
  items: SessionItem[];
  nextPage: number | null;
  page: number;
  prevPage: number | null;
}

const searchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute("/admin/sessions/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }): Promise<{ initialData: SessionsPage }> => {
    const input = { page: deps.page };
    try {
      const initialData = await context.queryClient.fetchQuery<SessionsPage>({
        queryKey: orpc.sessions.queryKey({ input }),
        queryFn: () => orpc.sessions.call(input),
      });
      return { initialData };
    } catch {
      return {
        initialData: {
          items: [],
          page: 1,
          prevPage: null,
          nextPage: null,
        },
      };
    }
  },
  component: AdminSessionsRoute,
});

function SessionStatusBadge({ status }: { status: string }) {
  if (status === "requested" || status === "rescheduled") {
    return (
      <Badge className="gap-1" variant="secondary">
        <Clock3Icon className="size-3.5" />
        {status === "requested" ? "Requested" : "Rescheduled"}
      </Badge>
    );
  }

  if (status === "approved" || status === "attended") {
    return (
      <Badge className="gap-1" variant="default">
        <CheckCircle2Icon className="size-3.5" />
        {status === "approved" ? "Approved" : "Attended"}
      </Badge>
    );
  }

  return (
    <Badge className="gap-1" variant="destructive">
      <XCircleIcon className="size-3.5" />
      Failed
    </Badge>
  );
}

function AdminSessionsRoute() {
  const user = useUser();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const input = { page: search.page };

  const sessionsQuery = useQuery({
    queryKey: orpc.sessions.queryKey({ input }),
    queryFn: () => orpc.sessions.call(input),
    initialData: loaderData.initialData,
    enabled:
      user.isLoaded &&
      !!user.user &&
      getMetadataRole(user.user.publicMetadata) === "admin",
  });

  const rows = sessionsQuery.data?.items ?? [];

  if (!user.isLoaded) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!user.user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold text-xl tracking-tight">
                Sign in required
              </h2>
              <p className="text-muted-foreground text-sm">
                Access the admin panel after signing in.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ClerkSignInButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (getMetadataRole(user.user?.publicMetadata) !== "admin") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold text-xl tracking-tight">
                Unauthorized
              </h2>
              <p className="text-muted-foreground text-sm">
                You do not have admin access.
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Admin console</Badge>
              <Badge variant="secondary">Sessions</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                All sessions
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                View all sessions across the platform, monitor their status, and
                track platform activity over time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-xl tracking-tight">
                Session history
              </h2>
              <p className="text-muted-foreground text-sm">
                All sessions ordered by most recent.
              </p>
            </div>

            <Badge className="gap-1" variant="secondary">
              <CalendarDaysIcon className="size-3" />
              {rows.length} session{rows.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarDaysIcon />
                </EmptyMedia>
                <EmptyTitle>No sessions yet</EmptyTitle>
                <EmptyDescription>
                  Sessions will appear once patients start booking appointments.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((session) => {
                const start = new Date(session.startAt);
                const end = new Date(session.endAt);

                return (
                  <Card
                    className="rounded-2xl border-border/60 transition-colors hover:bg-muted/30"
                    key={session.id}
                  >
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                          <CalendarDaysIcon className="size-4" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {session.doctorId.slice(0, 12)}...
                            </p>
                          </div>

                          <p className="text-muted-foreground text-sm">
                            {format(start, "EEE, MMM d • h:mm a")}
                          </p>

                          <div className="flex flex-wrap gap-3 text-muted-foreground text-xs">
                            <span>
                              Patient: {session.patientId.slice(0, 12)}...
                            </span>
                            <span>Ends at {format(end, "h:mm a")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                        <SessionStatusBadge status={session.status} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {rows.length > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {sessionsQuery.data?.page ?? search.page}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={!sessionsQuery.data?.prevPage}
                  onClick={() => {
                    navigate({
                      search: {
                        page: Math.max(1, search.page - 1),
                      },
                      replace: true,
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft className="mr-1 size-3" />
                  Prev
                </Button>
                <Button
                  disabled={!sessionsQuery.data?.nextPage}
                  onClick={() => {
                    navigate({
                      search: {
                        page: search.page + 1,
                      },
                      replace: true,
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  Next
                  <ChevronRight className="ml-1 size-3" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
