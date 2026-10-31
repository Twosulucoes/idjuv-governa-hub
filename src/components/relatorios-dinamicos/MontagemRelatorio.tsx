/**
 * Etapas do Gerador de relatórios: fonte, título, colunas (com a ordem), filtros, agrupamento, totais e ordem.
 * Componente controlado: tudo vira uma ConfigRelatorio nova a cada mudança.
 */

import { ArrowDown, ArrowUp } from "lucide-react";
import { BarraFiltros } from "@/components/design-system";
import type { EstadoFiltros, FiltroDef } from "@/components/design-system/filtros/logica";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MAX_AGRUPAMENTOS,
  ROTULO_FUNCAO_TOTAL,
  type ConfigRelatorio,
  type FonteRelatorio,
  type FuncaoTotal,
  type Orientacao,
} from "@/lib/relatoriosDinamicos/tipos";

const NENHUM = "__nenhum__";

function Etapa({ numero, titulo, children, id }: { numero: number; titulo: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="space-y-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <h3 id={id} className="flex items-center gap-2 text-body font-semibold text-foreground">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground">
          {numero}
        </span>
        {titulo}
      </h3>
      {children}
    </section>
  );
}

interface MontagemRelatorioProps {
  fontes: FonteRelatorio<unknown>[];
  fonte: FonteRelatorio<unknown>;
  aoTrocarFonte: (id: string) => void;
  config: ConfigRelatorio;
  aoMudar: (config: ConfigRelatorio) => void;
  definicoesFiltro: FiltroDef<unknown>[];
  linhas: unknown[];
}

export function MontagemRelatorio({ fontes, fonte, aoTrocarFonte, config, aoMudar, definicoesFiltro, linhas }: MontagemRelatorioProps) {
  const mudar = (parcial: Partial<ConfigRelatorio>) => aoMudar({ ...config, ...parcial });
  const porId = new Map(fonte.colunas.map((c) => [c.id, c]));
  const selecionadas = config.colunas.filter((id) => porId.has(id));
  const naoSelecionadas = fonte.colunas.filter((c) => !selecionadas.includes(c.id));
  const agrupaveis = fonte.colunas.filter((c) => c.agrupavel);
  const numericas = selecionadas.map((id) => porId.get(id)!).filter((c) => c.tipo === "moeda" || c.tipo === "numero");

  const alternarColuna = (id: string, marcar: boolean) => {
    const colunas = marcar ? [...selecionadas, id] : selecionadas.filter((x) => x !== id);
    const totais = { ...config.totais };
    if (!marcar) delete totais[id];
    else if (porId.get(id)?.tipo === "moeda") totais[id] = "soma";
    mudar({ colunas, totais });
  };
  const mover = (indice: number, delta: -1 | 1) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= selecionadas.length) return;
    const colunas = [...selecionadas];
    [colunas[indice], colunas[destino]] = [colunas[destino], colunas[indice]];
    mudar({ colunas });
  };
  const definirAgrupamento = (nivel: number, id: string) => {
    const atual = [...config.agrupamentos];
    if (id === NENHUM) atual.splice(nivel);
    else atual[nivel] = id;
    mudar({ agrupamentos: [...new Set(atual.filter(Boolean))].slice(0, MAX_AGRUPAMENTOS) });
  };
  const definirTotal = (id: string, f: string) => {
    const totais = { ...config.totais };
    if (f === NENHUM) delete totais[id];
    else totais[id] = f as FuncaoTotal;
    mudar({ totais });
  };

  return (
    <div className="space-y-5">
      <Etapa numero={1} titulo="De onde vêm os dados" id="etapa-fonte">
        <Select value={fonte.id} onValueChange={aoTrocarFonte}>
          <SelectTrigger aria-label="Fonte dos dados">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontes.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-caption text-muted-foreground">{fonte.descricao}</p>
        <div className="space-y-1.5">
          <Label htmlFor="titulo-relatorio">Título do relatório</Label>
          <Input
            id="titulo-relatorio"
            value={config.titulo}
            maxLength={150}
            onChange={(e) => mudar({ titulo: e.target.value })}
          />
        </div>
      </Etapa>

      <Etapa numero={2} titulo="Colunas" id="etapa-colunas">
        {selecionadas.length === 0 && <p className="text-caption text-destructive">Marque ao menos uma coluna.</p>}
        <ol className="space-y-1" aria-label="Colunas do relatório, na ordem de impressão">
          {selecionadas.map((id, i) => {
            const c = porId.get(id)!;
            return (
              <li key={id} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-0.5">
                <Checkbox id={`col-${id}`} checked onCheckedChange={() => alternarColuna(id, false)} />
                <Label htmlFor={`col-${id}`} className="flex-1 cursor-pointer text-body font-normal">
                  {c.rotulo}
                </Label>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`Subir ${c.rotulo}`}>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === selecionadas.length - 1}
                  onClick={() => mover(i, 1)}
                  aria-label={`Descer ${c.rotulo}`}
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ol>
        {naoSelecionadas.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {naoSelecionadas.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-2">
                <Checkbox id={`col-${c.id}`} checked={false} onCheckedChange={() => alternarColuna(c.id, true)} />
                <Label htmlFor={`col-${c.id}`} className="cursor-pointer text-body font-normal text-muted-foreground">
                  {c.rotulo}
                </Label>
              </div>
            ))}
          </div>
        )}
      </Etapa>

      <Etapa numero={3} titulo="Filtros" id="etapa-filtros">
        {definicoesFiltro.length > 0 ? (
          <BarraFiltros
            filtros={definicoesFiltro}
            dados={linhas}
            estado={config.filtros as EstadoFiltros}
            aoMudar={(filtros) => mudar({ filtros })}
          />
        ) : (
          <p className="text-caption text-muted-foreground">Esta fonte não tem filtros.</p>
        )}
      </Etapa>

      <Etapa numero={4} titulo="Agrupar" id="etapa-agrupar">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {Array.from({ length: MAX_AGRUPAMENTOS }, (_, nivel) => {
            const habilitado = nivel === 0 || Boolean(config.agrupamentos[nivel - 1]);
            return (
              <div key={nivel} className="space-y-1.5">
                <Label>{nivel === 0 ? "Agrupar por" : "Depois por"}</Label>
                <Select value={config.agrupamentos[nivel] ?? NENHUM} onValueChange={(v) => definirAgrupamento(nivel, v)} disabled={!habilitado}>
                  <SelectTrigger aria-label={nivel === 0 ? "Agrupar por" : "Depois agrupar por"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUM}>Sem agrupamento</SelectItem>
                    {agrupaveis
                      .filter((c) => !config.agrupamentos.slice(0, nivel).includes(c.id))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.rotulo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </Etapa>

      <Etapa numero={5} titulo="Totais" id="etapa-totais">
        {numericas.length === 0 ? (
          <p className="text-caption text-muted-foreground">Marque uma coluna de valor para ter total. A quantidade de registros sai sempre.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {numericas.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <Label>{c.rotulo}</Label>
                <Select value={config.totais[c.id] ?? NENHUM} onValueChange={(v) => definirTotal(c.id, v)}>
                  <SelectTrigger aria-label={`Total de ${c.rotulo}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUM}>Sem total</SelectItem>
                    {(Object.keys(ROTULO_FUNCAO_TOTAL) as FuncaoTotal[]).map((f) => (
                      <SelectItem key={f} value={f}>
                        {ROTULO_FUNCAO_TOTAL[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </Etapa>

      <Etapa numero={6} titulo="Ordem e página" id="etapa-ordem">
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Ordenar por</Label>
            <Select
              value={config.ordenacao?.coluna ?? NENHUM}
              onValueChange={(v) => mudar({ ordenacao: v === NENHUM ? null : { coluna: v, direcao: config.ordenacao?.direcao ?? "asc" } })}
            >
              <SelectTrigger aria-label="Ordenar por">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>Como vem da fonte</SelectItem>
                {fonte.colunas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sentido</Label>
            <Select
              value={config.ordenacao?.direcao ?? "asc"}
              disabled={!config.ordenacao}
              onValueChange={(v) => config.ordenacao && mudar({ ordenacao: { ...config.ordenacao, direcao: v as "asc" | "desc" } })}
            >
              <SelectTrigger aria-label="Sentido da ordem">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Crescente (A→Z, menor primeiro)</SelectItem>
                <SelectItem value="desc">Decrescente (Z→A, maior primeiro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Folha do PDF</Label>
            <Select value={config.orientacao} onValueChange={(v) => mudar({ orientacao: v as Orientacao })}>
              <SelectTrigger aria-label="Orientação da folha do PDF">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática (deita com mais de 6 colunas)</SelectItem>
                <SelectItem value="retrato">Em pé (retrato)</SelectItem>
                <SelectItem value="paisagem">Deitada (paisagem)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Etapa>
    </div>
  );
}
