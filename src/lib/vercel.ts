/**
 * vercel.ts — Vercel API v6 Type Definitions
 *
 * Source: https://vercel.com/docs/rest-api/endpoints/deployments#list-deployments
 */

export type DeploymentState =
  | "QUEUED"
  | "BUILDING"
  | "ERROR"
  | "INITIALIZING"
  | "READY"
  | "CANCELED";

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: DeploymentState;
  /** Branch or git ref that triggered the deployment */
  meta?: {
    githubCommitRef?: string;
    githubCommitMessage?: string;
    githubCommitOrg?: string;
    githubCommitRepo?: string;
  };
  createdAt: number; // Unix timestamp in milliseconds
  ready?: number;    // Unix timestamp when deployment became ready
  inspectorUrl?: string;
}

export interface VercelDeploymentsResponse {
  deployments: VercelDeployment[];
  pagination?: {
    count: number;
    next: number | null;
    prev: number | null;
  };
}
