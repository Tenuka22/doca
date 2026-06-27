import { UserButton, useUser } from "@clerk/tanstack-react-start";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { Badge } from "@suwa/ui/components/badge";
import { buttonVariants } from "@suwa/ui/components/button";
import { Card, CardContent } from "@suwa/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CalendarClockIcon,
  ShieldIcon,
  StethoscopeIcon,
  UsersIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const user = useUser();
  const name = user.user?.fullName ?? user.user?.username;
  const role = user.user?.publicMetadata?.role;
  const primaryHref =
    role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/sign-up";

  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex h-14 items-center justify-between rounded-2xl border bg-card/70 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-lg tracking-tight">
              {APP_DISPLAY_NAME}
            </span>
            <nav className="hidden items-center gap-2 md:flex">
              <Link
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                search={{ page: 1 }}
                to="/doctor"
              >
                Doctor
              </Link>
              {user.isLoaded && user.user ? (
                <Link
                  className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  to="/tenant"
                >
                  Tenant
                </Link>
              ) : null}
              {role === "admin" ? (
                <Link
                  className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  search={{ page: 1, query: "" }}
                  to="/admin"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user.isLoaded && user.user ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-muted-foreground text-sm sm:inline">
                  {name}
                </span>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  to="/sign-in"
                >
                  Sign In
                </Link>
                <Link
                  className={buttonVariants({ variant: "default", size: "sm" })}
                  to="/sign-up"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 sm:py-16">
          <section className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Doctor onboarding</Badge>
                <Badge variant="outline">Admin review</Badge>
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="max-w-2xl font-semibold text-4xl tracking-tight sm:text-5xl">
                  One place to manage doctors, schedules, and approvals.
                </h1>
                <p className="max-w-2xl text-balance text-muted-foreground text-base leading-7 sm:text-lg">
                  {APP_DISPLAY_NAME} streamlines doctor setup, admin review,
                  clinic operations, and booking readiness without extra admin
                  noise.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  className={buttonVariants({
                    className: "gap-2",
                    size: "lg",
                    variant: user.isLoaded && user.user ? "default" : "default",
                  })}
                  to={primaryHref}
                >
                  {user.isLoaded && user.user ? "Go to dashboard" : "Get started"}
                  <ArrowRightIcon className="size-4" />
                </Link>
                <Link
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                  to="/sign-in"
                >
                  Sign In
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: StethoscopeIcon,
                    title: "Doctor Portal",
                    desc: "Profiles, plans, files, and availability.",
                  },
                  {
                    icon: ShieldIcon,
                    title: "Admin Console",
                    desc: "Review approvals and platform activity.",
                  },
                  {
                    icon: CalendarClockIcon,
                    title: "Clinic Ops",
                    desc: "Attendance and schedule management.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <Card className="rounded-2xl border-border/60 bg-card/70" key={title}>
                    <CardContent className="flex items-start gap-3">
                      <div className="rounded-xl border bg-muted/40 p-2.5 text-muted-foreground">
                        <Icon className="size-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-sm">{title}</p>
                        <p className="text-muted-foreground text-xs leading-5">
                          {desc}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-card via-card to-muted/30 shadow-lg">
                <CardContent className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Quick access</Badge>
                    <UsersIcon className="size-5 text-muted-foreground" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="font-semibold text-2xl tracking-tight">
                      {user.isLoaded && user.user ? name : "Guest"}
                    </p>
                    <p className="text-muted-foreground text-sm leading-6">
                      {role === "admin"
                        ? "Jump straight into admin review and operations."
                        : role === "doctor"
                          ? "Continue your onboarding and manage your practice."
                          : "Create an account to access doctor and tenant tools."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      className={buttonVariants({ className: "w-full justify-start gap-2", variant: "outline" })}
                      search={{ page: 1 }}
                      to="/doctor"
                    >
                      <StethoscopeIcon className="size-4" />
                      Doctor area
                    </Link>
                    <Link
                      className={buttonVariants({ className: "w-full justify-start gap-2", variant: "outline" })}
                      to="/tenant"
                    >
                      <CalendarClockIcon className="size-4" />
                      Tenant area
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
