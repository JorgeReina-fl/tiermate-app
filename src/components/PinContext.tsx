"use client";

/**
 * PinContext — Ephemeral session PIN stored exclusively in React state.
 *
 * The PIN is NEVER written to localStorage, sessionStorage, or cookies.
 * When the component tree unmounts (tab close / refresh), the PIN is gone.
 */

import React, { createContext, useContext, useState } from "react";

interface PinContextValue {
  pin: string;
  setPin: (pin: string) => void;
  clearPin: () => void;
  hasPin: boolean;
}

const PinContext = createContext<PinContextValue | null>(null);

export function PinProvider({ children }: { children: React.ReactNode }) {
  const [pin, setRawPin] = useState("");

  const setPin = (p: string) => setRawPin(p.trim());
  const clearPin = () => setRawPin("");
  const hasPin = pin.length > 0;

  return (
    <PinContext.Provider value={{ pin, setPin, clearPin, hasPin }}>
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
