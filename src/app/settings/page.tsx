"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Eye, EyeOff, CheckCircle2, Trash2, ExternalLink, KeyRound, LogIn, Copy, AlertCircle, ShieldAlert, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { encryptAndStore, hasStoredKey, removeKey, validatePin } from "@/lib/storage";
import { usePin } from "@/components/PinContext";
import { SERVICES } from "@/lib/services";

export default function SettingsPage() {
  const { pin: globalPin, setPin: setGlobalPin, hasPin: hasGlobalPin } = usePin();
  const [localPin, setLocalPin] = useState("");
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [showPin, setShowPin] = useState(false);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  // --- New state for Brute Force Protection ---
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("lf_pin_lockout");
    if (stored) {
      const time = parseInt(stored, 10);
      if (time > Date.now()) {
        setLockoutUntil(time);
      } else {
        localStorage.removeItem("lf_pin_lockout");
      }
    }
  }, []);

  useEffect(() => {
    if (globalPin && !localPin) {
      setLocalPin(globalPin);
    }
  }, [globalPin]); // Only sync once initially if context already has it

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

  function handleCheckPin() {
    if (!localPin) {
      toast.error("Introduce un PIN para comprobar.");
      return;
    }
    
    const isValid = validatePin(localPin);
    if (isValid === null) {
      toast.info("Aún no hay un PIN guardado. Se configurará al guardar tu primer token.");
      return;
    }
    
    if (isValid) {
      toast.success("¡El PIN es correcto!");
      setGlobalPin(localPin);
      setFailedAttempts(0);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const lockoutTime = Date.now() + 5 * 60 * 1000;
        setLockoutUntil(lockoutTime);
        localStorage.setItem("lf_pin_lockout", lockoutTime.toString());
        toast.error("Demasiados intentos fallidos. PIN bloqueado.");
        setLocalPin(""); // erase current input
      } else {
        toast.error(`PIN incorrecto. Te quedan ${3 - newAttempts} intentos.`);
      }
    }
  }

  function handleSave(serviceId: string) {
    const token = tokens[serviceId]?.trim();
    if (!token) {
      toast.error("El token no puede estar vacío.");
      return;
    }
    if (!localPin) {
      toast.error("Introduce primero un PIN de sesión.");
      return;
    }
    encryptAndStore(serviceId, token, localPin);
    setGlobalPin(localPin); // In case they set a NEW pin and saved immediately
    setTokens((prev) => ({ ...prev, [serviceId]: "" }));
    toast.success(`Token de ${serviceId} guardado de forma cifrada en tu navegador.`);
  }

  function handleRemove(serviceId: string) {
    removeKey(serviceId);
    toast.info(`Token de ${serviceId} eliminado de localStorage.`);
  }

  const availableServices = SERVICES.filter((s) => s.available);
  const comingSoon = SERVICES.filter((s) => !s.available);

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración de TierMate</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configura tus accesos a servicios de terceros de forma segura.
        </p>
      </div>

      {/* Educational Alert */}
      <Alert className="mb-8 border-primary/20 bg-primary/5">
        <ShieldAlert className="h-5 w-5 !text-primary" />
        <AlertTitle className="font-semibold text-primary ml-1">Tu privacidad es absoluta (Zero-Knowledge)</AlertTitle>
        <AlertDescription className="text-sm text-foreground/80 mt-3 ml-1">
          <ul className="space-y-3 list-disc list-inside marker:text-primary/50">
            <li>
              <strong>Tus tokens nunca tocan los servidores de TierMate;</strong> se cifran con AES y se guardan exclusivamente en el almacenamiento local de tu navegador.
            </li>
            <li>
              Sin bases de datos centralizadas, <strong>es imposible que nosotros recuperemos tu cuenta</strong> si olvidas tu PIN o borras la caché.
            </li>
            <li>
              Utiliza un <strong>PIN de sesión fuerte</strong>. Como el cifrado es local, la seguridad de tus llaves frente a accesos físicos a tu equipo depende de la complejidad de tu PIN.
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Session PIN */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">PIN de Sesión</CardTitle>
            <Badge variant={hasGlobalPin ? "default" : "outline"} className="ml-auto text-xs">
              {hasGlobalPin ? "Sesión activa" : "Sin PIN"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            El PIN cifra y descifra tus tokens. Solo existe en memoria — si refrescas la página, deberás introducirlo de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="session-pin"
                  type={showPin ? "text" : "password"}
                  placeholder="Escribe un PIN (mín. 4 caracteres)"
                  value={localPin}
                  onChange={(e) => setLocalPin(e.target.value)}
                  className="pr-10 font-mono"
                  maxLength={32}
                  disabled={lockoutUntil !== null}
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                  disabled={lockoutUntil !== null}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                variant="secondary"
                onClick={handleCheckPin}
                disabled={!localPin || lockoutUntil !== null}
              >
                Comprobar PIN
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Este PIN se convertirá en la única llave para acceder a tus datos locales. Si ya tenías datos guardados, el nuevo PIN sustituirá al anterior.
            </p>
            
            {isMounted && lockoutUntil !== null && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>Demasiados intentos. Inténtalo de nuevo en {Math.ceil(timeRemaining / 60000)} minutos.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active services */}
      <div className="space-y-4 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Servicios disponibles
        </h2>
        {availableServices.map((service) => {
          const stored = typeof window !== "undefined" ? hasStoredKey(service.id) : false;
          const showTok = showTokens[service.id];
          return (
            <Card key={service.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{service.label}</CardTitle>
                  <Badge variant={stored ? "default" : "outline"} className="text-xs">
                    {stored ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Configurado
                      </span>
                    ) : (
                      "Sin configurar"
                    )}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{service.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`token-${service.id}`} className="text-xs">
                      Access Token
                    </Label>
                    {service.id === "vercel" && (
                      <Popover>
                        <PopoverTrigger className="text-muted-foreground hover:text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full cursor-help">
                          <CircleHelp className="w-3.5 h-3.5" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-xs shadow-lg border-border" side="right" align="start">
                          <h4 className="font-semibold mb-2">¿Cómo obtener tu token?</h4>
                          <ol className="space-y-2.5">
                            <li className="flex items-start gap-2">
                              <span className="flex items-center justify-center w-4 h-4 rounded-sm bg-primary/20 text-primary font-bold shrink-0 mt-0.5">1</span>
                              <p className="text-muted-foreground leading-snug">Inicia sesión en cuenta de Vercel.</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="flex items-center justify-center w-4 h-4 rounded-sm bg-primary/20 text-primary font-bold shrink-0 mt-0.5">2</span>
                              <p className="text-muted-foreground leading-snug">Abre <span className="font-mono bg-muted p-0.5 rounded">Ajustes &gt; Tokens</span> o pulsa el enlace debajo.</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="flex items-center justify-center w-4 h-4 rounded-sm bg-primary/20 text-primary font-bold shrink-0 mt-0.5">3</span>
                              <p className="text-muted-foreground leading-snug">Pulsa <strong>Create Token</strong> y cópialo aquí.</p>
                            </li>
                          </ol>
                          <a
                            href="https://vercel.com/account/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 font-medium text-primary hover:underline underline-offset-2"
                          >
                            Ir a vercel.com/account/tokens
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id={`token-${service.id}`}
                      type={showTok ? "text" : "password"}
                      placeholder={service.tokenPlaceholder}
                      value={tokens[service.id] ?? ""}
                      onChange={(e) =>
                        setTokens((prev) => ({ ...prev, [service.id]: e.target.value }))
                      }
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowTokens((prev) => ({ ...prev, [service.id]: !prev[service.id] }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showTok ? "Ocultar token" : "Mostrar token"}
                    >
                      {showTok ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 justify-end">
                {stored && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(service.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Borrar token
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleSave(service.id)}
                  disabled={!localPin || !tokens[service.id]?.trim()}
                >
                  Actualizar Llave y Guardar
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Separator className="my-6" />

      {/* Coming soon */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Próximamente
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {comingSoon.map((service) => (
            <Card key={service.id} className="opacity-50 pointer-events-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{service.label}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">Pronto</Badge>
                </div>
                <CardDescription className="text-xs">{service.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
