import { Badge } from "@zen-doc/ui/components/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { TrendingUpIcon } from "lucide-react";
import type { ReactNode } from "react";

import { gridMetricCards, metricCard, metricIconBox } from "@/lib/styles";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 rounded-3xl" />

      <div className={gridMetricCards}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-36 rounded-2xl" key={index.toString()} />
        ))}
      </div>

      <Skeleton className="h-[400px] rounded-3xl" />
    </div>
  );
}

export function MetricCard({
  description,
  icon,
  title,
  trend,
  value,
}: {
  description: string;
  icon: ReactNode;
  title: string;
  trend?: string;
  value: string;
}) {
  return (
    <Card className={metricCard}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-4xl tracking-tight">{value}</CardTitle>
          </div>

          <div className={metricIconBox}>{icon}</div>
        </div>
      </CardHeader>

      <CardFooter className="mt-auto flex items-center justify-between text-muted-foreground text-sm">
        <span>{description}</span>

        {trend ? (
          <Badge className="gap-1" variant="secondary">
            <TrendingUpIcon className="size-3" />
            {trend}
          </Badge>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export function SectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {action}
    </div>
  );
}
