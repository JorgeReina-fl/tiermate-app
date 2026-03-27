import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PinProvider } from "@/components/PinContext";
import { DeploymentsProvider } from "@/components/DeploymentsContext";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TierMate — Unified Free Tier Manager",
  description:
    "Panel Local-First/BYOK seguro para gestionar tus servicios de Free Tier. Tus API Keys se guardan cifradas solo en tu navegador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full relative">
        {/* Global Pattern Texture Backdrop */}
        <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden opacity-[0.025]">
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="root-tiermate-pattern"
                width="180"
                height="80"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-15)"
              >
                <text
                  x="0"
                  y="50"
                  className="font-mono font-black text-4xl fill-foreground"
                >
                  TierMate
                </text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#root-tiermate-pattern)" />
          </svg>
        </div>

        <PinProvider>
          <DeploymentsProvider>
            <AppShell>{children}</AppShell>
            <Toaster richColors position="bottom-right" />
          </DeploymentsProvider>
        </PinProvider>
      </body>
    </html>
  );
}
