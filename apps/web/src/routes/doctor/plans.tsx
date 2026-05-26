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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zen-doc/ui/components/dialog";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import { Textarea } from "@zen-doc/ui/components/textarea";
import { Check, Loader2, Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/plans")({
  component: DoctorPlansRoute,
});

interface DoctorPlan {
  description: string | null;
  durationMinutes: number;
  features: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  creditCost: number;
  sortOrder: number;
}

const defaultFeatures = [
  "One-on-one session",
  "Secure video consultation",
  "Session notes included",
];

function formatCreditCost(credits: number): string {
  return `${credits} ${credits === 1 ? "credit" : "credits"}`;
}

function CreditInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Credits</Label>
      <Input
        id={id}
        min={1}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          onChange(raw);
        }}
        placeholder="1"
        type="number"
        value={value}
      />
      <p className="text-muted-foreground text-xs">
        Number of credits required for this session.
      </p>
    </div>
  );
}

function DurationInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const num = Number(value);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Duration (minutes)</Label>
      <Input
        id={id}
        max={360}
        min={60}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          onChange(raw);
        }}
        placeholder="60"
        type="text"
        value={value}
      />
      {num >= 60 && num <= 360 ? null : (
        <p className="text-destructive text-xs">Must be between 60 and 360</p>
      )}
    </div>
  );
}

function FeatureInput({
  features,
  onChange,
}: {
  features: string[];
  onChange: (features: string[]) => void;
}) {
  function addFeature() {
    onChange([...features, ""]);
  }

  function removeFeature(index: number) {
    onChange(features.filter((_, i) => i !== index));
  }

  function updateFeature(index: number, value: string) {
    const next = [...features];
    next[index] = value;
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>Features</Label>
        <Button onClick={addFeature} size="sm" type="button" variant="outline">
          <PlusIcon className="mr-1 h-3 w-3" />
          Add feature
        </Button>
      </div>
      <div className="space-y-2">
        {features.length === 0 ? (
          <p className="py-1 text-muted-foreground text-xs">
            No features added yet
          </p>
        ) : (
          features.map((feature, index) => (
            <div className="flex items-center gap-2" key={index}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <Input
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder={`Feature ${index + 1}`}
                value={feature}
              />
              <Button
                className="shrink-0"
                onClick={() => removeFeature(index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DoctorPlansRoute() {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<DoctorPlan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [features, setFeatures] = useState<string[]>(defaultFeatures);

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

  const plans = (plansQuery.data?.plans ?? []) as DoctorPlan[];

  function resetForm() {
    setName("");
    setDescription("");
    setCredits("1");
    setDurationMinutes("60");
    setFeatures(defaultFeatures);
  }

  function isValid(): boolean {
    const dur = Number(durationMinutes);
    const creditsNum = Number(credits);
    const validFeatures = features.filter(Boolean).length > 0;
    return (
      name.trim().length > 0 &&
      creditsNum >= 1 &&
      dur >= 15 &&
      dur <= 240 &&
      validFeatures
    );
  }

  function handleCreate() {
    if (!isValid()) {
      return;
    }

    createPlan.mutate({
      name,
      description: description || undefined,
      creditCost: Number(credits),
      durationMinutes: Number(durationMinutes),
      features: features.filter(Boolean),
    });
  }

  function handleEdit(plan: DoctorPlan) {
    setName(plan.name);
    setDescription(plan.description ?? "");
    setCredits(String(plan.creditCost));
    setDurationMinutes(String(plan.durationMinutes));
    setFeatures(plan.features ? (JSON.parse(plan.features) as string[]) : []);
    setEditTarget(plan);
  }

  function handleUpdate() {
    if (!(editTarget && isValid())) {
      return;
    }

    updatePlan.mutate({
      id: editTarget.id,
      name,
      description: description || null,
      creditCost: Number(credits),
      durationMinutes: Number(durationMinutes),
      features: features.filter(Boolean),
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
            Define your session offerings and credit costs.
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
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Session"
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

                <CreditInput id="plan-credits" onChange={setCredits} value={credits} />

  <DurationInput
    id="plan-duration"
    onChange={setDurationMinutes}
    value={durationMinutes}
  />

              <FeatureInput features={features} onChange={setFeatures} />
            </div>

            <DialogFooter>
              <Button onClick={() => setShowCreate(false)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={!isValid() || createPlan.isPending}
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

              <CreditInput id="edit-credits" onChange={setCredits} value={credits} />

            <DurationInput
              id="edit-duration"
              onChange={setDurationMinutes}
              value={durationMinutes}
            />

            <FeatureInput features={features} onChange={setFeatures} />
          </div>

          <DialogFooter>
            <Button onClick={() => setEditTarget(null)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!isValid() || updatePlan.isPending}
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
            <p className="text-muted-foreground text-sm">No plans yet.</p>
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
                      Default
                    </Badge>
                  </div>
                ) : null}

                <CardHeader className="pb-4 text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-6">
                  <div className="text-center">
                    <span className="font-bold text-4xl text-foreground">
                      {formatCreditCost(plan.creditCost)}
                    </span>
                    <div className="mt-2">
                      <Badge className="bg-muted" variant="outline">
                        {plan.durationMinutes} min
                      </Badge>
                    </div>
                  </div>

                  {parsedFeatures.length > 0 ? (
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold text-foreground text-xs uppercase tracking-wide">
                        Included
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
