/**
 * PÁGINA: INSTALAÇÃO DO APP
 * Instruções para instalar o PWA no dispositivo
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Download, Smartphone, Check, ArrowRight, Share, 
  Plus, MoreVertical, Home, Wifi, Camera, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstalarAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detectar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      {/* Header */}
      <header className="p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Smartphone className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">IDJUV Inventário</h1>
        <p className="text-muted-foreground mt-1">Coleta de Bens em Campo</p>
      </header>

      {/* Status de Instalação */}
      <section className="px-6 mb-6">
        {isInstalled ? (
          <Card className="border-success bg-success/10">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-success">App Instalado!</p>
                <p className="text-sm text-muted-foreground">
                  Acesse pela sua tela inicial
                </p>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardContent className="py-4">
              <Button onClick={handleInstall} className="w-full h-14 text-lg">
                <Download className="w-5 h-5 mr-2" />
                Instalar Aplicativo
              </Button>
            </CardContent>
          </Card>
        ) : isIOS ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Share className="w-5 h-5" />
                Instalar no iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Toque no botão Compartilhar</p>
                  <p className="text-sm text-muted-foreground">
                    <Share className="w-4 h-4 inline" /> na barra do Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Selecione "Adicionar à Tela Inicial"</p>
                  <p className="text-sm text-muted-foreground">
                    <Plus className="w-4 h-4 inline" /> Add to Home Screen
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Confirme a instalação</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em "Adicionar"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MoreVertical className="w-5 h-5" />
                Instalar no Android
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Toque no menu do navegador</p>
                  <p className="text-sm text-muted-foreground">
                    <MoreVertical className="w-4 h-4 inline" /> (três pontos)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Selecione "Instalar aplicativo"</p>
                  <p className="text-sm text-muted-foreground">
                    Ou "Adicionar à tela inicial"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Funcionalidades */}
      <section className="px-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Funcionalidades</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4 text-center">
              <Camera className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Scanner QR</p>
              <p className="text-xs text-muted-foreground">Leia códigos de barras</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">GPS</p>
              <p className="text-xs text-muted-foreground">Localização do bem</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Wifi className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Modo Offline</p>
              <p className="text-xs text-muted-foreground">Funciona sem internet</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Home className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Na Tela Inicial</p>
              <p className="text-xs text-muted-foreground">Acesso rápido</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ações */}
      <section className="px-6 pb-8">
        <Button asChild className="w-full h-14 text-lg mb-3">
          <Link to="/coleta-mobile">
            <ArrowRight className="w-5 h-5 mr-2" />
            Iniciar Coleta
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/inventario">
            Acessar Sistema Completo
          </Link>
        </Button>
      </section>
    </div>
  );
}
