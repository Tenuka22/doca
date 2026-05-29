import { SignInButton, useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

interface Stats {
  approvedDoctors: number;
  pendingDoctors: number;
  sessionsByDay: { day: string; count: number }[];
  totalPatients: number;
  totalSessions: number;
}

export const Route = createFileRoute("/admin/")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {
      const initialData = await context.queryClient.fetchQuery<Stats>({
        queryKey: orpc.stats.queryKey(),
        queryFn: () => orpc.stats.call(),
      });
      return { initialData };
    } catch {
      return {
        initialData: {
          pendingDoctors: 0,
          approvedDoctors: 0,
          totalSessions: 0,
          totalPatients: 0,
          sessionsByDay: [],
        },
      };
    }
  },
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const user = useUser();
  const loaderData = Route.useLoaderData();
  const stats = loaderData.initialData;
  const role = user.user?.publicMetadata?.role;
  const name = user.user?.fullName ?? user.user?.username ?? "Admin";

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
  if (getMetadataRole(user.user?.publicMetadata) !== "admin") {
    return <div className="p-6 text-destructive">Unauthorized</div>;
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Signed in as {name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>Current role: {typeof role === "string" ? role : "user"}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              className={buttonVariants({ variant: "outline" })}
              search={{ page: 1, query: "" }}
              to="/admin/doc-requests"
            >
              Doctor requests
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              search={{ page: 1, query: "" }}
              to="/admin/doctors"
            >
              Doctors
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/admin/session"
            >
              Test Session
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Doctors</CardTitle>
          </CardHeader>
          <CardContent className="font-bold text-2xl">
            {stats.pendingDoctors}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approved Doctors</CardTitle>
          </CardHeader>
          <CardContent className="font-bold text-2xl">
            {stats.approvedDoctors}
          </CardContent>
        </Card>
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
            <CardTitle>Total Patients</CardTitle>
          </CardHeader>
          <CardContent className="font-bold text-2xl">
            {stats.totalPatients}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
