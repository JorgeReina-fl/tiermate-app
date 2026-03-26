"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { VercelDeployment, DeploymentState } from "@/lib/vercel";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ExternalLink,
} from "lucide-react";

/* ── State badge ─────────────────────────────────────────────── */

const stateConfig: Record<
  DeploymentState,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  READY: {
    label: "Ready",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  BUILDING: {
    label: "Building",
    variant: "secondary",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  INITIALIZING: {
    label: "Initializing",
    variant: "secondary",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  QUEUED: {
    label: "Queued",
    variant: "outline",
    icon: <Clock className="w-3 h-3" />,
  },
  ERROR: {
    label: "Error",
    variant: "destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
  CANCELED: {
    label: "Canceled",
    variant: "outline",
    icon: <XCircle className="w-3 h-3" />,
  },
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Card component ──────────────────────────────────────────── */

export function DeploymentCard({ deployment }: { deployment: VercelDeployment }) {
  const state = deployment.state ?? "QUEUED";
  const cfg = stateConfig[state] ?? stateConfig.QUEUED;
  const branch = deployment.meta?.githubCommitRef ?? "–";
  const message = deployment.meta?.githubCommitMessage;

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{deployment.name}</p>
            {message && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                {message}
              </p>
            )}
          </div>
          <Badge variant={cfg.variant} className="flex items-center gap-1 shrink-0 text-xs">
            {cfg.icon}
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-0 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1">
          <span className="font-medium">Branch:</span>
          <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{branch}</code>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">URL:</span>
          <a
            href={`https://${deployment.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline truncate max-w-[200px] font-mono"
          >
            {deployment.url}
          </a>
        </div>
      </CardContent>

      <CardFooter className="mt-auto pt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(deployment.createdAt)}
        </span>
        {deployment.inspectorUrl && (
          <a
            href={deployment.inspectorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Detalles <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </CardFooter>
    </Card>
  );
}

/* ── Loading skeleton ────────────────────────────────────────── */

export function DeploymentCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="py-0 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
      <CardFooter className="mt-auto pt-3">
        <Skeleton className="h-3 w-1/4" />
      </CardFooter>
    </Card>
  );
}
