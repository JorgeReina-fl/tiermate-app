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
    >
      <body className="min-h-full">
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
