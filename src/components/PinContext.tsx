"use client";

/**
 * PinContext — Ephemeral session PIN stored exclusively in React state.
 *
 * The PIN is NEVER written to localStorage, sessionStorage, or cookies.
 * When the component tree unmounts (tab close / refresh), the PIN is gone.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { decryptAndRetrieve } from "@/lib/storage";

interface PinContextValue {
  pin: string;
  setPin: (pin: string) => void;
  clearPin: () => void;
  hasPin: boolean;
  vercelToken: string | null;
  railwayToken: string | null;
  refreshTokens: () => void;
}

const PinContext = createContext<PinContextValue | null>(null);

export function PinProvider({ children }: { children: React.ReactNode }) {
  const [pin, setRawPin] = useState("");
  const [vercelToken, setVercelToken] = useState<string | null>(null);
  const [railwayToken, setRailwayToken] = useState<string | null>(null);

  const setPin = (p: string) => setRawPin(p.trim());
  const clearPin = () => setRawPin("");
  const hasPin = pin.length > 0;

  const refreshTokens = useCallback(() => {
    if (hasPin) {
      setVercelToken(decryptAndRetrieve("vercel", pin));
      setRailwayToken(decryptAndRetrieve("railway", pin));
    } else {
      setVercelToken(null);
      setRailwayToken(null);
    }
  }, [pin, hasPin]);

  useEffect(() => {
    refreshTokens();
  }, [pin, refreshTokens]);

  return (
    <PinContext.Provider value={{ pin, setPin, clearPin, hasPin, vercelToken, railwayToken, refreshTokens }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin(): PinContextValue {
  const ctx = useContext(PinContext);
  if (!ctx) {
    throw new Error("usePin must be used inside <PinProvider>");
  }
  return ctx;
}
