/**
 * /api/proxy/vercel — Ephemeral CORS proxy for the Vercel Deployments API
 *
 * Security guarantees:
 *  - The route reads the Authorization header and forwards it to Vercel. It does NOT
 *    log, store, or persist the token in any way.
 *  - The server has no database. All data flows through RAM for the duration of the
 *    request and is discarded immediately after the response is sent.
 */

import { NextRequest, NextResponse } from "next/server";

const VERCEL_API_URL =
  "https://api.vercel.com/v6/deployments?limit=5&state=READY,BUILDING,ERROR,QUEUED";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or malformed Authorization header." },
      { status: 401 }
    );
  }

  // Forward the request to Vercel — token lives only in this in-flight request
  let vercelResponse: Response;
  try {
    vercelResponse = await fetch(VERCEL_API_URL, {
      headers: {
        Authorization: authHeader, // pass through, never log
        "Content-Type": "application/json",
      },
      // Opt out of Next.js fetch caching so we always get fresh data
      cache: "no-store",
    });
  } catch (err) {
    console.error("[proxy/vercel] Network error contacting Vercel API:", err);
    return NextResponse.json(
      { error: "Failed to reach the Vercel API. Check your network." },
      { status: 502 }
    );
  }

  const data = await vercelResponse.json();

  if (!vercelResponse.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? "Vercel API returned an error." },
      { status: vercelResponse.status }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
