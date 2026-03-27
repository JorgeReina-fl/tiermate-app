"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Rocket } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Inicializando TierMate...",
    text: "Tu consola Local-First. Accede rápidamente a tus servicios.",
    icon: Shield,
    actionLabel: "Siguiente",
  },
  {
    title: "Seguridad Local",
    text: "Tus claves de Vercel y Railway se cifran en el navegador, nunca tocan nuestros servidores.",
    icon: Lock,
    actionLabel: "Entendido",
  },
  {
    title: "Todo listo",
    text: "Configura tu primer servicio para empezar.",
    icon: Rocket,
    actionLabel: "⚙️ Ir a Configuración",
  },
];

export function WelcomeTour() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(true); // true by default prevents hydration flash

  useEffect(() => {
    const skipped = localStorage.getItem("lf_tour_skipped") === "true";
    setDismissed(skipped);
  }, []);

  if (dismissed) return null;

  const handleSkip = () => {
    localStorage.setItem("lf_tour_skipped", "true");
    setDismissed(true);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSkip();
      router.push("/settings");
    }
  };

  const stepData = TOUR_STEPS[currentStep];
  const Icon = stepData.icon;

  return (
    <>
      {/* ── Full-screen overlay ─────────────────────────────────── */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-[2px] z-40 animate-in fade-in duration-500" />

      {/* ── Interactive tour card ───────────────────────────────── */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="relative z-10 w-full max-w-md pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
          {/* Glass card */}
          <div className="bg-[#16191F]/80 backdrop-blur-md border border-border rounded-[0.3rem] p-10 shadow-2xl shadow-black/60 text-center space-y-6 overflow-hidden">
            
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-1 bg-primary/40 blur-[3px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />

            {/* Icon */}
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Icon className="w-7 h-7" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {stepData.title}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {stepData.text}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10"
                onClick={handleNext}
              >
                {stepData.actionLabel}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground font-mono text-xs hover:bg-white/5 h-8"
                onClick={handleSkip}
              >
                Omitir tutorial
              </Button>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-2">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
