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
import { Textarea } from "@zen-doc/ui/components/textarea";
import {
  Check,
  CheckCircle2,
  Clock,
  Coins,
  LayoutGrid,
  Loader2,
  Pencil,
  PlusIcon,
  Sparkles,
  Trash2,
} from "lucide-react";
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

function FeatureInput({
  features,
  onChange,
}: {
  features: string[];
  onChange: (features: string[]) => void;
}) {
  const addFeature = () => onChange([...features, ""]);
  const removeFeature = (index: number) =>
    onChange(features.filter((_, i) => i !== index));
  const updateFeature = (index: number, value: string) => {
    const next = [...features];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Features
        </Label>
        <Button
          onClick={addFeature}
          size="sm"
          type="button"
          variant="ghost"
          className="h-7 text-[10px]"
        >
          <PlusIcon className="mr-1 h-3 w-3" />
          Add Feature
        </Button>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
        {features.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-xs italic border border-dashed rounded-lg">
            No features added yet
          </p>
        ) : (
          features.map((feature, index) => (
            <div className="flex items-center gap-2 group" key={index}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 border border-primary/10 transition-colors group-hover:bg-primary/10">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <Input
                className="h-8 text-sm"
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder={`Feature ${index + 1}`}
                value={feature}
              />
              <Button
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
  const [credits, setCredits] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("60");
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
        toast.error(error instanceof Error ? error.message : "Failed to create plan");
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
        toast.error(error instanceof Error ? error.message : "Failed to update plan");
      },
    })
  );

  const plans = (plansQuery.data?.plans ?? []) as DoctorPlan[];

  const resetForm = () => {
    setName("");
    setDescription("");
    setCredits("1");
    setDurationMinutes("60");
    setFeatures(defaultFeatures);
  };

  const isValid = () => {
    const dur = Number(durationMinutes);
    const creditsNum = Number(credits);
    return (
      name.trim().length > 0 &&
      creditsNum >= 1 &&
      dur >= 15 &&
      dur <= 240 &&
      features.filter(Boolean).length > 0
    );
  };

  const handleCreate = () => {
    if (!isValid()) return;
    createPlan.mutate({
      name,
      description: description || undefined,
      creditCost: Number(credits),
      durationMinutes: Number(durationMinutes),
      features: features.filter(Boolean),
    });
  };

  const handleEdit = (plan: DoctorPlan) => {
    setName(plan.name);
    setDescription(plan.description ?? "");
    setCredits(String(plan.creditCost));
    setDurationMinutes(String(plan.durationMinutes));
    try {
      setFeatures(plan.features ? (JSON.parse(plan.features) as string[]) : []);
    } catch {
      setFeatures([]);
    }
    setEditTarget(plan);
  };

  const handleUpdate = () => {
    if (!(editTarget && isValid())) return;
    updatePlan.mutate({
      id: editTarget.id,
      name,
      description: description || null,
      creditCost: Number(credits),
      durationMinutes: Number(durationMinutes),
      features: features.filter(Boolean),
    });
  };

  const activePlans = plans.filter((p) => p.isActive).length;
  const defaultPlan = plans.find((p) => p.isDefault);

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Session Plans
          </h1>
          <p className="text-muted-foreground text-sm">
            Craft tailored consultation experiences for your patients.
          </p>
        </div>

        <Dialog onOpenChange={(o) => { if (o) resetForm(); setShowCreate(o); }} open={showCreate}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Session Plan</DialogTitle>
              <DialogDescription>
                Define a new type of session patients can book.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Plan Name
                </Label>
                <Input
                  id="plan-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Intensive Therapy Session"
                  value={name}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan-credits" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Credit Cost
                  </Label>
                  <Input
                    id="plan-credits"
                    min={1}
                    onChange={(e) => setCredits(e.target.value.replace(/\D/g, ""))}
                    type="number"
                    value={credits}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan-duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Duration (min)
                  </Label>
                  <Input
                    id="plan-duration"
                    max={240}
                    min={15}
                    onChange={(e) => setDurationMinutes(e.target.value.replace(/\D/g, ""))}
                    type="number"
                    value={durationMinutes}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  className="resize-none"
                  id="plan-description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this session covers..."
                  rows={3}
                  value={description}
                />
              </div>
              <FeatureInput features={features} onChange={setFeatures} />
            </div>
            <DialogFooter>
              <Button onClick={() => setShowCreate(false)} variant="ghost">
                Cancel
              </Button>
              <Button
                disabled={!isValid() || createPlan.isPending}
                onClick={handleCreate}
              >
                {createPlan.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest">
              Total Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{plans.length}</div>
              <LayoutGrid className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest">
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activePlans}</div>
              <Sparkles className="h-4 w-4 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest">
              Default Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold truncate max-w-[150px]">{defaultPlan?.name ?? "None"}</div>
              <Badge variant="outline" className="text-[9px] font-bold h-4">STABLE</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        onOpenChange={(o) => { if (!o) setEditTarget(null); }}
        open={!!editTarget}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Session Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Plan Name
              </Label>
              <Input
                id="edit-name"
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-credits" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Credit Cost
                </Label>
                <Input
                  id="edit-credits"
                  onChange={(e) => setCredits(e.target.value.replace(/\D/g, ""))}
                  type="number"
                  value={credits}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Duration (min)
                </Label>
                <Input
                  id="edit-duration"
                  onChange={(e) => setDurationMinutes(e.target.value.replace(/\D/g, ""))}
                  type="number"
                  value={durationMinutes}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </Label>
              <Textarea
                className="resize-none"
                id="edit-description"
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                value={description}
              />
            </div>
            <FeatureInput features={features} onChange={setFeatures} />
          </div>
          <DialogFooter>
            <Button onClick={() => setEditTarget(null)} variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={!isValid() || updatePlan.isPending}
              onClick={handleUpdate}
            >
              {updatePlan.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {plansQuery.isPending ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-muted p-4">
              <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg">No session plans yet</p>
              <p className="text-muted-foreground text-sm max-w-[300px]">
                Create your first plan to start offering consultation sessions to patients.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} variant="outline" size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Get Started
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            let parsedFeatures: string[] = [];
            try {
              parsedFeatures = plan.features ? (JSON.parse(plan.features) as string[]) : [];
            } catch {
              parsedFeatures = [];
            }

            return (
              <Card
                className={`group relative flex flex-col overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                  plan.isDefault
                    ? "border-primary/40 bg-primary/[0.02]"
                    : "border-border/60"
                }`}
                key={plan.id}
              >
                {plan.isDefault && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary px-3 py-1 rounded-bl-xl shadow-sm">
                      <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest">
                        Default
                      </span>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                      {plan.name}
                    </CardTitle>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-6">
                  <div className="flex items-end gap-3 rounded-xl bg-muted/40 p-4 border border-border/40">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter block">
                        Cost
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-5 w-5 text-amber-500" />
                        <span className="text-3xl font-black tracking-tight">
                          {plan.creditCost}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground lowercase">
                          {plan.creditCost === 1 ? "credit" : "credits"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter block">
                        Duration
                      </span>
                      <Badge variant="outline" className="flex items-center gap-1 font-bold h-7 px-3 bg-background shadow-sm border-border/80">
                        <Clock className="h-3 w-3" />
                        {plan.durationMinutes}m
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border/60" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        What's Included
                      </span>
                      <div className="h-px flex-1 bg-border/60" />
                    </div>
                    
                    <div className="space-y-2.5">
                      {parsedFeatures.slice(0, 4).map((feature, idx) => (
                        <div className="flex items-start gap-2.5 group/feat" key={`${feature}-${idx}`}>
                          <div className="mt-0.5 rounded-full bg-emerald-500/10 p-0.5">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="text-xs text-muted-foreground leading-snug group-hover/feat:text-foreground transition-colors">
                            {feature}
                          </span>
                        </div>
                      ))}
                      {parsedFeatures.length > 4 && (
                        <p className="text-[10px] text-muted-foreground font-medium pl-6">
                          + {parsedFeatures.length - 4} more features
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      className="w-full shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                      onClick={() => handleEdit(plan)}
                      size="sm"
                      variant="outline"
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                      Manage Plan
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
