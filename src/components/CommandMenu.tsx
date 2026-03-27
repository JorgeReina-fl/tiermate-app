"use client";

/**
 * CommandMenu — Global Cmd+K / Ctrl+K command palette.
 *
 * Security: The shortcut and dialog are completely suppressed when
 * the PIN session is locked (hasPin === false). No project data is
 * ever rendered in the DOM while the session is locked.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Settings, ExternalLink, Triangle } from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { usePin } from "@/components/PinContext";
import { useDeployments } from "@/components/DeploymentsContext";

/* ── Navigation items (always available when unlocked) ────────── */

const NAV_ITEMS = [
  { id: "nav-dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { id: "nav-settings", label: "Ajustes", href: "/settings", icon: Settings },
];

/* ── Service badge ────────────────────────────────────────────── */

function ServiceBadge({ service }: { service: "vercel" | "railway" }) {
  const isVercel = service === "vercel";
  return (
    <span
      style={{
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "0.6rem",
        letterSpacing: "0.04em",
        padding: "1px 6px",
        borderRadius: "0.3rem",
        border: "1px solid",
        borderColor: isVercel ? "rgba(255,255,255,0.20)" : "rgba(180,83,9,0.50)",
        color: isVercel ? "rgba(220,220,221,0.70)" : "rgb(251,146,60)",
        background: isVercel ? "rgba(255,255,255,0.04)" : "rgba(180,83,9,0.12)",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      {isVercel ? (
        <Triangle style={{ width: 7, height: 7, fill: "currentColor" }} />
      ) : (
        <span style={{ fontSize: "0.7rem", lineHeight: 1 }}>⬡</span>
      )}
      {isVercel ? "Vercel" : "Railway"}
    </span>
  );
}

/* ── Main component ───────────────────────────────────────────── */

export function CommandMenu() {
  const { hasPin } = usePin();
  const { vercelItems, railwayItems } = useDeployments();
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  /* Global keyboard listener & Custom Event listener */
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!hasPin) return; // ← Zero-knowledge guard
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    
    function onCustomOpen() {
      if (hasPin) setOpen(true);
    }
    
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onCustomOpen);
    
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onCustomOpen);
    };
  }, [hasPin]);

  /* Close when session is locked */
  React.useEffect(() => {
    if (!hasPin) setOpen(false);
  }, [hasPin]);

  /* Don't mount dialog content at all while locked */
  if (!hasPin) return null;

  function handleSelect(action: () => void) {
    setOpen(false);
    // Slight delay so the dialog closes before navigation
    setTimeout(action, 80);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Paleta de Comandos"
      description="Busca proyectos, navega entre páginas o abre despliegues."
      className="command-menu-dialog"
    >
      <style>{`
        /* ── Industrial palette override ── */
        [data-slot="dialog-content"].command-menu-dialog {
          background: #0F1115;
          border: 1px solid #4C5C68;
          border-radius: 0.3rem;
          box-shadow: 0 24px 64px rgba(0,0,0,0.70);
          max-width: 560px;
        }
        [data-slot="dialog-content"].command-menu-dialog [data-slot="command"] {
          background: #0F1115;
          border-radius: 0.3rem;
        }
        [data-slot="dialog-content"].command-menu-dialog [data-slot="command-input-wrapper"] {
          border-bottom: 1px solid #4C5C68;
          padding-bottom: 0.5rem;
          margin-bottom: 0;
        }
        [data-slot="dialog-content"].command-menu-dialog [data-slot="command-input"] {
          font-family: var(--font-geist-mono, monospace);
          font-size: 0.875rem;
          color: #DCDCDD;
        }
        [data-slot="dialog-content"].command-menu-dialog [data-slot="command-input"]::placeholder {
          color: #8B949E;
        }
        /* Group heading */
        [data-slot="dialog-content"].command-menu-dialog **[[cmdk-group-heading]] {
          font-family: var(--font-geist-mono, monospace);
          font-size: 0.625rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8B949E;
        }
        /* Items */
        [data-slot="dialog-content"].command-menu-dialog [data-slot="command-item"] {
          border-radius: 0.3rem;
          font-size: 0.8125rem;
          color: #DCDCDD;
        }
        [data-slot="dialog-content"].command-menu-dialog [data-slot="command-item"][data-selected="true"],
        [data-slot="dialog-content"].command-menu-dialog [data-slot="command-item"]:hover {
          background: #16191F;
        }
        /* Mono font for project names */
        .cmd-mono {
          font-family: var(--font-geist-mono, monospace);
        }
        /* Empty state */
        [data-slot="dialog-content"].command-menu-dialog [data-slot="command-empty"] {
          color: #8B949E;
          font-family: var(--font-geist-mono, monospace);
          font-size: 0.8rem;
        }
      `}</style>

      <Command>
        <CommandInput placeholder="Buscar proyectos, navegar..." />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>

          {/* ── Navigation ── */}
          <CommandGroup heading="Navegación">
            {NAV_ITEMS.map(({ id, label, href, icon: Icon }) => (
              <CommandItem
                key={id}
                value={label}
                onSelect={() => handleSelect(() => router.push(href))}
                className="gap-3"
              >
                <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <span className="cmd-mono flex-1">{href}</span>
                <span className="text-[11px] text-muted-foreground">{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* ── Vercel deployments ── */}
          {vercelItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Vercel">
                {vercelItems.map((d) => (
                  <CommandItem
                    key={d.uid}
                    value={`${d.name} ${d.url}`}
                    onSelect={() =>
                      handleSelect(() => window.open(`https://${d.url}`, "_blank"))
                    }
                    className="gap-3"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span className="cmd-mono flex-1 truncate">{d.name}</span>
                    <ServiceBadge service="vercel" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* ── Railway deployments ── */}
          {railwayItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Railway">
                {railwayItems.map((d) => (
                  <CommandItem
                    key={d.uid}
                    value={`${d.name} railway`}
                    onSelect={() =>
                      handleSelect(() => window.open(`https://${d.url}`, "_blank"))
                    }
                    className="gap-3"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span className="cmd-mono flex-1 truncate">{d.name}</span>
                    <ServiceBadge service="railway" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* ── Footer hint ── */}
        <div
          style={{
            borderTop: "1px solid #4C5C68",
            padding: "6px 12px",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          {[
            { keys: ["↵"], label: "abrir" },
            { keys: ["↑", "↓"], label: "navegar" },
            { keys: ["Esc"], label: "cerrar" },
          ].map(({ keys, label }) => (
            <span
              key={label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.625rem",
                color: "#8B949E",
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            >
              {keys.map((k) => (
                <kbd
                  key={k}
                  style={{
                    background: "#16191F",
                    border: "1px solid #4C5C68",
                    borderRadius: "0.3rem",
                    padding: "1px 5px",
                    fontSize: "0.625rem",
                    color: "#DCDCDD",
                  }}
                >
                  {k}
                </kbd>
              ))}
              {label}
            </span>
          ))}
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.6rem",
              color: "#8B949E",
              fontFamily: "var(--font-geist-mono, monospace)",
              opacity: 0.7,
            }}
          >
            TierMate · cmd palette
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
