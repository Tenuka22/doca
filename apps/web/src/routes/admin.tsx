import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@suwa/ui/components/sidebar";
import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ShieldIcon } from "lucide-react";
import { Button } from "@suwa/ui/components/button";

import { AdminSidebar } from "@/components/admin-sidebar";
import { requireAuth } from "@/utils/auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await requireAuth(["admin"]).catch(() => null);
    return { session };
  },
  loader: ({ context }) => ({ session: context.session }),
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const { session } = Route.useLoaderData();

  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle>Unauthorized</CardTitle>
              <CardDescription>
                You do not have admin access or are not signed in.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/sign-in">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 pl-3 backdrop-blur-md supports-backdrop-filter:bg-background/60">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="font-medium text-sm">Admin Console</p>
              <p className="truncate text-muted-foreground text-sm">
                Signed in as {session.name ?? session.email ?? "Admin"}
              </p>
            </div>
          </header>
          <div className="flex-1 p-4">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
