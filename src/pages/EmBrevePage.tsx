import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Construction, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import logoIdjuv from "@/assets/logo-idjuv-oficial.png";

const EmBrevePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center shadow-xl">
        <CardContent className="pt-8 pb-8 space-y-6">
          <img
            src={logoIdjuv}
            alt="IDJUV"
            className="h-20 mx-auto"
          />
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-yellow-600">
              <Construction className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Site em Construção
            </h1>
            <p className="text-gray-600">
              Estamos trabalhando para trazer uma experiência incrível para você.
              Em breve, nosso portal estará disponível.
            </p>
          </div>

          <div className="border-t pt-6 space-y-4">
            <p className="text-sm text-gray-500">
              Enquanto isso, você pode realizar seu pré-cadastro:
            </p>
            <Button asChild size="lg" className="w-full">
              <Link to="/curriculo">
                Pré-Cadastro de Servidores
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Link
              to="/auth"
              className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1"
            >
              <Lock className="h-3 w-3" />
              Acesso Administrativo
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Instituto de Desenvolvimento da Juventude de Roraima
      </p>
    </div>
  );
};

export default EmBrevePage;
