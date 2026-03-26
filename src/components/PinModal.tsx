"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePin } from "@/components/PinContext";
import { validatePin } from "@/lib/storage";

export function PinModal({ open }: { open: boolean }) {
  const { setPin: setGlobalPin } = usePin();
  const [localPin, setLocalPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  
  // Lockout State (syncs with localStorage lf_pin_lockout)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem("lf_pin_lockout");
      if (stored) {
        const time = parseInt(stored, 10);
        if (time > Date.now()) {
          setLockoutUntil(time);
        } else {
          localStorage.removeItem("lf_pin_lockout");
        }
      }
    }
  }, [open]);

  useEffect(() => {
    if (!lockoutUntil) return;
    const updateTimer = () => {
      const left = Math.max(0, lockoutUntil - Date.now());
      setTimeRemaining(left);
      if (left === 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        localStorage.removeItem("lf_pin_lockout");
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!localPin) return;

    if (lockoutUntil !== null && Date.now() < lockoutUntil) {
      toast.error("Tu PIN está bloqueado temporalmente.");
      return;
    }

    const isValid = validatePin(localPin);
    
    if (isValid === true) {
      toast.success("Sesión restaurada con éxito.");
      setGlobalPin(localPin);
      setLocalPin("");
      setFailedAttempts(0);
      // The modal closes automatically because `open` is derived from `!hasPin` in parent
    } else if (isValid === false) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const lockoutTime = Date.now() + 5 * 60 * 1000;
        setLockoutUntil(lockoutTime);
        localStorage.setItem("lf_pin_lockout", lockoutTime.toString());
        toast.error("Demasiados intentos fallidos. PIN bloqueado.");
      } else {
        toast.error(`PIN incorrecto. Te quedan ${3 - newAttempts} intentos.`);
      }
      setLocalPin("");
    } else {
      // isValid is null (no pin configured yet) - Should not really happen here since we only open if tokens exist 
      // but gracefully fallback.
      toast.error("No hay un PIN configurado en el sistema.");
    }
  }

  function handleNuclearReset() {
    localStorage.removeItem("lf_enc_vercel");
    localStorage.removeItem("lf_pin_validator");
    localStorage.removeItem("lf_pin_lockout");
    setGlobalPin("");
    window.location.href = "/settings";
  }

  // Prevent closing by clicking outside to enforce security (must enter PIN to see dashboard)
  // The user can't interact with the background anyway, but if they want to manage tokens, they'd use settings. 
  // Wait, if they forgot the PIN they might want to go to Settings to reset the app? No, settings also requires the PIN to see the tokens, but they could delete them.
  // We'll let `onOpenChange={undefined}` which means it can't be closed unless they enter the PIN or navigate away via the sidebar.

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md bg-[#16191F] border-border rounded-[0.3rem]"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle>Desbloquear TierMate</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground mt-2">
            Tu sesión ha expirado. Introduce tu PIN local para descifrar tus claves API y acceder a tus servicios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="relative">
            <Input
              id="modal-pin"
              type={showPin ? "text" : "password"}
              placeholder="Introduce tu PIN"
              value={localPin}
              onChange={(e) => setLocalPin(e.target.value)}
              className="pr-10 font-mono bg-background border-border"
              maxLength={32}
              disabled={lockoutUntil !== null}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              disabled={lockoutUntil !== null}
              tabIndex={-1}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {lockoutUntil !== null && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>
                Bloqueado por seguridad. Reintentar en {Math.ceil(timeRemaining / 1000)}s
              </span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={!localPin || lockoutUntil !== null}
          >
            Descifrar y Entrar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger className="w-full mt-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors py-2 rounded-md">
              ¿Olvidaste tu PIN? Restablecer aplicación
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md bg-[#16191F] border-border rounded-[0.3rem]">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Restablecer TierMate?</AlertDialogTitle>
                <AlertDialogDescription className="font-mono text-muted-foreground mt-2 text-[11px] leading-relaxed">
                  ¿Estás seguro? Esta acción borrará todos tus tokens guardados localmente. Al ser un sistema de privacidad absoluta, no podemos recuperar tus datos sin el PIN original.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-[0.3rem]">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-[0.3rem]"
                  onClick={handleNuclearReset}
                >
                  Sí, borrar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </DialogContent>
    </Dialog>
  );
}
