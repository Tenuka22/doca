import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import {
  ChevronLeft,
  ChevronRight,
  Clock3Icon,
  InboxIcon,
  Search,
  ShieldIcon,
  UserCheckIcon,
} from "lucide-react";
import { z } from "zod";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

interface PendingDoctor {
  bio: string | null;
  email: string | null;
  imageUrl: string | null;
  licenseNumber: string | null;
  matchesQuery: boolean;
  name: string;
  permanent: boolean;
  phone: string | null;
  role: string;
  userId: string;
}

interface PendingDoctorsPage {
  firstUserId: string | null;
  items: PendingDoctor[];
  lastUserId: string | null;
  nextPage: number | null;
  page: number;
  prevPage: number | null;
}

const adminSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  query: z.string().catch(""),
});

export const Route = createFileRoute("/admin/doc-requests/")({
  validateSearch: adminSearchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page,
    query: search.query,
  }),
  loader: async ({
    context,
    deps,
  }): Promise<{ initialData: PendingDoctorsPage }> => {
    const input = {
      page: deps.page,
      query: deps.query,
    };
    try {
      const initialData =
        await context.queryClient.fetchQuery<PendingDoctorsPage>({
          queryKey: orpc.pendingDoctors.queryKey({ input }),
          queryFn: () => orpc.pendingDoctors.call(input),
        });
      return { initialData };
    } catch {
      return {
        initialData: {
          items: [],
          page: 1,
          nextPage: null,
          prevPage: null,
          firstUserId: null,
          lastUserId: null,
        },
      };
    }
  },
  component: AdminDocRequestsRoute,
});

function AdminDocRequestsRoute() {
  const user = useUser();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const input = {
    page: search.page,
    query: search.query,
  };

  const pendingDoctors = useQuery({
    queryKey: orpc.pendingDoctors.queryKey({ input }),
    queryFn: () => orpc.pendingDoctors.call(input),
    initialData: loaderData.initialData,
    enabled:
      user.isLoaded &&
      !!user.user &&
      getMetadataRole(user.user.publicMetadata) === "admin",
  });
  const approveDoctor = useMutation(
    orpc.approveDoctor.mutationOptions({
      onSuccess: async () => {
        await pendingDoctors.refetch();
      },
    })
  );

  const rows = pendingDoctors.data?.items ?? [];

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
              <Badge variant="secondary">Doctor requests</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                Doctor requests
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                Review onboarding submissions, verify credentials, and approve
                new doctor accounts to join the platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="font-semibold text-xl tracking-tight">
                Pending submissions
              </h2>
              <p className="text-muted-foreground text-sm">
                Doctors awaiting your review and approval.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-9 w-full rounded-lg border border-border/60 bg-background pr-3 pl-9 text-sm outline-none focus:border-primary md:w-64"
                  onChange={(event) => {
                    navigate({
                      search: {
                        page: 1,
                        query: event.target.value,
                      },
                      replace: true,
                    });
                  }}
                  placeholder="Search doctor requests..."
                  value={search.query}
                />
              </div>
              <Button
                onClick={() => {
                  navigate({
                    search: {
                      page: 1,
                      query: "",
                    },
                    replace: true,
                  });
                }}
                size="sm"
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon />
                </EmptyMedia>
                <EmptyTitle>No pending requests</EmptyTitle>
                <EmptyDescription>
                  All doctor requests have been reviewed. Check back later for
                  new submissions.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map(
                (doctor: {
                  userId: string;
                  name: string;
                  email: string | null;
                  phone: string | null;
                  role: string;
                  permanent: boolean;
                }) => (
                  <Card
                    className="rounded-2xl border-border/60 transition-colors hover:bg-muted/30"
                    key={doctor.userId}
                  >
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                          <UserCheckIcon className="size-4" />
                        </div>

                        <div className="space-y-1">
                          <p className="font-medium text-sm">{doctor.name}</p>
                          <div className="flex flex-wrap gap-3">
                            {doctor.email ? (
                              <p className="text-muted-foreground text-xs">
                                {doctor.email}
                              </p>
                            ) : null}
                            {doctor.phone ? (
                              <p className="text-muted-foreground text-xs">
                                {doctor.phone}
                              </p>
                            ) : null}
                          </div>
                          <Badge
                            className="mt-1"
                            variant={
                              doctor.permanent ? "secondary" : "destructive"
                            }
                          >
                            <Clock3Icon className="size-3" />
                            {doctor.permanent ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        disabled={approveDoctor.isPending}
                        onClick={() => {
                          approveDoctor.mutate({ userId: doctor.userId });
                        }}
                        size="sm"
                      >
                        {approveDoctor.isPending ? "Approving..." : "Approve"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

          {rows.length > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {pendingDoctors.data?.page ?? search.page}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={!pendingDoctors.data?.prevPage}
                  onClick={() => {
                    navigate({
                      search: {
                        page: Math.max(1, search.page - 1),
                        query: search.query,
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
                  disabled={!pendingDoctors.data?.nextPage}
                  onClick={() => {
                    navigate({
                      search: {
                        page: search.page + 1,
                        query: search.query,
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
