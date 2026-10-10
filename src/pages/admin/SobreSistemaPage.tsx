import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Mail, Shield, Server, Database, Layout } from "lucide-react";
import logoTwoSolucoes from "@/assets/logo-two-solucoes.png";
import { Logo } from "@/components/ui/Logo";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";
import { PageHeader } from "@/components/design-system";

export default function SobreSistemaPage() {
  const { nomeOficial, nomeCurto } = useDadosOficiais();

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        {/* Header institucional */}
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Sobre o sistema" }]}
          midia={<Logo className="h-16" />}
          titulo={nomeCurto}
          descricao={nomeOficial}
        />

        {/* Card principal */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Info className="h-5 w-5" aria-hidden="true" />
              Sobre o sistema
            </CardTitle>
            <CardDescription>
              Sistema de gestão institucional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Descrição */}
            <div className="text-center space-y-4 py-4">
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Este sistema foi desenvolvido pela Two Soluções para atender às 
                necessidades operacionais do {nomeCurto}, contemplando módulos de 
                gestão de pessoas, folha de pagamento, frequência, governança, 
                transparência e processos administrativos.
              </p>
            </div>

            <Separator />

            {/* Módulos */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-body">Recursos Humanos</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Layout className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-body">Folha de Pagamento</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Server className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-body">Frequência</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-body">Governança</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-body">Transparência</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-body">Processos</span>
              </div>
            </div>

            <Separator />

            {/* Desenvolvedor */}
            <div className="flex flex-col items-center gap-4 py-6">
              <img 
                src={logoTwoSolucoes} 
                alt="Two Soluções" 
                className="h-12 w-auto"
              />
              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-caption">
                  Desenvolvido por Two Soluções
                </Badge>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <a 
                    href="mailto:solucoestwo@gmail.com" 
                    className="hover:text-foreground transition-colors"
                  >
                    solucoestwo@gmail.com
                  </a>
                </div>
                <p className="text-caption text-muted-foreground">
                  Suporte técnico disponível por e-mail
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Versão */}
        <p className="text-center text-caption text-muted-foreground">
          Versão 1.0.0 • {new Date().getFullYear()}
        </p>
      </div>
    </ModuleLayout>
  );
}
