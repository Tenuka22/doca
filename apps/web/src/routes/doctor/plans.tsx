import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CREDIT_PRICE_USD } from "@zen-doc/pricing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zen-doc/ui/components/alert-dialog";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import { Textarea } from "@zen-doc/ui/components/textarea";
import { Check, Loader2, Pencil, PlusIcon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/plans")({
  component: DoctorPlansRoute,
});

interface DoctorPlan {
  credits: number;
  description: string | null;
  durationMinutes: number;
  features: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  sortOrder: number;
}

const defaultFeatures = [
  "One-on-one session",
  "Secure video consultation",
  "Session notes included",
];

function DoctorPlansRoute() {
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<DoctorPlan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("50");
  const [featuresText, setFeaturesText] = useState(defaultFeatures.join("\n"));

  const plansQuery = useQuery({
    queryKey: orpc.listDoctorPlans.queryKey(),
    queryFn: () => orpc.listDoctorPlans.call(),
  });

  const createPlan = useMutation(
    orpc.createDoctorPlan.mutationOptions({
      onSuccess: async () => {
        await plansQuery.refetch();
        toast.success("Plan created successfully");
        setShowCreate(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to create plan"
        );
      },
    })
  );

  const updatePlan = useMutation(
    orpc.updateDoctorPlan.mutationOptions({
      onSuccess: async () => {
        await plansQuery.refetch();
        toast.success("Plan updated");
        setEditTarget(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to update plan"
        );
      },
    })
  );

  const deletePlan = useMutation(
    orpc.deleteDoctorPlan.mutationOptions({
      onSuccess: async () => {
        await plansQuery.refetch();
        toast.success("Plan deleted");
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete plan"
        );
        setDeleteTarget(null);
      },
    })
  );

  const plans = (plansQuery.data?.plans ?? []) as DoctorPlan[];

  function resetForm() {
    setName("");
    setDescription("");
    setCredits("1");
    setDurationMinutes("50");
    setFeaturesText(defaultFeatures.join("\n"));
  }

  function handleCreate() {
    const features = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    createPlan.mutate({
      name,
      description: description || undefined,
      credits: Number(credits),
      durationMinutes: Number(durationMinutes),
      features,
    });
  }

  function handleEdit(plan: DoctorPlan) {
    setName(plan.name);
    setDescription(plan.description ?? "");
    setCredits(String(plan.credits));
    setDurationMinutes(String(plan.durationMinutes));
    const parsed: string[] = plan.features
      ? (JSON.parse(plan.features) as string[])
      : [];
    setFeaturesText(parsed.join("\n"));
    setEditTarget(plan);
  }

  function handleUpdate() {
    if (!editTarget) {
      return;
    }

    const features = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    updatePlan.mutate({
      id: editTarget.id,
      name,
      description: description || null,
      credits: Number(credits),
      durationMinutes: Number(durationMinutes),
      features: features.length > 0 ? features : null,
    });
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Session Plans
          </h1>
          <p className="text-muted-foreground text-sm">
            Define your session offerings. The default plan is required; you can
            create as many custom plans as you like.
          </p>
        </div>

        <Dialog onOpenChange={setShowCreate} open={showCreate}>
          <DialogTrigger>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Session Plan</DialogTitle>
              <DialogDescription>
                Each credit costs ${CREDIT_PRICE_USD}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Deep Session"
                  value={name}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plan-description">Description (optional)</Label>
                <Textarea
                  id="plan-description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this session includes..."
                  value={description}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan-credits">Credits</Label>
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        setCredits(value);
                      }
                    }}
                    value={credits}
                  >
                    <SelectTrigger id="plan-credits">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} credit{n > 1 ? "s" : ""} ($
                          {(n * CREDIT_PRICE_USD).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="plan-duration">Duration (minutes)</Label>
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        setDurationMinutes(value);
                      }
                    }}
                    value={durationMinutes}
                  >
                    <SelectTrigger id="plan-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[30, 50, 60, 90, 120].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plan-features">Features (one per line)</Label>
                <Textarea
                  id="plan-features"
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  value={featuresText}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowCreate(false)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={!name.trim() || createPlan.isPending}
                onClick={handleCreate}
              >
                {createPlan.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        open={!!editTarget}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update your session plan details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Plan name"
                value={name}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this plan..."
                value={description}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-credits">Credits</Label>
                <Select
                  onValueChange={(value) => {
                    if (value) {
                      setCredits(value);
                    }
                  }}
                  value={credits}
                >
                  <SelectTrigger id="edit-credits">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} credit{n > 1 ? "s" : ""} ($
                        {(n * CREDIT_PRICE_USD).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Select
                  onValueChange={(value) => {
                    if (value) {
                      setDurationMinutes(value);
                    }
                  }}
                  value={durationMinutes}
                >
                  <SelectTrigger id="edit-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 50, 60, 90, 120].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-features">Features (one per line)</Label>
              <Textarea
                id="edit-features"
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                value={featuresText}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setEditTarget(null)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || updatePlan.isPending}
              onClick={handleUpdate}
            >
              {updatePlan.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {plansQuery.isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
            <p className="text-muted-foreground text-sm">
              No plans yet. Create your first session plan to start offering
              bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const parsedFeatures: string[] = plan.features
              ? (JSON.parse(plan.features) as string[])
              : [];

            return (
              <Card
                className={`relative flex flex-col border-2 transition-shadow hover:shadow-lg ${
                  plan.isDefault
                    ? "border-primary/40 bg-primary/[0.02]"
                    : "border-border"
                }`}
                key={plan.id}
              >
                {plan.isDefault ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary px-4 text-primary-foreground text-xs">
                      Required
                    </Badge>
                  </div>
                ) : null}

                <CardHeader className="pb-4 text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.description ? (
                    <CardDescription>{plan.description}</CardDescription>
                  ) : null}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-6">
                  <div className="text-center">
                    <span className="font-bold text-4xl text-foreground">
                      {plan.credits}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      credit{plan.credits > 1 ? "s" : ""}
                    </span>
                    <div className="mt-1 text-muted-foreground text-xs">
                      ${(plan.credits * CREDIT_PRICE_USD).toFixed(2)}
                    </div>
                    <div className="mt-2">
                      <Badge className="bg-muted" variant="outline">
                        {plan.durationMinutes} min
                      </Badge>
                    </div>
                  </div>

                  {parsedFeatures.length > 0 ? (
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold text-foreground text-xs uppercase tracking-wide">
                        What's included
                      </p>
                      {parsedFeatures.map((feature) => (
                        <div className="flex items-start gap-2" key={feature}>
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span className="text-muted-foreground text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleEdit(plan)}
                      size="sm"
                      variant="outline"
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    {plan.isDefault ? null : (
                      <Button
                        className="shrink-0"
                        onClick={() => setDeleteTarget(plan.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-rose-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <DialogTrigger>
            <Card className="flex min-h-[320px] cursor-pointer items-center justify-center border-2 border-dashed transition-colors hover:border-primary/50 hover:bg-muted/20">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <PlusIcon className="h-8 w-8" />
                <span className="font-medium text-sm">Add another plan</span>
              </div>
            </Card>
          </DialogTrigger>
        </div>
      )}

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This plan will be deactivated. Existing bookings are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Keep Plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deletePlan.mutate({ id: deleteTarget });
                }
              }}
            >
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
