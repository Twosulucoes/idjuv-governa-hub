/**
 * Prazos por etapa (P2, migração 20261122090000): quantos dias o sistema sugere para a próxima ação de cada etapa e a
 * partir de quantos dias sem movimento o processo conta como parado (o aviso de parado é da P3). Só quem edita
 * processos grava (policy de compras_etapa_parametros); Encerrado e Cancelado não pedem próxima ação e ficam de fora.
 * P3 (migração 20261128090000): também os avisos padrão de cada tipo de prazo (dias antes; o de 1 dia sempre fica),
 * em compras_prazo_tipos. Prazo já lançado guarda os avisos dele.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useParametrosEtapa, useSalvarParametrosEtapa } from "@/hooks/useProcessosContratacao";
import { useSalvarTiposPrazo, useTiposPrazo } from "@/hooks/useProcessoPrazos";
import { lerAvisos, rotuloTipoPrazo, textoAvisos, TIPOS_PRAZO } from "@/lib/compras/prazos";
import { exigeProximaAcao, PARAMETROS_PADRAO, type ParametroEtapa } from "@/lib/compras/proximaAcao";
import { ETAPAS_PROCESSO } from "@/types/processos";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Linha = { etapa: string; rotulo: string; dias_prazo: string; dias_limite_parado: string };

const valido = (v: string) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 365;

export function PrazosPorEtapaDialog({ open, onOpenChange }: Props) {
  const parametros = useParametrosEtapa();
  const salvar = useSalvarParametrosEtapa();
  const tipos = useTiposPrazo();
  const salvarTipos = useSalvarTiposPrazo();
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [avisos, setAvisos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || tipos.isLoading) return;
    setAvisos(Object.fromEntries(TIPOS_PRAZO.map((t) => [t.value, textoAvisos(tipos.data?.find((x) => x.tipo === t.value)?.avisos_padrao)])));
  }, [open, tipos.isLoading, tipos.data]);

  useEffect(() => {
    if (!open || parametros.isLoading) return;
    setLinhas(
      ETAPAS_PROCESSO.filter((e) => exigeProximaAcao(e.value)).map((e) => {
        const p = parametros.data?.find((x) => x.etapa === e.value) ?? { etapa: e.value, ...PARAMETROS_PADRAO[e.value] };
        return { etapa: e.value, rotulo: e.label, dias_prazo: String(p.dias_prazo), dias_limite_parado: String(p.dias_limite_parado) };
      }),
    );
  }, [open, parametros.isLoading, parametros.data]);

  const mudar = (etapa: string, campo: "dias_prazo" | "dias_limite_parado", valor: string) =>
    setLinhas((ls) => ls.map((l) => (l.etapa === etapa ? { ...l, [campo]: valor } : l)));

  const avisosValidos = Object.values(avisos).every((v) => lerAvisos(v) !== null);
  const tudoValido = linhas.length > 0 && avisosValidos
    && linhas.every((l) => valido(l.dias_prazo) && valido(l.dias_limite_parado));

  const gravar = async () => {
    if (!tudoValido) return;
    const mudadas: ParametroEtapa[] = linhas
      .map((l) => ({ etapa: l.etapa, dias_prazo: Number(l.dias_prazo), dias_limite_parado: Number(l.dias_limite_parado) }))
      .filter((l) => {
        const antes = parametros.data?.find((x) => x.etapa === l.etapa);
        return !antes || antes.dias_prazo !== l.dias_prazo || antes.dias_limite_parado !== l.dias_limite_parado;
      });
    const tiposMudados = (tipos.data ?? [])
      .map((t) => ({ tipo: t.tipo, avisos_padrao: lerAvisos(avisos[t.tipo] ?? "") ?? t.avisos_padrao, antes: t.avisos_padrao }))
      .filter((t) => textoAvisos(t.avisos_padrao) !== textoAvisos(t.antes))
      .map(({ tipo, avisos_padrao }) => ({ tipo, avisos_padrao }));
    try {
      if (mudadas.length) await salvar.mutateAsync(mudadas);
      if (tiposMudados.length) await salvarTipos.mutateAsync(tiposMudados);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prazos e avisos</DialogTitle>
          <DialogDescription>
            O prazo é o que o sistema sugere para a próxima ação ao registrar uma movimentação (dá para mudar em cada
            uma). "Parado" é a partir de quantos dias sem movimento o processo vai aparecer como parado.
          </DialogDescription>
        </DialogHeader>
        {parametros.isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead className="w-28 text-right">Prazo (dias)</TableHead>
                <TableHead className="w-28 text-right">Parado (dias)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.etapa}>
                  <TableCell>{l.rotulo}</TableCell>
                  <TableCell>
                    <Input
                      type="number" inputMode="numeric" min={1} max={365} className="text-right"
                      aria-label={`Prazo de ${l.rotulo} em dias`} aria-invalid={!valido(l.dias_prazo)}
                      value={l.dias_prazo} onChange={(e) => mudar(l.etapa, "dias_prazo", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" inputMode="numeric" min={1} max={365} className="text-right"
                      aria-label={`Dias até ${l.rotulo} contar como parado`} aria-invalid={!valido(l.dias_limite_parado)}
                      value={l.dias_limite_parado} onChange={(e) => mudar(l.etapa, "dias_limite_parado", e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <h3 className="pt-2 text-sm font-semibold">Avisos por tipo de prazo</h3>
        <p className="text-sm text-muted-foreground">
          Quantos dias antes o responsável é avisado, separados por vírgula. O aviso de 1 dia antes sempre fica. Vale
          para os prazos lançados daqui em diante.
        </p>
        {tipos.isLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-40">Avisar (dias antes)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TIPOS_PRAZO.map((t) => (
                <TableRow key={t.value}>
                  <TableCell>{rotuloTipoPrazo(t.value)}</TableCell>
                  <TableCell>
                    <Input
                      inputMode="numeric" aria-label={`Avisos de ${t.label}`}
                      aria-invalid={lerAvisos(avisos[t.value] ?? "") === null}
                      value={avisos[t.value] ?? ""}
                      onChange={(e) => setAvisos((a) => ({ ...a, [t.value]: e.target.value }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!tudoValido && linhas.length > 0 && (
          <p role="alert" className="text-sm text-destructive">Use números de 1 a 365 dias.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={gravar} disabled={!tudoValido || salvar.isPending || salvarTipos.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
