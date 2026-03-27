"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, Settings, Triangle, Box, Lock, Key } from "lucide-react";
import { CommandMenu } from "@/components/CommandMenu";
import { Kbd } from "@/components/ui/kbd";
import { useDeployments } from "@/components/DeploymentsContext";
import { useEffect, useState } from "react";

/* ── Service sub-sections ──────────────────────────────────── */

const SERVICE_SECTIONS = [
  {
    key: "vercel",
    label: "Vercel",
    anchorId: "section-vercel",
    icon: <Triangle className="w-3 h-3 fill-current shrink-0" />,
  },
  {
    key: "railway",
    label: "Railway",
    anchorId: "section-railway",
    icon: <span className="text-[10px] leading-none shrink-0">⬡</span>,
  },
  {
    key: "render",
    label: "Render",
    anchorId: "section-render",
    icon: <Box className="w-3 h-3 shrink-0 text-[#46E3B7]" />,
  },
] as const;

const SETTINGS_SECTIONS = [
  { label: "Seguridad (PIN)", anchorId: "section-security", icon: <Lock className="w-3 h-3 shrink-0" /> },
  { label: "API Keys", anchorId: "section-api-keys", icon: <Key className="w-3 h-3 shrink-0" /> },
] as const;

/* ── Main component ────────────────────────────────────────── */

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasVercel, hasRailway, hasRender } = useDeployments();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  /* IntersectionObserver — tracks which section is in viewport */
  useEffect(() => {
    const anchors = [
      "section-vercel",
      "section-railway",
      "section-render",
      "section-security",
      "section-api-keys",
    ];

    const observers: IntersectionObserver[] = [];

    anchors.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [pathname]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }

  const isDashboard = pathname === "/";
  const isSettings = pathname === "/settings";

  const hasAnyService = hasVercel || hasRailway || hasRender;

  return (
    <div className="flex min-h-screen relative z-10">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-background/60 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto">

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border shrink-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
            <Shield className="w-4 h-4" />
          </span>
          <div className="leading-tight min-w-0">
            <p className="font-semibold text-sm">TierMate</p>
            <p className="text-[10px] text-muted-foreground font-mono">Local-First · BYOK</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">

          {/* ── Dashboard ── */}
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-[0.3rem] text-sm font-medium transition-colors
              ${isDashboard
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </Link>

          {/* Sub-sections: only show on dashboard when services exist */}
          {isDashboard && hasAnyService && (
            <div className="ml-4 pl-3 border-l border-border/60 space-y-0.5 py-1 mt-0.5">
              {SERVICE_SECTIONS.map(({ key, label, anchorId, icon }) => {
                const isActive = activeSection === anchorId;
                const isEnabled =
                  (key === "vercel" && hasVercel) ||
                  (key === "railway" && hasRailway) ||
                  (key === "render" && hasRender);

                if (!isEnabled) return null;

                return (
                  <button
                    key={key}
                    onClick={() => scrollTo(anchorId)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[0.3rem] text-xs font-mono transition-colors text-left
                      ${isActive
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                  >
                    {/* Active indicator */}
                    <span className={`w-1 h-1 rounded-full shrink-0 transition-colors ${isActive ? "bg-primary" : "bg-border"}`} />
                    {icon}
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Configuración ── */}
          <div className="pt-3">
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-[0.3rem] text-sm font-medium transition-colors
                ${isSettings
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              Configuración
            </Link>

            {/* Quick-access sub-links for settings */}
            {isSettings && (
              <div className="ml-4 pl-3 border-l border-border/60 space-y-0.5 py-1 mt-0.5">
                {SETTINGS_SECTIONS.map(({ label, anchorId, icon }) => {
                  const isActive = activeSection === anchorId;
                  return (
                    <button
                      key={anchorId}
                      onClick={() => scrollTo(anchorId)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[0.3rem] text-xs font-mono transition-colors text-left
                        ${isActive
                          ? "text-foreground bg-accent"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                    >
                      <span className={`w-1 h-1 rounded-full shrink-0 transition-colors ${isActive ? "bg-primary" : "bg-border"}`} />
                      {icon}
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border space-y-2 shrink-0">
          <p className="text-[10px] text-muted-foreground/70 leading-snug font-mono">
            Claves cifradas localmente.<br />El servidor nunca las ve.
          </p>
          <p className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1.5">
            <Kbd className="px-1 py-0.5" />
            <span>Paleta de comandos</span>
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-auto">
        {children}
      </main>

      {/* Global command palette — always present, gated by PIN */}
      <CommandMenu />
    </div>
  );
}
