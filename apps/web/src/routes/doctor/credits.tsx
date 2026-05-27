import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zen-doc/ui/components/dialog";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BanknoteIcon,
  CheckCircle2,
  Clock,
  DollarSignIcon,
  History,
  Info,
  Loader2,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/credits")({
  component: DoctorCreditsRoute,
});

function StatusBadge({ status }: { status: string }) {
  const styles =
    {
      completed:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10",
      failed:
        "border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/10",
      pending:
        "border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/10",
    }[status as "completed" | "failed"] ??
    "border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/10";

  return (
    <Badge
      className={`h-5 px-1.5 font-bold text-[10px] uppercase tracking-tight ${styles}`}
      variant="outline"
    >
      {status}
    </Badge>
  );
}

function StatusIcon({ status }: { status: string }) {
  const styles =
    {
      completed: "bg-emerald-500/10 text-emerald-600",
      failed: "bg-rose-500/10 text-rose-600",
      pending: "bg-amber-500/10 text-amber-600",
    }[status as "completed" | "failed"] ?? "bg-amber-500/10 text-amber-600";

  const Icon =
    {
      completed: ArrowUpCircle,
      failed: XCircle,
      pending: Clock,
    }[status as "completed" | "failed"] ?? Clock;

  return (
    <div
      className={`rounded-full p-2.5 shadow-sm transition-transform group-hover/item:scale-105 ${styles}`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function TransactionItem({
  req,
  formatCents,
}: {
  req: any;
  formatCents: (c: number) => string;
}) {
  return (
    <div className="group/item flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30 sm:px-0">
      <div className="flex items-center gap-4">
        <StatusIcon status={req.status} />
        <div className="space-y-0.5">
          <p className="font-bold text-sm">Payout Request</p>
          <p className="font-medium text-muted-foreground text-xs">
            {format(new Date(req.createdAt), "MMM d, yyyy · h:mm a")}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="font-bold text-sm tracking-tight">
          -{formatCents(req.amountCents)}
        </p>
        <StatusBadge status={req.status} />
      </div>
    </div>
  );
}

function DoctorCreditsRoute() {
  const [showCashout, setShowCashout] = useState(false);
  const [cashoutCents, setCashoutCents] = useState("");

  const creditsQuery = useQuery({
    queryKey: orpc.getDoctorCredits.queryKey(),
    queryFn: () => orpc.getDoctorCredits.call(),
  });

  const cashoutMutation = useMutation(
    orpc.requestCashout.mutationOptions({
      onSuccess: () => {
        toast.success("Cashout initiated successfully");
        setShowCashout(false);
        setCashoutCents("");
        creditsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Cashout failed");
      },
    })
  );

  const data = creditsQuery.data;
  const credits = data?.credits;
  const cashoutRequests = (data?.cashoutRequests ?? []) as Array<{
    amountCents: number;
    createdAt: string;
    id: string;
    status: string;
  }>;

  const balanceCents = credits?.balanceCents ?? 0;
  const totalEarnedCents = credits?.totalEarnedCents ?? 0;
  const totalCashedOutCents = credits?.totalCashedOutCents ?? 0;

  function formatCents(cents: number): string {
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function handleCashout() {
    const amount = Math.round(Number.parseFloat(cashoutCents) * 100);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > balanceCents) {
      toast.error("Insufficient balance");
      return;
    }
    cashoutMutation.mutate({ amountCents: amount });
  }

  const sortedHistory = [...cashoutRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Earnings & Payouts
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your revenue and withdraw funds to your account.
          </p>
        </div>

        <Dialog onOpenChange={setShowCashout} open={showCashout}>
          <DialogTrigger asChild>
            <Button
              className="mt-2 shadow-sm md:mt-0"
              disabled={balanceCents <= 0}
              size="lg"
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Transfer funds to your Stripe Connect account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/50 p-4">
                <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Available Balance
                </span>
                <span className="font-bold text-2xl text-foreground">
                  {formatCents(balanceCents)}
                </span>
              </div>
              <div className="grid gap-2">
                <Label className="font-semibold text-sm" htmlFor="amount">
                  Amount to Withdraw (USD)
                </Label>
                <div className="relative">
                  <span className="absolute top-2.5 left-3 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    className="pl-7"
                    id="amount"
                    max={balanceCents / 100}
                    min={1}
                    onChange={(e) => setCashoutCents(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    value={cashoutCents}
                  />
                </div>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Info className="h-3 w-3" />
                  Payouts are typically processed instantly to your connected
                  account.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button onClick={() => setShowCashout(false)} variant="ghost">
                Cancel
              </Button>
              <Button
                disabled={
                  cashoutMutation.isPending ||
                  !cashoutCents ||
                  Number.parseFloat(cashoutCents) <= 0
                }
                onClick={handleCashout}
              >
                {cashoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirm Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {creditsQuery.isPending ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border/60 border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="group relative overflow-hidden border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                <Wallet className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-3xl tracking-tight">
                  {formatCents(balanceCents)}
                </p>
                <div className="mt-4 flex items-center gap-1.5 font-medium text-[10px] text-emerald-600 dark:text-emerald-400">
                  <ArrowDownCircle className="h-3 w-3" />
                  Ready for payout
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                <DollarSignIcon className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Lifetime Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-3xl tracking-tight">
                  {formatCents(totalEarnedCents)}
                </p>
                <div className="mt-4 flex items-center gap-1.5 font-medium text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Total gross revenue
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                <BanknoteIcon className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Total Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-3xl tracking-tight">
                  {formatCents(totalCashedOutCents)}
                </p>
                <div className="mt-4 flex items-center gap-1.5 font-medium text-[10px] text-muted-foreground">
                  <ArrowUpCircle className="h-3 w-3" />
                  Withdrawn to Stripe
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="font-bold text-muted-foreground text-sm uppercase tracking-wider">
                  Transaction History
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {sortedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 rounded-full bg-muted p-3">
                    <History className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-muted-foreground text-sm">
                    No transactions found
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Your payout requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {sortedHistory.map((req) => (
                    <div
                      className="group/item flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30 sm:px-0"
                      key={req.id}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-full p-2.5 shadow-sm transition-transform group-hover/item:scale-105 ${
                            req.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : req.status === "failed"
                                ? "bg-rose-500/10 text-rose-600"
                                : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {req.status === "completed" ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : req.status === "failed" ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm">Payout Request</p>
                          <p className="font-medium text-muted-foreground text-xs">
                            {format(
                              new Date(req.createdAt),
                              "MMM d, yyyy · h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <p className="font-bold text-sm tracking-tight">
                          -{formatCents(req.amountCents)}
                        </p>
                        <Badge
                          className={`h-5 px-1.5 font-bold text-[10px] uppercase tracking-tight ${
                            req.status === "completed"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                              : req.status === "failed"
                                ? "border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/10"
                                : "border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
                          }`}
                          variant="outline"
                        >
                          {req.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
