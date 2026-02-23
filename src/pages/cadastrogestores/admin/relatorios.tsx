/**
 * Página de Relatórios de Gestores Escolares
 * Rota: /cadastrogestores/admin/relatorios
 * 
 * 100% isolada — não altera nenhum arquivo existente
 * Usa ModuleLayout existente apenas como import (sem alteração)
 */

import { ModuleLayout } from '@/components/layout';
import RelatoriosContainer from '@/components/relatorios/RelatoriosContainer';

export default function RelatoriosAdminGestoresPage() {
  return (
    <ModuleLayout module="gestores_escolares">
      <RelatoriosContainer />
    </ModuleLayout>
  );
}
