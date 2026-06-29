import { useNavigate } from "@tanstack/react-router";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/utils/auth";
import { Button } from "@suwa/ui/components/button";
import { Input } from "@suwa/ui/components/input";
import { Card, CardContent } from "@suwa/ui/components/card";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message ?? signUpError.statusText);
    } else {
      navigate({ to: "/onboarding" });
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link className="font-semibold text-lg tracking-tight" to="/">
            {APP_DISPLAY_NAME}
          </Link>
          <p className="text-muted-foreground text-sm">Create your account</p>
        </div>
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="p-6">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="name">
                  Name
                </label>
                <Input
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  type="text"
                  value={name}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </div>
              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link className="font-medium text-primary hover:underline" to="/sign-in">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
