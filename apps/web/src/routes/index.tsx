import { UserButton, useUser } from "@clerk/tanstack-react-start";
import { Button, Card, Chip } from "@heroui/react";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, ShieldIcon, StethoscopeIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const user = useUser();
  const navigate = useNavigate();
  const name = user.user?.fullName ?? user.user?.username;

  return (
    <div className="flex-1 size-full">
      <header className="sticky top-0 z-50 border-border/40 border-b bg-background/20 backdrop-blur-xl">
        <div className="px-8 flex h-16 max-w-7xl items-center justify-between">
          <img src="/Logo.png" className="size-12"/>
          <nav className="hidden items-center gap-2 sm:flex">

            {user.isLoaded && user.user && (
              <Button
                size="sm"
                onPress={() => navigate({ to: "/doctor", search: { page: 1 } })}
                variant="outline"
              >
                Doctor
              </Button>
              )}
            {user.isLoaded && user.user && (
              <Button
                size="sm"
                onPress={() => navigate({ to: "/tenant" })}
                variant="outline"
              >
                Tenant
              </Button>
            )}
            {user.isLoaded && user.user?.publicMetadata?.role === "admin" && (
              <Button
                size="sm"
                onPress={() =>
                  navigate({ to: "/admin", search: { page: 1, query: "" } })
                }
                variant="ghost"
              >
                Admin
              </Button>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user.isLoaded && user.user ? (
              <>
                <span className="hidden text-muted-foreground text-sm sm:inline">
                  {name}
                </span>
                <UserButton />
              </>
            ) : (
              <>
                <Button
                  onPress={() => navigate({ to: "/sign-in" })}
                    variant="tertiary"
                    size="sm"
                >
                  Sign In
                </Button>
                  <Button onPress={() => navigate({ to: "/sign-up" })}
                    size="sm"
                  >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 size-full">
        <section className="bg-gradient-to-b from-accent/5 via-accent/[2%] to-background">
          <div className="flex flex-col items-center px-6 text-center gap-3 pt-20">
            <Chip color="accent" variant="soft">
              Doctor Onboarding & Admin Platform
            </Chip>
            <h1 className="max-w-3xl font-light text-4xl tracking-tight pt-3 sm:text-5xl lg:text-6xl">
              Welcome to {APP_DISPLAY_NAME}
            </h1>
            <p className="max-w-2xl font-light text-lg text-muted-foreground sm:text-xl">
              Streamlined doctor onboarding, credential management, and
              administrative oversight for modern telehealth practices.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {user.isLoaded && user.user ? (
                <Button
                  onPress={() =>
                    navigate({
                      to:
                        user.user.publicMetadata?.role === "admin"
                          ? "/admin"
                          : "/doctor",
                    })
                  }
                  size="sm"
                >
                  Go to Dashboard
                  <ArrowRightIcon />
                </Button>
              ) : (
                <>
                  <Button
                    onPress={() => navigate({ to: "/sign-up" })}
                    size="sm"
                  >
                    Get Started
                  </Button>
                  <Button
                    onPress={() => navigate({ to: "/sign-in" })}
                    size="sm"
                    variant="tertiary"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

      </main>

    </div>
  );
}
