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
import type { VercelDeployment, VercelDeploymentsResponse, DeploymentState } from "@/lib/vercel";
import type { RailwayDeployment, RailwayProxyResponse } from "@/lib/railway";

/* ── Render types ─────────────────────────────────────────────── */

interface RenderService {
  id: string;
  name: string;
  type: string;
  repo?: string;
  branch?: string;
  state: string;
  suspended?: string;
  createdAt?: string;
  updatedAt: string;
  serviceDetails?: {
    url?: string;
    parentServerId?: string;
  };
}

interface RenderResponse {
  service: RenderService;
  cursor: string;
}

/* ── Supabase types ───────────────────────────────────────────── */

interface SupabaseProject {
  id: string;
  name: string;
  region: string;
  status: string;
  created_at: string;
  organization_id: string;
}

/* ── Status adapters ──────────────────────────────────────────── */

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

function mapRenderStatus(status: string | undefined, suspended: string | undefined): DeploymentState {
  if (suspended === "suspended") return "ERROR";
  if (!status) return "READY";
  switch (status.toLowerCase()) {
    case "live":
      return "READY";
    case "deactivated":
    case "suspended":
      return "ERROR";
    case "build_in_progress":
    case "update_in_progress":
      return "BUILDING";
    case "created":
      return "QUEUED";
    default:
      return "READY";
  }
}

function adaptRenderService(rs: RenderService): VercelDeployment {
  return {
    uid: rs.id,
    name: rs.name,
    url: rs.serviceDetails?.url?.replace(/^https?:\/\//, "") || "",
    state: mapRenderStatus(rs.state, rs.suspended),
    createdAt: new Date(rs.createdAt || rs.updatedAt || new Date().toISOString()).getTime(),
    meta: { githubCommitRef: rs.repo ? "Auto-deployed from repo" : (rs.branch || "Manual deployment") },
  };
}

function mapSupabaseStatus(status: string): DeploymentState {
  switch (status?.toUpperCase()) {
    case "ACTIVE_HEALTHY":
      return "READY";
    case "COMING_UP":
    case "RESTORING":
    case "UPGRADING":
      return "BUILDING";
    case "INACTIVE":
    case "PAUSED":
      return "ERROR";
    default:
      return "READY";
  }
}

function adaptSupabaseProject(p: SupabaseProject): VercelDeployment {
  return {
    uid: p.id,
    name: p.name,
    url: `${p.id}.supabase.co`,
    state: mapSupabaseStatus(p.status),
    createdAt: new Date(p.created_at).getTime(),
    meta: { githubCommitRef: p.region },
  };
}

/* ── Context shape ────────────────────────────────────────────── */

interface DeploymentsContextValue {
  vercelItems: VercelDeployment[];
  railwayItems: VercelDeployment[];
  renderItems: VercelDeployment[];
  supabaseItems: VercelDeployment[];
  isLoadingVercel: boolean;
  isLoadingRailway: boolean;
  isLoadingRender: boolean;
  isLoadingSupabase: boolean;
  hasVercel: boolean;
  hasRailway: boolean;
  hasRender: boolean;
  hasSupabase: boolean;
  refresh: () => void;
}

const DeploymentsContext = createContext<DeploymentsContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────── */

export function DeploymentsProvider({ children }: { children: React.ReactNode }) {
  const { pin, hasPin } = usePin();

  const [vercelItems, setVercelItems] = useState<VercelDeployment[]>([]);
  const [railwayItems, setRailwayItems] = useState<VercelDeployment[]>([]);
  const [renderItems, setRenderItems] = useState<VercelDeployment[]>([]);
  const [supabaseItems, setSupabaseItems] = useState<VercelDeployment[]>([]);
  const [isLoadingVercel, setIsLoadingVercel] = useState(false);
  const [isLoadingRailway, setIsLoadingRailway] = useState(false);
  const [isLoadingRender, setIsLoadingRender] = useState(false);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [hasVercel, setHasVercel] = useState(false);
  const [hasRailway, setHasRailway] = useState(false);
  const [hasRender, setHasRender] = useState(false);
  const [hasSupabase, setHasSupabase] = useState(false);

  // Detect stored keys once on mount
  useEffect(() => {
    setHasVercel(hasStoredKey("vercel"));
    setHasRailway(hasStoredKey("railway"));
    setHasRender(hasStoredKey("render"));
    setHasSupabase(hasStoredKey("supabase"));
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

  const fetchRender = useCallback(async (token: string) => {
    setIsLoadingRender(true);
    try {
      const res = await fetch("/api/proxy/render/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Render ${res.status}`);
      const data: RenderResponse[] = await res.json();
      console.log("Render API Response:", data);
      const validItems = data.filter(item => item && item.service).map(item => item.service);
      setRenderItems(validItems.map(adaptRenderService));
    } catch (e) {
      console.error("Render Fetch Error:", e);
    } finally {
      setIsLoadingRender(false);
    }
  }, []);

  const fetchSupabase = useCallback(async (token: string) => {
    setIsLoadingSupabase(true);
    try {
      // Uses Next.js rewrite: /api/proxy/supabase/* → https://api.supabase.com/v1/*
      const res = await fetch("/api/proxy/supabase/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Supabase ${res.status}`);
      const data: SupabaseProject[] = await res.json();
      console.log("Supabase API Response:", data);
      setSupabaseItems(Array.isArray(data) ? data.map(adaptSupabaseProject) : []);
    } catch (e) {
      console.error("Supabase Fetch Error:", e);
    } finally {
      setIsLoadingSupabase(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (!hasPin) return;

    const vExists = hasStoredKey("vercel");
    const rExists = hasStoredKey("railway");
    const rdExists = hasStoredKey("render");
    const sbExists = hasStoredKey("supabase");

    setHasVercel(vExists);
    setHasRailway(rExists);
    setHasRender(rdExists);
    setHasSupabase(sbExists);

    const vToken = decryptAndRetrieve("vercel", pin);
    const rToken = decryptAndRetrieve("railway", pin);
    const rdToken = decryptAndRetrieve("render", pin);
    const sbToken = decryptAndRetrieve("supabase", pin);

    if (vToken) {
      try { fetchVercel(vToken); } catch (e) { console.error("Vercel context fetch failed", e); }
    }
    if (rToken) {
      try { fetchRailway(rToken); } catch (e) { console.error("Railway context fetch failed", e); }
    }
    if (rdToken) {
      try { fetchRender(rdToken); } catch (e) { console.error("Render context fetch failed", e); }
    }
    if (sbToken) {
      try { fetchSupabase(sbToken); } catch (e) { console.error("Supabase context fetch failed", e); }
    }
  }, [hasPin, pin, fetchVercel, fetchRailway, fetchRender, fetchSupabase]);

  // Clear all data when session is locked
  useEffect(() => {
    if (!hasPin) {
      setVercelItems([]);
      setRailwayItems([]);
      setRenderItems([]);
      setSupabaseItems([]);
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
        renderItems,
        supabaseItems,
        isLoadingVercel,
        isLoadingRailway,
        isLoadingRender,
        isLoadingSupabase,
        hasVercel,
        hasRailway,
        hasRender,
        hasSupabase,
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
