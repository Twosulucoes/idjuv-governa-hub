import * as React from "react";
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Rows3, Rows4, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EmptyState, type EmptyStateProps } from "@/components/design-system/EmptyState";
import { cn } from "@/lib/utils";

type ValorOrdenacao = string | number | Date | boolean | null | undefined;

export interface ColunaTabela<T> {
  id: string;
  cabecalho: React.ReactNode;
  celula: (linha: T) => React.ReactNode;
  /** Valor usado para ordenar. Sem ele, a coluna não é ordenável. */
  ordenarPor?: (linha: T) => ValorOrdenacao;
  /** Texto que entra na busca. Sem ele, a coluna não é pesquisada. */
  buscarPor?: (linha: T) => string | null | undefined;
  alinhamento?: "esquerda" | "direita" | "centro";
  className?: string;
  /** No cartão do celular: `titulo` vira o topo do cartão; `oculta` não aparece. */
  mobile?: "titulo" | "oculta";
}

export type Densidade = "confortavel" | "compacta";

export interface DataTableProps<T> {
  /** Nome da tabela para leitores de tela (ex.: "Servidores"). */
  rotulo: string;
  dados: T[];
  colunas: ColunaTabela<T>[];
  chaveLinha: (linha: T) => string;
  carregando?: boolean;
  /** Mensagem de erro; quando presente substitui a tabela. */
  erro?: string | null;
  aoTentarNovamente?: () => void;
  /** Estado vazio quando não há dados (sem busca ativa). */
  vazio?: EmptyStateProps;
  /** Mostra a busca nas colunas com `buscarPor`. */
  busca?: boolean | { placeholder?: string };
  /** Filtros extras ao lado da busca (selects, datas…). */
  filtros?: React.ReactNode;
  /** Ativa seleção de linhas e a barra de ações em lote. */
  acoesEmLote?: (selecionadas: T[], limpar: () => void) => React.ReactNode;
  /** Ações por linha (menu, botões), última coluna. */
  acoesLinha?: (linha: T) => React.ReactNode;
  aoClicarLinha?: (linha: T) => void;
  tamanhoPagina?: number;
  /** Altura máxima da área rolável (ex.: "70vh"). Com ela o cabeçalho fica fixo ao rolar a tabela. */
  alturaMaxima?: string;
  /** Densidade inicial; o usuário pode trocar e a escolha fica no navegador. */
  densidadePadrao?: Densidade;
  className?: string;
}

const CHAVE_DENSIDADE = "ds-tabela-densidade";

function lerDensidade(padrao: Densidade): Densidade {
  try {
    const v = window.localStorage.getItem(CHAVE_DENSIDADE);
    return v === "compacta" || v === "confortavel" ? v : padrao;
  } catch {
    return padrao;
  }
}

function salvarDensidade(d: Densidade) {
  try {
    window.localStorage.setItem(CHAVE_DENSIDADE, d);
  } catch {
    /* navegação privada: só não lembra */
  }
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function comparar(a: ValorOrdenacao, b: ValorOrdenacao): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" });
}

const ALINHAMENTO = { esquerda: "text-left", direita: "text-right", centro: "text-center" } as const;

/**
 * Tabela padrão do sistema: busca, ordenação, seleção com ações em lote,
 * paginação, densidade, estados de carregando/erro/vazio e cartões no celular.
 * Opera sobre os dados já carregados (paginação no cliente).
 */
export function DataTable<T>({
  rotulo,
  dados,
  colunas,
  chaveLinha,
  carregando = false,
  erro,
  aoTentarNovamente,
  vazio,
  busca,
  filtros,
  acoesEmLote,
  acoesLinha,
  aoClicarLinha,
  tamanhoPagina = 20,
  alturaMaxima,
  densidadePadrao = "confortavel",
  className,
}: DataTableProps<T>) {
  const [termo, setTermo] = React.useState("");
  const [ordem, setOrdem] = React.useState<{ id: string; direcao: "asc" | "desc" } | null>(null);
  const [pagina, setPagina] = React.useState(0);
  const [selecionadas, setSelecionadas] = React.useState<Set<string>>(() => new Set());
  const [densidade, setDensidade] = React.useState<Densidade>(() => lerDensidade(densidadePadrao));

  const selecionavel = Boolean(acoesEmLote);
  const colunasBusca = React.useMemo(() => colunas.filter((c) => c.buscarPor), [colunas]);
  const temBusca = Boolean(busca) && colunasBusca.length > 0;
  const placeholderBusca = typeof busca === "object" && busca.placeholder ? busca.placeholder : "Buscar…";

  const filtradas = React.useMemo(() => {
    const t = normalizar(termo.trim());
    if (!t) return dados;
    return dados.filter((linha) => colunasBusca.some((c) => normalizar(c.buscarPor!(linha) ?? "").includes(t)));
  }, [dados, termo, colunasBusca]);

  const ordenadas = React.useMemo(() => {
    const col = ordem && colunas.find((c) => c.id === ordem.id);
    if (!col?.ordenarPor) return filtradas;
    const fator = ordem!.direcao === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => fator * comparar(col.ordenarPor!(a), col.ordenarPor!(b)));
  }, [filtradas, ordem, colunas]);

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / tamanhoPagina));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = ordenadas.slice(paginaAtual * tamanhoPagina, (paginaAtual + 1) * tamanhoPagina);

  // Ações em lote valem só para o que está à vista após a busca.
  const linhasSelecionadas = React.useMemo(
    () => filtradas.filter((l) => selecionadas.has(chaveLinha(l))),
    [filtradas, selecionadas, chaveLinha],
  );

  // Dados recarregados: descarta seleção de linhas que sumiram e volta a
  // página para dentro do novo total.
  React.useEffect(() => {
    setSelecionadas((atual) => {
      if (atual.size === 0) return atual;
      const existentes = new Set(dados.map(chaveLinha));
      const podada = new Set([...atual].filter((k) => existentes.has(k)));
      return podada.size === atual.size ? atual : podada;
    });
  }, [dados, chaveLinha]);
  React.useEffect(() => {
    if (pagina !== paginaAtual) setPagina(paginaAtual);
  }, [pagina, paginaAtual]);
  const chavesVisiveis = visiveis.map(chaveLinha);
  const todasVisiveisMarcadas = chavesVisiveis.length > 0 && chavesVisiveis.every((k) => selecionadas.has(k));
  const algumaVisivelMarcada = chavesVisiveis.some((k) => selecionadas.has(k));

  const limparSelecao = React.useCallback(() => setSelecionadas(new Set()), []);

  function alternarLinha(chave: string, marcar: boolean) {
    setSelecionadas((atual) => {
      const nova = new Set(atual);
      if (marcar) nova.add(chave);
      else nova.delete(chave);
      return nova;
    });
  }

  function alternarPagina(marcar: boolean) {
    setSelecionadas((atual) => {
      const nova = new Set(atual);
      chavesVisiveis.forEach((k) => (marcar ? nova.add(k) : nova.delete(k)));
      return nova;
    });
  }

  function alternarOrdem(id: string) {
    setPagina(0);
    setOrdem((atual) => {
      if (atual?.id !== id) return { id, direcao: "asc" };
      if (atual.direcao === "asc") return { id, direcao: "desc" };
      return null;
    });
  }

  function trocarDensidade(valor: string) {
    if (valor !== "confortavel" && valor !== "compacta") return;
    setDensidade(valor);
    salvarDensidade(valor);
  }

  const celulaY = densidade === "compacta" ? "py-1.5" : "py-3";
  const colunaTitulo = colunas.find((c) => c.mobile === "titulo") ?? colunas[0];
  const colunasCartao = colunas.filter((c) => c !== colunaTitulo && c.mobile !== "oculta");

  // --- estados que substituem a tabela ------------------------------------
  let conteudo: React.ReactNode = null;
  if (erro) {
    conteudo = (
      <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-h3">Não foi possível carregar {rotulo.toLowerCase()}</p>
          <p className="text-body text-muted-foreground">{erro}</p>
        </div>
        {aoTentarNovamente && (
          <Button variant="outline" onClick={aoTentarNovamente}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  } else if (carregando) {
    conteudo = (
      <div className="space-y-2 p-4" aria-busy="true" aria-label={`Carregando ${rotulo.toLowerCase()}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  } else if (ordenadas.length === 0) {
    conteudo = termo.trim() ? (
      <EmptyState
        icone={Search}
        titulo="Nenhum resultado"
        descricao={`Nada encontrado para "${termo.trim()}".`}
        acao={
          <Button variant="outline" onClick={() => setTermo("")}>
            Limpar busca
          </Button>
        }
      />
    ) : (
      <EmptyState titulo={`Nenhum registro em ${rotulo.toLowerCase()}`} {...vazio} />
    );
  }

  return (
    <div className={cn("rounded-md border border-border bg-card", className)}>
      {/* Barra: busca, filtros, densidade */}
      {(temBusca || filtros || !conteudo) && (
        <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:flex-wrap sm:items-center">
          {temBusca && (
            <div className="relative sm:min-w-56 sm:max-w-xs sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={termo}
                onChange={(e) => {
                  setTermo(e.target.value);
                  setPagina(0);
                }}
                placeholder={placeholderBusca}
                aria-label={`Buscar em ${rotulo.toLowerCase()}`}
                className="pl-9"
              />
            </div>
          )}
          {filtros && <div className="flex flex-wrap items-center gap-2">{filtros}</div>}
          <ToggleGroup
            type="single"
            value={densidade}
            onValueChange={trocarDensidade}
            aria-label="Densidade das linhas"
            className="hidden md:flex md:ml-auto"
          >
            <ToggleGroupItem value="confortavel" aria-label="Linhas confortáveis" title="Confortável">
              <Rows3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="compacta" aria-label="Linhas compactas" title="Compacta">
              <Rows4 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {/* Ações em lote */}
      {selecionavel && linhasSelecionadas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/60 px-3 py-2" role="region" aria-label="Ações em lote">
          <span className="text-body font-medium" aria-live="polite">
            {linhasSelecionadas.length} selecionado{linhasSelecionadas.length > 1 ? "s" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-2">{acoesEmLote!(linhasSelecionadas, limparSelecao)}</div>
          <Button variant="ghost" size="sm" onClick={limparSelecao} className="ml-auto">
            <X aria-hidden="true" /> Limpar seleção
          </Button>
        </div>
      )}

      {conteudo ?? (
        <>
          {/* Desktop: tabela */}
          <div className="hidden md:block overflow-auto" style={alturaMaxima ? { maxHeight: alturaMaxima } : undefined}>
            <table className="w-full caption-bottom text-body" aria-label={rotulo}>
              <thead>
                <tr className="border-b border-border">
                  {selecionavel && (
                    <th scope="col" className="sticky top-0 z-10 w-10 bg-card px-3 shadow-[inset_0_-1px_0_hsl(var(--border))]">
                      <Checkbox
                        checked={todasVisiveisMarcadas ? true : algumaVisivelMarcada ? "indeterminate" : false}
                        onCheckedChange={(v) => alternarPagina(v === true)}
                        aria-label="Selecionar todas desta página"
                      />
                    </th>
                  )}
                  {colunas.map((c) => {
                    const ativa = ordem?.id === c.id;
                    const Icone = !ativa ? ArrowUpDown : ordem!.direcao === "asc" ? ArrowUp : ArrowDown;
                    return (
                      <th
                        key={c.id}
                        scope="col"
                        aria-sort={ativa ? (ordem!.direcao === "asc" ? "ascending" : "descending") : undefined}
                        className={cn(
                          "sticky top-0 z-10 h-11 bg-card px-3 font-medium text-muted-foreground shadow-[inset_0_-1px_0_hsl(var(--border))]",
                          ALINHAMENTO[c.alinhamento ?? "esquerda"],
                          c.className,
                        )}
                      >
                        {c.ordenarPor ? (
                          <button
                            type="button"
                            onClick={() => alternarOrdem(c.id)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              ativa && "text-foreground",
                            )}
                          >
                            {c.cabecalho}
                            <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        ) : (
                          c.cabecalho
                        )}
                      </th>
                    );
                  })}
                  {acoesLinha && (
                    <th scope="col" className="sticky top-0 z-10 bg-card px-3 shadow-[inset_0_-1px_0_hsl(var(--border))]">
                      <span className="sr-only">Ações</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((linha) => {
                  const chave = chaveLinha(linha);
                  const marcada = selecionadas.has(chave);
                  return (
                    <tr
                      key={chave}
                      data-state={marcada ? "selected" : undefined}
                      onClick={aoClicarLinha ? () => aoClicarLinha(linha) : undefined}
                      tabIndex={aoClicarLinha ? 0 : undefined}
                      onKeyDown={
                        aoClicarLinha
                          ? (e) => {
                              if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                aoClicarLinha(linha);
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        "border-b border-border last:border-0 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                        aoClicarLinha && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      )}
                    >
                      {selecionavel && (
                        <td className={cn("px-3", celulaY)} onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={marcada}
                            onCheckedChange={(v) => alternarLinha(chave, v === true)}
                            aria-label="Selecionar linha"
                          />
                        </td>
                      )}
                      {colunas.map((c) => (
                        <td key={c.id} className={cn("px-3 align-middle", celulaY, ALINHAMENTO[c.alinhamento ?? "esquerda"], c.className)}>
                          {c.celula(linha)}
                        </td>
                      ))}
                      {acoesLinha && (
                        <td className={cn("px-3 text-right", celulaY)} onClick={(e) => e.stopPropagation()}>
                          {acoesLinha(linha)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Celular: cartões */}
          <ul className="divide-y divide-border md:hidden" aria-label={rotulo}>
            {visiveis.map((linha) => {
              const chave = chaveLinha(linha);
              return (
                <li key={chave} className="space-y-2 p-3">
                  <div className="flex items-start gap-3">
                    {selecionavel && (
                      <Checkbox
                        checked={selecionadas.has(chave)}
                        onCheckedChange={(v) => alternarLinha(chave, v === true)}
                        aria-label="Selecionar linha"
                        className="mt-0.5"
                      />
                    )}
                    <div className="min-w-0 flex-1 text-body font-medium">
                      {aoClicarLinha ? (
                        <button type="button" className="text-left hover:underline" onClick={() => aoClicarLinha(linha)}>
                          {colunaTitulo.celula(linha)}
                        </button>
                      ) : (
                        colunaTitulo.celula(linha)
                      )}
                    </div>
                    {acoesLinha && <div className="shrink-0">{acoesLinha(linha)}</div>}
                  </div>
                  {colunasCartao.length > 0 && (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-body">
                      {colunasCartao.map((c) => (
                        <React.Fragment key={c.id}>
                          <dt className="text-muted-foreground">{c.cabecalho}</dt>
                          <dd className="min-w-0 tabular-nums">{c.celula(linha)}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Paginação */}
          {ordenadas.length > tamanhoPagina && (
            <nav className="flex items-center justify-between gap-2 border-t border-border px-3 py-2" aria-label={`Paginação de ${rotulo.toLowerCase()}`}>
              <span className="text-caption text-muted-foreground tabular-nums" aria-live="polite">
                {paginaAtual * tamanhoPagina + 1}–{Math.min((paginaAtual + 1) * tamanhoPagina, ordenadas.length)} de {ordenadas.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 0}
                  aria-label="Página anterior"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <span className="px-2 text-caption tabular-nums">
                  {paginaAtual + 1} / {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagina(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas - 1}
                  aria-label="Próxima página"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
