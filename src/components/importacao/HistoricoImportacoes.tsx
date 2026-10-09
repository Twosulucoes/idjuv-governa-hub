/** Histórico das importações aplicadas (as que a RLS deixa o usuário ver). */

import { History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHistoricoImportacoes } from "@/hooks/useImportacoes";
import { obterImportador } from "@/lib/importacao/registro";

export function HistoricoImportacoes({ tipo }: { tipo?: string }) {
  const { data, isLoading, error } = useHistoricoImportacoes(tipo);

  if (isLoading) return <Skeleton className="h-32" />;
  if (error) return <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p>;
  if (!data?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <History className="h-8 w-8 opacity-50" aria-hidden />
        Nenhuma importação registrada ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead>Quando</TableHead>
            <TableHead>Importador</TableHead>
            <TableHead>Arquivo</TableHead>
            <TableHead>Por</TableHead>
            <TableHead className="text-right">Novas</TableHead>
            <TableHead className="text-right">Atualizadas</TableHead>
            <TableHead className="text-right">Sem mudança</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id} className="text-xs">
              <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
              <TableCell>
                {obterImportador(r.tipo)?.titulo ?? r.tipo}
                {r.exercicio ? ` · ${r.exercicio}` : ""}
              </TableCell>
              <TableCell className="max-w-[220px] truncate" title={r.arquivo_nome}>
                {r.arquivo_nome}
              </TableCell>
              <TableCell>{r.autor?.full_name ?? "—"}</TableCell>
              <TableCell className="text-right font-mono">{r.resumo.totais?.inserir ?? 0}</TableCell>
              <TableCell className="text-right font-mono">{r.resumo.totais?.atualizar ?? 0}</TableCell>
              <TableCell className="text-right font-mono">{r.resumo.totais?.sem_alteracao ?? 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
