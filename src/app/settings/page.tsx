"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, Eye, EyeOff, CheckCircle2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { encryptAndStore, hasStoredKey, removeKey } from "@/lib/storage";
import { usePin } from "@/components/PinContext";
import { SERVICES } from "@/lib/services";

export default function SettingsPage() {
  const { pin, setPin, hasPin } = usePin();
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [showPin, setShowPin] = useState(false);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  function handleSave(serviceId: string) {
    const token = tokens[serviceId]?.trim();
    if (!token) {
      toast.error("El token no puede estar vacío.");
      return;
    }
    if (!hasPin) {
      toast.error("Introduce primero un PIN de sesión.");
      return;
    }
    encryptAndStore(serviceId, token, pin);
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tus tokens se cifran en tu navegador antes de guardarse. El servidor nunca los ve.
        </p>
      </div>

      {/* Session PIN */}
      <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-base">PIN de Sesión</CardTitle>
            <Badge variant={hasPin ? "default" : "outline"} className="ml-auto text-xs">
              {hasPin ? "Sesión activa" : "Sin PIN"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            El PIN cifra y descifra tus tokens. Solo existe en memoria — si refrescas la página, deberás introducirlo de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              id="session-pin"
              type={showPin ? "text" : "password"}
              placeholder="Escribe un PIN (mín. 4 caracteres)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="pr-10"
              maxLength={32}
            />
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
                  <Label htmlFor={`token-${service.id}`} className="text-xs">
                    Access Token
                  </Label>
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
                <a
                  href={service.tokenDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  ¿Cómo obtener el token? <ExternalLink className="w-3 h-3" />
                </a>
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
                  disabled={!hasPin || !tokens[service.id]?.trim()}
                >
                  Cifrar y Guardar
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
