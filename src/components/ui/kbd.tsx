"use client";

import { useIsMac } from "@/hooks/useIsMac";
import { cn } from "@/lib/utils";

interface KbdProps {
  className?: string;
}

/**
 * A styled keyboard key component (Kbd) that dynamically
 * shows '⌘K' on Mac/iOS and 'Ctrl K' on other platforms.
 */
export function Kbd({ className }: KbdProps) {
  const isMac = useIsMac();

  return (
    <kbd
      className={cn(
        "inline-flex items-center bg-white/5 border border-border/50 rounded-[0.3rem] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground transition-all",
        !isMac && "px-2", // Extra padding for 'Ctrl K'
        className
      )}
    >
      {isMac ? "⌘K" : "Ctrl K"}
    </kbd>
  );
}
