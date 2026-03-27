"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, Settings } from "lucide-react";
import { CommandMenu } from "@/components/CommandMenu";
import { Kbd } from "@/components/ui/kbd";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen relative z-10">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border flex flex-col bg-background/50 backdrop-blur-xl">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Shield className="w-4 h-4" />
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-sm">TierMate</p>
            <p className="text-[10px] text-muted-foreground">Local-First · BYOK</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border space-y-2">
          <p className="text-[11px] text-muted-foreground leading-snug">
            Tus claves se guardan cifradas en tu navegador. El servidor nunca las ve.
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-mono flex items-center gap-1.5">
            <Kbd className="px-1 py-0.5" />
            Paleta de comandos
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
