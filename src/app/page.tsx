"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RefreshCw, Settings2, Triangle, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DeploymentCard,
  DeploymentCardSkeleton,
} from "@/components/DeploymentCard";
import { usePin } from "@/components/PinContext";
import { decryptAndRetrieve, hasStoredKey } from "@/lib/storage";
import type { VercelDeploymentsResponse, VercelDeployment } from "@/lib/vercel";

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; deployments: VercelDeployment[]; lastFetched: Date }
  | { status: "error"; message: string };

export default function DashboardPage() {
  const { pin, hasPin } = usePin();
  const [state, setState] = useState<FetchState>({ status: "idle" });
  // ↓ Starts as false so SSR and the first client render always agree.
  //   The real value is read from localStorage only after mount.
  const [hasToken, setHasToken] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Populate hasToken + signal mount after hydration is complete
  useEffect(() => {
    setHasToken(hasStoredKey("vercel"));
    setIsMounted(true);
  }, []);

  const fetchDeployments = useCallback(async () => {
    if (!hasPin) {
      toast.warning("Introduce tu PIN de sesión en Configuración para descifrar tu token.");
      return;
    }

    const token = decryptAndRetrieve("vercel", pin);
    if (!token) {
      toast.error("No se pudo descifrar el token. ¿Ingresaste el PIN correcto?");
      return;
    }

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/proxy/vercel", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Error ${res.status}`);
      }

      const data: VercelDeploymentsResponse = await res.json();
      setState({
        status: "success",
        deployments: data.deployments ?? [],
        lastFetched: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setState({ status: "error", message });
      toast.error(message);
    }
  }, [pin, hasPin]);

  // Auto-fetch once we know the token exists and the PIN is in session
  useEffect(() => {
    if (isMounted && hasPin && hasToken && state.status === "idle") {
      fetchDeployments();
    }
  }, [isMounted, hasPin, hasToken, state.status, fetchDeployments]);

  const isLoading = state.status === "loading";

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
        <Button
          size="sm"
          variant="outline"
          onClick={fetchDeployments}
          disabled={isLoading || !hasPin || !hasToken}
          className="gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* ── Vercel section ────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          {/* Vercel triangle logo */}
          <span className="flex items-center justify-center w-7 h-7 rounded bg-foreground text-background">
            <Triangle className="w-3.5 h-3.5 fill-current" />
          </span>
          <h2 className="font-semibold">Vercel</h2>
          <Badge variant="outline" className="text-xs">5 últimos</Badge>

          {state.status === "success" && (
            <span className="ml-auto text-[11px] text-muted-foreground">
              Actualizado: {state.lastFetched.toLocaleTimeString("es-ES")}
            </span>
          )}
        </div>

        <Separator className="mb-5" />

        {/* Conditional states — only render after client mount to avoid hydration mismatch */}
        {isMounted && !hasToken && (
          <EmptyState
            title="Token de Vercel no configurado"
            description="Ve a Configuración, añade tu Vercel Access Token y vuelve aquí."
            action={
              <Link href="/settings" className={cn(buttonVariants({ size: "sm" }))}>
                <Settings2 className="w-3.5 h-3.5 mr-2" />
                Ir a Configuración
              </Link>
            }
          />
        )}

        {/* No PIN */}
        {isMounted && hasToken && !hasPin && (
          <EmptyState
            title="Sesión sin PIN activo"
            description="Introduce tu PIN de sesión en la página de Configuración para descifrar y cargar tus datos."
            action={
              <Link href="/settings" className={cn(buttonVariants({ size: "sm" }))}>
                <Settings2 className="w-3.5 h-3.5 mr-2" />
                Introducir PIN
              </Link>
            }
          />
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <DeploymentCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <EmptyState
            title="Error al cargar despliegues"
            description={state.message}
            icon={<AlertCircle className="w-8 h-8 text-destructive" />}
            action={
              <Button size="sm" onClick={fetchDeployments} type="button">
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Reintentar
              </Button>
            }
          />
        )}

        {/* Success — deployment grid */}
        {state.status === "success" && state.deployments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.deployments.map((d) => (
              <DeploymentCard key={d.uid} deployment={d} />
            ))}
          </div>
        )}

        {/* Success — no deployments */}
        {state.status === "success" && state.deployments.length === 0 && (
          <EmptyState
            title="Sin despliegues recientes"
            description="No se encontraron despliegues en tu cuenta de Vercel."
          />
        )}
      </section>
    </div>
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
