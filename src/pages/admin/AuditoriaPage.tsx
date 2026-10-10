// ============================================
// PÁGINA DE AUDITORIA (todos os módulos)
// ============================================
// Trilha de auditoria (audit_logs) com filtros e paginação no servidor, servidor responsável e origem de cada
// registro e diff ao abrir a linha. A visão do RH (/rh/auditoria) usa o mesmo componente, travado no módulo rh.

import { ModuleLayout } from '@/components/layout';
import { PageHeader } from '@/components/design-system';
import { TrilhaAuditoria } from '@/components/auditoria/TrilhaAuditoria';

export default function AuditoriaPage() {
  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Auditoria" }]}
          titulo="Auditoria"
          descricao="Trilha de quem fez cada lançamento, alteração, exclusão, visualização e exportação no sistema"
        />
        <TrilhaAuditoria exportavel />
      </div>
    </ModuleLayout>
  );
}
