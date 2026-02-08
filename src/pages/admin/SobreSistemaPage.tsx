import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Mail, Shield, Server, Database, Layout } from "lucide-react";
import logoTwoSolucoes from "@/assets/logo-two-solucoes.png";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";

export default function SobreSistemaPage() {
  const { nomeOficial, nomeCurto } = useDadosOficiais();

  return (
    <ModuleLayout module="admin">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header institucional */}
        <div className="text-center space-y-4">
          <LogoIdjuv className="h-16 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{nomeCurto}</h1>
            <p className="text-muted-foreground">{nomeOficial}</p>
          </div>
        </div>

        {/* Card principal */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Info className="h-5 w-5" />
              Sobre o Sistema
            </CardTitle>
            <CardDescription>
              Sistema de Gestão Institucional
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
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Recursos Humanos</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Folha de Pagamento</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Frequência</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Governança</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Transparência</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Processos</span>
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
                <Badge variant="outline" className="text-xs">
                  Desenvolvido por Two Soluções
                </Badge>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a 
                    href="mailto:solucoestwo@gmail.com" 
                    className="hover:text-foreground transition-colors"
                  >
                    solucoestwo@gmail.com
                  </a>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Suporte técnico disponível por e-mail
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Versão */}
        <p className="text-center text-xs text-muted-foreground/50">
          Versão 1.0.0 • {new Date().getFullYear()}
        </p>
      </div>
    </ModuleLayout>
  );
}
