/**
 * Lista "O que mudou" dos convênios federais: as mudanças que a rotina achou entre uma carga do Transferegov e a
 * anterior (fin_tg_mudancas), agrupadas pelo dia da carga. Usada na lista (todas) e na ficha (só da proposta).
 */

import { History } from "lucide-react";
import { EmptyState } from "@/components/design-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMudancasConveniosFederais, type MudancaFederal } from "@/hooks/useConveniosFederais";
import { descreverMudanca } from "@/lib/financeiro/conveniosFederais";

function agruparPorDia(lista: MudancaFederal[]) {
  const grupos = new Map<string, MudancaFederal[]>();
  for (const m of lista) {
    const dia = new Date(m.registrada_em).toLocaleDateString("pt-BR");
    grupos.set(dia, [...(grupos.get(dia) ?? []), m]);
  }
  return [...grupos.entries()];
}

export function MudancasConvenios({ idProposta, titulo = "O que mudou no Transferegov" }: { idProposta?: number; titulo?: string }) {
  const consulta = useMudancasConveniosFederais(idProposta);
  const lista = consulta.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {consulta.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : consulta.isError ? (
          <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p>
        ) : lista.length === 0 ? (
          <EmptyState
            icone={History}
            titulo="Nada mudou ainda"
            descricao="Cada carga diária é comparada com a anterior; as mudanças aparecem aqui."
            className="py-6"
          />
        ) : (
          <ol className="space-y-4">
            {agruparPorDia(lista).map(([dia, itens]) => (
              <li key={dia}>
                <p className="text-xs font-medium text-muted-foreground">Carga de {dia}</p>
                <ul className="mt-1 space-y-1">
                  {itens.map((m) => (
                    <li key={m.id} className="text-sm">
                      {descreverMudanca(m)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
