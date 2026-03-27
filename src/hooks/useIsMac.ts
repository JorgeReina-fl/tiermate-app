"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a Mac/iOS device.
 * Used for dynamic keyboard shortcut hints (Cmd vs Ctrl).
 */
export function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent;
      const macMatch = /Mac|iPad|iPhone|iPod/.test(userAgent);
      setIsMac(macMatch);
    }
  }, []);

  return isMac;
}
