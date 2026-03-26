import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PinProvider } from "@/components/PinContext";
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
  title: "Free Tier Manager — Local-First",
  description:
    "Gestiona tus servicios de Free Tier desde un dashboard seguro. Tus API Keys se guardan cifradas solo en tu navegador.",
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
          <AppShell>{children}</AppShell>
          <Toaster richColors position="bottom-right" />
        </PinProvider>
      </body>
    </html>
  );
}
