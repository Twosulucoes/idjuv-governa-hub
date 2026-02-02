import { AdminLayout } from "@/components/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Calendar, ArrowLeft, FileText, Calculator, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Página de bloqueio do módulo de Folha de Pagamento.
 * 
 * DÉBITO TÉCNICO - FASE FUTURA
 * 
 * Este módulo foi desenvolvido tecnicamente mas está DESATIVADO para a FASE 3.
 * 
 * Implementações existentes (não operacionais):
 * - src/lib/folhaCalculos.ts - Motor de cálculo INSS/IRRF progressivo
 * - src/hooks/useFolhaPagamento.ts - Hooks para fichas financeiras
 * - src/components/folha/* - Componentes de UI para folha
 * - src/lib/pdfContracheque.ts - Geração de contracheques PDF
 * - src/lib/cnabGenerator.ts - Geração de remessas bancárias
 * - src/lib/esocialGenerator.ts - Eventos e-Social
 * 
 * Tabelas no banco (sem dados operacionais):
 * - folhas_pagamento, fichas_financeiras, itens_ficha_financeira
 * - rubricas, consignacoes, dependentes_irrf
 * - tabela_inss, tabela_irrf, bancos_cnab
 * - remessas_bancarias, eventos_esocial
 * 
 * Para ativar: remover redirecionamento em App.tsx e restaurar menu em adminMenu.ts
 */
export default function FolhaBloqueadaPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Card className="max-w-2xl w-full border-dashed border-2 border-muted-foreground/30">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 rounded-full bg-muted">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex justify-center gap-2 mb-2">
              <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
                Fase Futura
              </Badge>
              <Badge variant="secondary">
                Não Operacional
              </Badge>
            </div>
            <CardTitle className="text-2xl">Módulo de Folha de Pagamento</CardTitle>
            <CardDescription className="text-base mt-2">
              Este módulo está desativado na fase atual do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Escopo da Fase 3 - IDJuv
              </h4>
              <p className="text-sm text-muted-foreground">
                A Fase 3 contempla exclusivamente o <strong>RH administrativo</strong>: gestão de servidores, 
                atos de pessoal, portarias e processos administrativos.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Sem cálculo de remuneração ou tributos</li>
                <li>Sem geração de CNAB ou e-Social</li>
                <li>Sem efeitos financeiros automatizados</li>
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted/30">
                <Calculator className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">Cálculos</p>
                <p className="text-xs font-medium">Desativado</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">CNAB/e-Social</p>
                <p className="text-xs font-medium">Desativado</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <Building2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">Rubricas</p>
                <p className="text-xs font-medium">Desativado</p>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate("/admin")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center max-w-md">
          A infraestrutura técnica do módulo está implementada e documentada como débito técnico 
          para ativação em fases futuras do projeto.
        </p>
      </div>
    </AdminLayout>
  );
}
