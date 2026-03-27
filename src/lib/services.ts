/**
 * services.ts — Supported Free-Tier Service Registry
 *
 * Add new services here. Each entry drives the Settings UI and the dashboard.
 */

export interface ServiceDefinition {
  /** Unique key used in localStorage and proxy routes, e.g. "vercel" */
  id: string;
  /** Display name shown in the UI */
  label: string;
  /** Short description */
  description: string;
  /** Placeholder shown inside the token input field */
  tokenPlaceholder: string;
  /** Link to where the user can obtain a token */
  tokenDocsUrl: string;
  /** Brand color (Tailwind-compatible hex or CSS value) */
  color: string;
  /** Whether this service is implemented in the MVP */
  available: boolean;
}

export const SERVICES: ServiceDefinition[] = [
  {
    id: "vercel",
    label: "Vercel",
    description: "Monitor deployments on the Vercel platform.",
    tokenPlaceholder: "Paste your Vercel Access Token…",
    tokenDocsUrl: "https://vercel.com/account/tokens",
    color: "#000000",
    available: true,
  },
  {
    id: "render",
    label: "Render",
    description: "Monitor services on Render.",
    tokenPlaceholder: "Paste your Render API Key…",
    tokenDocsUrl: "https://dashboard.render.com/u/settings#api-keys",
    color: "#46E3B7",
    available: true,
  },
  {
    id: "railway",
    label: "Railway",
    description: "Monitor projects on Railway.",
    tokenPlaceholder: "Paste your Railway API Token…",
    tokenDocsUrl: "https://railway.app/account/tokens",
    color: "#B45309",
    available: true,
  },
  {
    id: "supabase",
    label: "Supabase",
    description: "Monitor projects on Supabase.",
    tokenPlaceholder: "Paste your Supabase Personal Access Token…",
    tokenDocsUrl: "https://supabase.com/dashboard/account/tokens",
    color: "#3ECF8E",
    available: true,
  },
];
