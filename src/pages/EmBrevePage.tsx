import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Lock, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import logoIdjuv from "@/assets/logo-idjuv-oficial.png";

export default function EmBrevePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-ping" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-accent/40 rounded-full animate-ping delay-500" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/30 rounded-full animate-ping delay-700" />
      </div>

      <Card className="max-w-md w-full text-center shadow-2xl bg-card/80 backdrop-blur-sm border-border/50 relative z-10">
        <CardContent className="pt-10 pb-10 space-y-8">
          {/* Logo com efeito de brilho */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
            <img
              src={logoIdjuv}
              alt="IDJuv"
              className="h-24 mx-auto relative z-10 drop-shadow-lg"
            />
          </div>
          
          {/* Ícone e título */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Rocket className="h-8 w-8 text-primary animate-bounce" />
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Em Breve
              </h1>
              <p className="text-lg font-medium text-foreground">
                Novo Portal do IDJuv
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              Estamos construindo uma experiência digital moderna para você.
              Novidades em breve!
            </p>
          </div>

          {/* Indicador de progresso estilizado */}
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-3 h-3 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-3 h-3 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>

          {/* Link administrativo discreto */}
          <div className="pt-4 border-t border-border/50">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-primary transition-colors group"
            >
              <Lock className="h-3 w-3 group-hover:scale-110 transition-transform" />
              <span>Acesso Restrito</span>
              <Zap className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground/50 relative z-10">
        © {new Date().getFullYear()} Instituto de Desporto, Juventude e Lazer de Roraima
      </p>
    </div>
  );
}
