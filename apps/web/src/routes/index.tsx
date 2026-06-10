import { UserButton, useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { buttonVariants } from "@zen-doc/ui/components/button";
import { Card, CardContent } from "@zen-doc/ui/components/card";
import { ArrowRightIcon, ShieldIcon, StethoscopeIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const user = useUser();
  const name = user.user?.fullName ?? user.user?.username;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between rounded-2xl border bg-card/50 px-5 py-3 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-tight">ZenDoc</span>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              className="cursor-pointer rounded-lg px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
              search={{ page: 1 }}
              to="/doctor"
            >
              Doctor
            </Link>
            {user.isLoaded && user.user?.publicMetadata?.role === "admin" && (
              <Link
                className="cursor-pointer rounded-lg px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                search={{ page: 1, query: "" }}
                to="/admin"
              >
                Admin
              </Link>
            )}
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

      <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-4">
          <Badge className="mb-4" variant="secondary">
            Doctor Onboarding & Admin Platform
          </Badge>
          <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
            Welcome to ZenDoc
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            Streamlined doctor onboarding, credential management, and
            administrative oversight for modern telehealth practices.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {user.isLoaded && user.user ? (
            <Link
              className={buttonVariants({
                className: "gap-2",
                size: "lg",
              })}
              to={
                user.user.publicMetadata?.role === "admin"
                  ? "/admin"
                  : "/doctor"
              }
            >
              Go to Dashboard
              <ArrowRightIcon className="size-4" />
            </Link>
          ) : (
            <>
              <Link className={buttonVariants({ size: "lg" })} to="/sign-up">
                Get Started
              </Link>
              <Link
                className={buttonVariants({ size: "lg", variant: "outline" })}
                to="/sign-in"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      <footer className="grid gap-4 pb-8 md:grid-cols-2">
        <Card className="cursor-pointer rounded-2xl border-border/60 transition-colors duration-200 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-xl border bg-muted/40 p-2.5 text-muted-foreground">
              <StethoscopeIcon className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Doctor Portal</p>
              <p className="text-muted-foreground text-xs">
                Manage your profile, availability, sessions, and earnings.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer rounded-2xl border-border/60 transition-colors duration-200 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-xl border bg-muted/40 p-2.5 text-muted-foreground">
              <ShieldIcon className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Admin Console</p>
              <p className="text-muted-foreground text-xs">
                Oversee doctors, sessions, plans, and platform activity.
              </p>
            </div>
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
