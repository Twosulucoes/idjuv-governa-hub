import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Construction, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import logoIdjuv from "@/assets/logo-idjuv-oficial.png";

const EmBrevePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-muted flex flex-col items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center shadow-xl bg-card border-border">
        <CardContent className="pt-8 pb-8 space-y-6">
          <img
            src={logoIdjuv}
            alt="IDJUV"
            className="h-20 mx-auto"
          />
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-warning">
              <Construction className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Site em Construção
            </h1>
            <p className="text-muted-foreground">
              Estamos trabalhando para trazer uma experiência incrível para você.
              Em breve, nosso portal estará disponível.
            </p>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enquanto isso, você pode realizar seu pré-cadastro:
            </p>
            <Button asChild size="lg" className="w-full">
              <Link to="/curriculo">
                Pré-Cadastro de Servidores
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <Link
              to="/auth"
              className="text-xs text-muted-foreground/70 hover:text-muted-foreground inline-flex items-center gap-1 transition-colors"
            >
              <Lock className="h-3 w-3" />
              Acesso Administrativo
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground/60">
        © {new Date().getFullYear()} Instituto de Desenvolvimento da Juventude de Roraima
      </p>
    </div>
  );
};

export default EmBrevePage;
