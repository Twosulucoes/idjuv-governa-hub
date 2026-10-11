/**
 * Aba "Histórico de alterações": a trilha de auditoria recortada para uma ficha.
 *  - servidor: a ficha em `servidores` e as tabelas ligadas ao servidor (vínculos, lotações, férias, licenças,
 *    viagens, frequência, documentos, fichas financeiras...), além das visualizações e impressões registradas;
 *  - folha: a folha, as fichas, as remessas, os eventos do eSocial e as exportações da folha.
 * Só aparece para quem tem `rh.auditoria.visualizar` (ou é admin) — quem decide o que volta é a RLS de audit_logs.
 */

import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrilhaAuditoria } from "@/components/auditoria/TrilhaAuditoria";
import type { EscopoTrilha } from "@/hooks/useTrilhaAuditoria";

interface HistoricoAlteracoesTabProps {
  escopo: EscopoTrilha;
}

export function HistoricoAlteracoesTab({ escopo }: HistoricoAlteracoesTabProps) {
  const chave = escopo.tipo === "servidor" ? `servidor-${escopo.servidorId}` : `folha-${escopo.folhaId}`;
  const descricao =
    escopo.tipo === "servidor"
      ? "Quem incluiu, alterou, excluiu, visualizou ou imprimiu dados deste servidor, com o antes e o depois de cada campo."
      : "Quem processou, alterou ou gerou arquivos desta folha (fichas, remessas CNAB e eventos do eSocial).";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" aria-hidden="true" />
          Histórico de alterações
        </CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        <TrilhaAuditoria key={chave} escopo={escopo} compacta rotulo="Histórico de alterações" />
      </CardContent>
    </Card>
  );
}
