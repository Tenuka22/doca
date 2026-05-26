import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import { BanknoteIcon, DollarSignIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/credits")({
  component: DoctorCreditsRoute,
});

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
    return `$${(cents / 100).toFixed(2)}`;
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

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Credits & Earnings
        </h1>
        <p className="text-muted-foreground text-sm">
          Track your earnings and cash out your balance.
        </p>
      </div>

      {creditsQuery.isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
                  <DollarSignIcon className="h-4 w-4" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-3xl">
                  {formatCents(balanceCents)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
                  <BanknoteIcon className="h-4 w-4" />
                  Total Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-3xl">
                  {formatCents(totalEarnedCents)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
                  <BanknoteIcon className="h-4 w-4" />
                  Cashed Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-3xl">
                  {formatCents(totalCashedOutCents)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Dialog onOpenChange={setShowCashout} open={showCashout}>
            <DialogTrigger>
              <Button disabled={balanceCents <= 0}>Cash Out Now</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cash Out</DialogTitle>
                <DialogDescription>
                  Withdraw your earnings to your Stripe Connect account.
                  Available balance: {formatCents(balanceCents)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    max={balanceCents / 100}
                    min={1}
                    onChange={(e) => setCashoutCents(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    value={cashoutCents}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowCashout(false)} variant="outline">
                  Cancel
                </Button>
                <Button
                  disabled={cashoutMutation.isPending}
                  onClick={handleCashout}
                >
                  {cashoutMutation.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirm Cashout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {cashoutRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cashout History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cashoutRequests.map((req) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={req.id}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {formatCents(req.amountCents)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(req.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${
                          req.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : req.status === "failed"
                              ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
