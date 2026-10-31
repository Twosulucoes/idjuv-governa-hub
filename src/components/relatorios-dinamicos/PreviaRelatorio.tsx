/**
 * Prévia do relatório montado: a mesma tabela que sai no PDF (grupos com título e subtotal, total geral no fim).
 * Mostra até LIMITE_PREVIA linhas de dados; o PDF e a planilha levam todas.
 */

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarValor } from "@/lib/relatoriosDinamicos/formatar";
import type { ColunaFonte, GrupoResultado, ResultadoRelatorio } from "@/lib/relatoriosDinamicos/tipos";
import { cn } from "@/lib/utils";

export const LIMITE_PREVIA = 300;

type LinhaPrevia<T> =
  | { tipo: "grupo"; chave: string; rotulo: string; nivel: number }
  | { tipo: "dado"; chave: string; linha: T }
  | { tipo: "subtotal"; chave: string; rotulo: string; totais: Record<string, number | null>; nivel: number };

const numerica = (c: ColunaFonte<unknown>) => c.tipo === "moeda" || c.tipo === "numero";

function achatar<T>(grupos: GrupoResultado<T>[], caminho: string[], saida: LinhaPrevia<T>[], cota: { resta: number }) {
  grupos.forEach((g, i) => {
    const chave = [...caminho, String(i)].join(".");
    saida.push({ tipo: "grupo", chave: `g${chave}`, rotulo: `${g.rotulo} (${g.quantidade})`, nivel: caminho.length });
    if (g.subgrupos.length > 0) achatar(g.subgrupos, [...caminho, String(i)], saida, cota);
    else
      for (const [k, l] of g.linhas.entries()) {
        if (cota.resta <= 0) break;
        cota.resta -= 1;
        saida.push({ tipo: "dado", chave: `d${chave}.${k}`, linha: l });
      }
    saida.push({ tipo: "subtotal", chave: `s${chave}`, rotulo: `Subtotal de ${g.rotulo}`, totais: g.totais, nivel: caminho.length });
  });
}

interface PreviaRelatorioProps<T> {
  resultado: ResultadoRelatorio<T>;
}

export function PreviaRelatorio<T>({ resultado }: PreviaRelatorioProps<T>) {
  const { colunas } = resultado;
  const linhas: LinhaPrevia<T>[] = [];
  const cota = { resta: LIMITE_PREVIA };
  if (resultado.grupos) achatar(resultado.grupos, [], linhas, cota);
  else resultado.linhas.slice(0, LIMITE_PREVIA).forEach((l, i) => linhas.push({ tipo: "dado", chave: `d${i}`, linha: l }));
  const cortado = resultado.quantidade > LIMITE_PREVIA;
  const temTotais = Object.keys(resultado.totais).length > 0;

  const celulasTotais = (totais: Record<string, number | null>, rotulo: string) =>
    colunas.map((c, i) => (
      <TableCell key={c.id} className={cn("font-semibold", numerica(c as ColunaFonte<unknown>) && "text-right tabular-nums")}>
        {c.id in totais ? formatarValor(totais[c.id], c.tipo) : i === 0 ? rotulo : ""}
      </TableCell>
    ));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {colunas.map((c) => (
                <TableHead key={c.id} scope="col" className={cn("whitespace-nowrap", numerica(c as ColunaFonte<unknown>) && "text-right")}>
                  {c.rotulo}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((l) => {
              if (l.tipo === "grupo")
                return (
                  <TableRow key={l.chave} className="bg-muted/60 hover:bg-muted/60">
                    <TableCell colSpan={colunas.length} className={cn("font-semibold text-foreground", l.nivel > 0 && "pl-8")}>
                      {l.rotulo}
                    </TableCell>
                  </TableRow>
                );
              if (l.tipo === "subtotal")
                return (
                  <TableRow key={l.chave} className="border-b-2 hover:bg-transparent">
                    {celulasTotais(l.totais, l.rotulo)}
                  </TableRow>
                );
              return (
                <TableRow key={l.chave}>
                  {colunas.map((c) => (
                    <TableCell
                      key={c.id}
                      className={cn(
                        "align-top",
                        numerica(c as ColunaFonte<unknown>) ? "whitespace-nowrap text-right tabular-nums" : "max-w-[22rem]",
                      )}
                    >
                      {formatarValor(c.valor(l.linha), c.tipo)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
          {temTotais && (
            <TableFooter>
              <TableRow>{celulasTotais(resultado.totais, `Total geral (${resultado.quantidade})`)}</TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      {cortado && (
        <p className="text-caption text-muted-foreground">
          A prévia mostra as primeiras {LIMITE_PREVIA} linhas de {resultado.quantidade.toLocaleString("pt-BR")}. O PDF e a
          planilha levam todas; subtotais e total já contam todas.
        </p>
      )}
    </div>
  );
}
