"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Settings2, Triangle, AlertCircle, LayoutGrid, List, Shield, ServerOff, Database, Key, Search, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DeploymentCard,
  DeploymentCardSkeleton,
  DeploymentListItem,
  DeploymentListItemSkeleton,
} from "@/components/DeploymentCard";
import { PinModal } from "@/components/PinModal";
import { usePin } from "@/components/PinContext";
import { useDeployments } from "@/components/DeploymentsContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VercelDeployment } from "@/lib/vercel";
import { WelcomeTour } from "@/components/WelcomeTour";
import Link from "next/link";
import { Kbd } from "@/components/ui/kbd";

export default function DashboardPage() {
  const { hasPin } = usePin();
  const { 
    vercelItems, 
    railwayItems, 
    renderItems,
    isLoadingVercel, 
    isLoadingRailway, 
    isLoadingRender,
    hasVercel, 
    hasRailway, 
    hasRender,
    refresh 
  } = useDeployments();

  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const hasAnyService = hasVercel || hasRailway || hasRender;

  return (
    <div className="relative flex-1 flex flex-col min-h-screen">
      <WelcomeTour />
      
      <div className="flex-1 p-6 relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Panel de TierMate
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Últimos despliegues de tus servicios
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ── Search Trigger ── */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
              className="flex items-center gap-2 px-3 h-9 bg-[#16191F] hover:bg-[#1c1f26] border border-border/50 rounded-[0.3rem] text-sm text-foreground/50 transition-colors shrink-0 group"
            >
              <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground/70 transition-colors" />
              <span className="hidden sm:inline-block">Buscar...</span>
              <Kbd className="hidden sm:inline-flex ml-2 sm:ml-4" />
            </button>

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
              variant="outline"
              size="icon"
              className="h-9 w-9 border-border/50"
              onClick={refresh}
              title="Actualizar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Empty State ── */}
        {!hasAnyService && (
          <div className="relative flex-1 flex items-center justify-center min-h-[60vh] overflow-hidden">
            <div className="relative z-10 w-full flex justify-center px-4">
              <ZeroKnowledgeManifesto />
            </div>
          </div>
        )}

        <div className="space-y-12">
          {/* ── Vercel Section ── */}
          {hasVercel && (
            <ServiceSection
              title="Vercel"
              icon={<Triangle className="w-4 h-4 fill-current" />}
              items={vercelItems}
              isLoading={isLoadingVercel}
              viewMode={viewMode}
            />
          )}

          {/* ── Railway Section ── */}
          {hasRailway && (
            <ServiceSection
              title="Railway"
              icon={<span className="text-lg font-bold">⬡</span>}
              items={railwayItems}
              isLoading={isLoadingRailway}
              viewMode={viewMode}
            />
          )}

          {/* ── Render Section ── */}
          {hasRender && (
            <ServiceSection
              title="Render"
              icon={<Box className="w-4 h-4 text-[#46E3B7]" />}
              items={renderItems}
              isLoading={isLoadingRender}
              viewMode={viewMode}
            />
          )}
        </div>

        {/* ── Pin Security Overlay ── */}
        {!hasPin && (
          <PinModal open={true} />
        )}
      </div>
    </div>
  );
}

/* ── Service Section ────────────────────────────────────── */

function ServiceSection({
  title,
  icon,
  items,
  isLoading,
  viewMode,
}: {
  title: string;
  icon: React.ReactNode;
  items: VercelDeployment[];
  isLoading: boolean;
  viewMode: "grid" | "list";
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-7 h-7 rounded bg-foreground text-background">
          {icon}
        </span>
        <h2 className="font-semibold">{title}</h2>
        <Badge variant="outline" className="text-xs">Últimos</Badge>

        {items.length > 0 && !isLoading && (
          <span className="ml-auto text-[11px] text-muted-foreground font-mono">
            {items.length} activos
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

      {/* Success — list */}
      {!isLoading && items.length > 0 && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((d) => (
              <DeploymentCard key={d.uid} deployment={d} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((d) => (
              <DeploymentListItem key={d.uid} deployment={d} />
            ))}
          </div>
        )
      )}

      {/* Success — empty */}
      {!isLoading && items.length === 0 && (
        <EmptyState
          title="Sin despliegues"
          description={`No se encontraron despliegues en tu cuenta de ${title}.`}
        />
      )}
    </section>
  );
}

/* ── Zero Knowledge Manifesto ──────────────────────────────── */

function ZeroKnowledgeManifesto() {
  return (
    <div className="w-full max-w-3xl bg-[#16191F]/90 backdrop-blur-md border border-border/50 rounded-xl p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4 ring-1 ring-primary/20">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Tu privacidad es absoluta (Zero-Knowledge)
        </h2>
      </div>

      <ul className="space-y-6 text-foreground/80 text-base font-mono">
        <li className="flex gap-4 items-start">
          <ServerOff className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Tus tokens nunca tocan los servidores de TierMate;</strong> se cifran con AES y se guardan exclusivamente en el almacenamiento local de tu navegador.
          </p>
        </li>
        <li className="flex gap-4 items-start">
          <Database className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Sin bases de datos centralizadas, <strong>es imposible que nosotros recuperemos tu cuenta</strong> si olvidas tu PIN o borras la caché.
          </p>
        </li>
        <li className="flex gap-4 items-start">
          <Key className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Utiliza un <strong>PIN de sesión fuerte</strong>. El cifrado es local, la seguridad depende de la complejidad de tu PIN.
          </p>
        </li>
      </ul>

      <hr className="w-full border-border/50 my-8" />

      <div className="flex justify-center">
        <Link href="/settings" passHref legacyBehavior>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 text-sm font-medium shadow-lg shadow-primary/20">
            ⚙️ Ir a Configuración
          </Button>
        </Link>
      </div>
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
