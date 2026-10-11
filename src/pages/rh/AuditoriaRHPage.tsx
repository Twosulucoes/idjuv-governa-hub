/**
 * Trilha de auditoria do RH (/rh/auditoria): o mesmo componente de /admin/auditoria, travado no módulo rh.
 * Rota protegida por `rh.auditoria.visualizar`; a RLS de audit_logs (policy audit_logs_rh_auditoria_select) só
 * devolve as linhas do módulo rh a quem tem o módulo e a permissão.
 *
 * Aba "Lançamento por setor" (regra de setor, fase 1): quem seria bloqueado (trilha com fundamento negado) e o
 * saneamento do cadastro (RPC saneamento_lancamento, que exige a mesma permissão ou o papel admin).
 */

import { ModuleLayout } from "@/components/layout";
import { PageHeader } from "@/components/design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrilhaAuditoria } from "@/components/auditoria/TrilhaAuditoria";
import { RelatorioLancamentoSetor } from "@/components/lancamento-setor/RelatorioLancamentoSetor";

export default function AuditoriaRHPage() {
  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Recursos Humanos", href: "/rh" }, { rotulo: "Trilha de auditoria" }]}
          titulo="Trilha de auditoria do RH"
          descricao="Quem lançou, alterou, excluiu, visualizou, imprimiu ou exportou dados do RH e da folha"
        />
        <Tabs defaultValue="trilha" className="space-y-4">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="trilha">Trilha</TabsTrigger>
            <TabsTrigger value="setor">Lançamento por setor</TabsTrigger>
          </TabsList>
          <TabsContent value="trilha">
            <TrilhaAuditoria moduloFixo="rh" exportavel rotulo="Registros da trilha do RH" />
          </TabsContent>
          <TabsContent value="setor">
            <RelatorioLancamentoSetor moduloFixo="rh" />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
