import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Home, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import logoIdjuv from "@/assets/logo-idjuv-oficial.png";

export default function MiniCurriculoSucessoPage() {
  const location = useLocation();
  const codigo = location.state?.codigo || "PC-0000-0000";

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigo);
    toast.success("Código copiado para a área de transferência!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <img src={logoIdjuv} alt="IDJUV" className="h-12 bg-white rounded p-1" />
            <div>
              <h1 className="font-bold text-lg">Pré-Cadastro de Servidor</h1>
              <p className="text-sm opacity-90">
                Instituto de Desporto, Juventude e Lazer
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">
                Pré-Cadastro Enviado com Sucesso!
              </h1>
              <p className="text-muted-foreground">
                Seu formulário foi recebido e será analisado pela equipe de Recursos
                Humanos do IDJUV.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Seu código de acesso:</p>
              <div className="flex items-center justify-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-xl font-mono py-2 px-4"
                >
                  {codigo}
                </Badge>
                <Button variant="ghost" size="icon" onClick={copiarCodigo}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Guarde este código para acompanhar ou editar seu cadastro.
              </p>
            </div>

            <div className="p-4 border rounded-lg text-left space-y-2">
              <h3 className="font-medium">Próximos Passos:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Sua documentação será analisada pela equipe de RH</li>
                <li>Você poderá ser contatado para apresentar documentos originais</li>
                <li>Após aprovação, seu cadastro será convertido para servidor</li>
                <li>
                  Você pode acessar seu formulário a qualquer momento usando o código
                  acima
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="outline" asChild>
                <Link to={`/curriculo/${codigo}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Meu Cadastro
                </Link>
              </Button>
              <Button asChild>
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Página Inicial
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="container max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Em caso de dúvidas, entre em contato com o setor de Recursos Humanos do
            IDJUV.
          </p>
        </div>
      </footer>
    </div>
  );
}
