/**
 * Trilha de auditoria do RH (/rh/auditoria): o mesmo componente de /admin/auditoria, travado no módulo rh.
 * Rota protegida por `rh.auditoria.visualizar`; a RLS de audit_logs (policy audit_logs_rh_auditoria_select) só
 * devolve as linhas do módulo rh a quem tem o módulo e a permissão.
 */

import { ModuleLayout } from "@/components/layout";
import { PageHeader } from "@/components/design-system";
import { TrilhaAuditoria } from "@/components/auditoria/TrilhaAuditoria";

export default function AuditoriaRHPage() {
  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Recursos Humanos", href: "/rh" }, { rotulo: "Trilha de auditoria" }]}
          titulo="Trilha de auditoria do RH"
          descricao="Quem lançou, alterou, excluiu, visualizou, imprimiu ou exportou dados do RH e da folha"
        />
        <TrilhaAuditoria moduloFixo="rh" exportavel rotulo="Registros da trilha do RH" />
      </div>
    </ModuleLayout>
  );
}
