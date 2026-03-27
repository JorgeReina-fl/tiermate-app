"use client";

/**
 * DeploymentsContext — Shared deployment data for the entire app.
 *
 * Lives above both page.tsx and AppShell so CommandMenu can
 * read the same data as the dashboard without prop-drilling.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePin } from "@/components/PinContext";
import { hasStoredKey, decryptAndRetrieve } from "@/lib/storage";
import type { VercelDeployment, VercelDeploymentsResponse } from "@/lib/vercel";
import type { RailwayDeployment, RailwayProxyResponse } from "@/lib/railway";

/* ── Status adapter ───────────────────────────────────────────── */

import type { DeploymentState } from "@/lib/vercel";

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
    url: "railway.app",
    state: mapRailwayStatus(rd.status),
    createdAt: new Date(rd.createdAt).getTime(),
    meta: { githubCommitRef: rd.environmentName },
  };
}

/* ── Context shape ────────────────────────────────────────────── */

interface DeploymentsContextValue {
  vercelItems: VercelDeployment[];
  railwayItems: VercelDeployment[];
  isLoadingVercel: boolean;
  isLoadingRailway: boolean;
  hasVercel: boolean;
  hasRailway: boolean;
  refresh: () => void;
}

const DeploymentsContext = createContext<DeploymentsContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────── */

export function DeploymentsProvider({ children }: { children: React.ReactNode }) {
  const { pin, hasPin } = usePin();

  const [vercelItems, setVercelItems] = useState<VercelDeployment[]>([]);
  const [railwayItems, setRailwayItems] = useState<VercelDeployment[]>([]);
  const [isLoadingVercel, setIsLoadingVercel] = useState(false);
  const [isLoadingRailway, setIsLoadingRailway] = useState(false);
  const [hasVercel, setHasVercel] = useState(false);
  const [hasRailway, setHasRailway] = useState(false);

  // Detect stored keys once on mount
  useEffect(() => {
    setHasVercel(hasStoredKey("vercel"));
    setHasRailway(hasStoredKey("railway"));
  }, []);

  const fetchVercel = useCallback(async (token: string) => {
    setIsLoadingVercel(true);
    try {
      const res = await fetch("/api/proxy/vercel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Vercel ${res.status}`);
      const data: VercelDeploymentsResponse = await res.json();
      setVercelItems(data.deployments ?? []);
    } catch {
      // silent — dashboard has its own error toasts
    } finally {
      setIsLoadingVercel(false);
    }
  }, []);

  const fetchRailway = useCallback(async (token: string) => {
    setIsLoadingRailway(true);
    try {
      const res = await fetch("/api/railway", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Railway ${res.status}`);
      const data: RailwayProxyResponse = await res.json();
      setRailwayItems(data.deployments.map(adaptRailwayDeployment));
    } catch {
      // silent
    } finally {
      setIsLoadingRailway(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (!hasPin) return;
    const vToken = decryptAndRetrieve("vercel", pin);
    const rToken = decryptAndRetrieve("railway", pin);
    if (vToken) fetchVercel(vToken);
    if (rToken) fetchRailway(rToken);
  }, [hasPin, pin, fetchVercel, fetchRailway]);

  // Clear data when session is locked
  useEffect(() => {
    if (!hasPin) {
      setVercelItems([]);
      setRailwayItems([]);
    }
  }, [hasPin]);

  // Auto-fetch when session unlocks
  useEffect(() => {
    if (hasPin) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPin]);

  return (
    <DeploymentsContext.Provider
      value={{
        vercelItems,
        railwayItems,
        isLoadingVercel,
        isLoadingRailway,
        hasVercel,
        hasRailway,
        refresh,
      }}
    >
      {children}
    </DeploymentsContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────── */

export function useDeployments(): DeploymentsContextValue {
  const ctx = useContext(DeploymentsContext);
  if (!ctx) throw new Error("useDeployments must be used inside <DeploymentsProvider>");
  return ctx;
}
