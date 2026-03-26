"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RefreshCw, Settings2, Triangle, AlertCircle, LayoutGrid, List } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DeploymentCard,
  DeploymentCardSkeleton,
  DeploymentListItem,
  DeploymentListItemSkeleton,
} from "@/components/DeploymentCard";
import { PinModal } from "@/components/PinModal";
import { usePin } from "@/components/PinContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decryptAndRetrieve, hasStoredKey } from "@/lib/storage";
import type { VercelDeploymentsResponse, VercelDeployment, DeploymentState } from "@/lib/vercel";
import type { RailwayDeployment, RailwayProxyResponse } from "@/lib/railway";

type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T[]; lastFetched: Date }
  | { status: "error"; message: string };

/* ── Railway Status Adapter ─────────────────────────────────── */

function mapRailwayStatus(status: string): DeploymentState {
  switch (status) {
    case "SUCCESS":
      return "READY";
    case "FAILED":
    case "CRASHED":
    case "REMOVED":
      return "ERROR";
    case "INITIALIZING":
    case "BUILDING":
    case "DEPLOYING":
      return "BUILDING";
    default:
      return "QUEUED";
  }
}

function adaptRailwayDeployment(rd: RailwayDeployment): VercelDeployment {
  return {
    uid: rd.id,
    name: rd.projectName,
    url: "railway.app", // Fallback since GQL v2 might not return the public URL easily
    state: mapRailwayStatus(rd.status),
    createdAt: new Date(rd.createdAt).getTime(),
    meta: {
      githubCommitRef: rd.environmentName, // Env name as branch
    }
  };
}

export default function DashboardPage() {
  const { pin, hasPin, vercelToken, railwayToken, refreshTokens } = usePin();
  const [vercelState, setVercelState] = useState<FetchState<VercelDeployment>>({ status: "idle" });
  const [railwayState, setRailwayState] = useState<FetchState<VercelDeployment>>({ status: "idle" });
  
  const [hasVercel, setHasVercel] = useState(false);
  const [hasRailway, setHasRailway] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Populate token existance + signal mount after hydration
  useEffect(() => {
    setHasVercel(hasStoredKey("vercel"));
    setHasRailway(hasStoredKey("railway"));
    setIsMounted(true);
  }, []);

  const fetchVercel = useCallback(async (token: string) => {
    setVercelState({ status: "loading" });
    try {
      const res = await fetch("/api/proxy/vercel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Vercel error ${res.status}`);
      const data: VercelDeploymentsResponse = await res.json();
      setVercelState({
        status: "success",
        data: data.deployments ?? [],
        lastFetched: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error Vercel";
      setVercelState({ status: "error", message });
    }
  }, []);

  const fetchRailway = useCallback(async (token: string) => {
    setRailwayState({ status: "loading" });
    try {
      const res = await fetch("/api/railway", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Railway error ${res.status}`);
      const data: RailwayProxyResponse = await res.json();
      setRailwayState({
        status: "success",
        data: data.deployments.map(adaptRailwayDeployment),
        lastFetched: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error Railway";
      setRailwayState({ status: "error", message });
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (!hasPin) {
      toast.warning("Introduce tu PIN de sesión para descifrar tus tokens.");
      return;
    }

    const vToken = decryptAndRetrieve("vercel", pin);
    const rToken = decryptAndRetrieve("railway", pin);

    if (!vToken && !rToken) {
      toast.error("No se pudo descifrar ningún token. ¿PIN correcto?");
      return;
    }

    const promises = [];
    if (vToken) promises.push(fetchVercel(vToken));
    if (rToken) promises.push(fetchRailway(rToken));

    await Promise.all(promises);
  }, [pin, hasPin, fetchVercel, fetchRailway]);

  // Auto-fetch
  useEffect(() => {
    if (isMounted && hasPin && (hasVercel || hasRailway) && vercelState.status === "idle" && railwayState.status === "idle") {
      fetchAll();
    }
  }, [isMounted, hasPin, hasVercel, hasRailway, vercelState.status, railwayState.status, fetchAll]);

  const isLoading = vercelState.status === "loading" || railwayState.status === "loading";
  const hasSomeToken = hasVercel || hasRailway;

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      {/* ── Page header ───────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Panel de TierMate</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Últimos despliegues de tus servicios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
            <TabsList className="h-9">
              <TabsTrigger value="grid" className="px-2" title="Vista de tarjetas">
                <LayoutGrid className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2" title="Vista de lista">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchAll}
            disabled={isLoading || !hasPin || !hasSomeToken}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── Vercel section ────────────────────────────── */}
      <ServiceSection
        title="Vercel"
        icon={<Triangle className="w-3.5 h-3.5 fill-current" />}
        state={vercelState}
        hasToken={hasVercel}
        hasPin={hasPin}
        viewMode={viewMode}
        onRetry={fetchAll}
        isMounted={isMounted}
      />

      {/* ── Railway section ───────────────────────────── */}
      {hasRailway && (
        <div className="mt-12">
          <ServiceSection
            title="Railway Services"
            icon={<div className="w-3.5 h-3.5 bg-primary rounded-full" />}
            state={railwayState}
            hasToken={hasRailway}
            hasPin={hasPin}
            viewMode={viewMode}
            onRetry={fetchAll}
            isMounted={isMounted}
          />
        </div>
      )}

      {/* Manual Pin Modal if tokens exist but no PIN */}
      {isMounted && hasSomeToken && !hasPin && (
        <PinModal open={true} />
      )}
    </div>
  );
}

/* ── Service Section ────────────────────────────────────── */

function ServiceSection({
  title,
  icon,
  state,
  hasToken,
  hasPin,
  viewMode,
  onRetry,
  isMounted,
}: {
  title: string;
  icon: React.ReactNode;
  state: FetchState<VercelDeployment>;
  hasToken: boolean;
  hasPin: boolean;
  viewMode: "grid" | "list";
  onRetry: () => void;
  isMounted: boolean;
}) {
  const isLoading = state.status === "loading";

  if (!isMounted) return null;
  if (!hasToken) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-7 h-7 rounded bg-foreground text-background">
          {icon}
        </span>
        <h2 className="font-semibold">{title}</h2>
        <Badge variant="outline" className="text-xs">Últimos</Badge>

        {state.status === "success" && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            Actualizado: {state.lastFetched.toLocaleTimeString("es-ES")}
          </span>
        )}
      </div>

      <Separator className="mb-5" />

      {/* Loading skeletons */}
      {isLoading && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <DeploymentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <DeploymentListItemSkeleton key={i} />
            ))}
          </div>
        )
      )}

      {/* Error */}
      {state.status === "error" && (
        <EmptyState
          title={`Error en ${title}`}
          description={state.message}
          icon={<AlertCircle className="w-8 h-8 text-destructive" />}
          action={
            <Button size="sm" onClick={onRetry} type="button">
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Reintentar
            </Button>
          }
        />
      )}

      {/* Success — list */}
      {state.status === "success" && state.data.length > 0 && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.data.map((d) => (
              <DeploymentCard key={d.uid} deployment={d} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {state.data.map((d) => (
              <DeploymentListItem key={d.uid} deployment={d} />
            ))}
          </div>
        )
      )}

      {/* Success — empty */}
      {state.status === "success" && state.data.length === 0 && (
        <EmptyState
          title="Sin despliegues"
          description={`No se encontraron despliegues en tu cuenta de ${title}.`}
        />
      )}
    </section>
  );
}

/* ── Empty state helper ──────────────────────────────────── */

function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border p-12 text-center">
      {icon ?? <Settings2 className="w-8 h-8 text-muted-foreground" />}
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{description}</p>
      </div>
      {action}
    </div>
  );
}
