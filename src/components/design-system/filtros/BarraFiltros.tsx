import * as React from "react";
import { Check, ChevronDown, ListFilter, PlusCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  PERIODOS_RELATIVOS,
  contarAtivos,
  descreverFiltro,
  filtroAtivo,
  opcoesComContagem,
  type EstadoFiltros,
  type FiltroDef,
  type FiltroFaixa,
  type FiltroLista,
  type FiltroPeriodo,
  type ValorFiltro,
} from "./logica";

export interface BarraFiltrosProps<T> {
  filtros: FiltroDef<T>[];
  /** Linhas da tela, usadas só para montar as opções e as quantidades. */
  dados: T[];
  estado: EstadoFiltros;
  aoMudar: (estado: EstadoFiltros) => void;
}

const numeroBR = new Intl.NumberFormat("pt-BR");

function useAtualizador<T>(estado: EstadoFiltros, aoMudar: (e: EstadoFiltros) => void) {
  return React.useCallback(
    (def: FiltroDef<T>, valor: ValorFiltro | undefined) => {
      const { [def.id]: _anterior, ...resto } = estado;
      aoMudar(valor ? { ...resto, [def.id]: valor } : resto);
    },
    [estado, aoMudar],
  );
}

// --- corpos de cada tipo (usados no popover e na gaveta do celular) ----------

interface CorpoProps<T, D extends FiltroDef<T>> {
  def: D;
  valor: ValorFiltro | undefined;
  mudar: (v: ValorFiltro | undefined) => void;
  dados: T[];
  filtros: FiltroDef<T>[];
  estado: EstadoFiltros;
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function CorpoLista<T>({ def, valor, mudar, dados, filtros, estado }: CorpoProps<T, FiltroLista<T>>) {
  const [procura, setProcura] = React.useState("");
  const escolhidos = valor && "valores" in valor ? valor.valores : [];
  const opcoes = React.useMemo(() => opcoesComContagem(def, dados, filtros, estado), [def, dados, filtros, estado]);
  const termo = normalizar(procura.trim());
  const visiveis = termo ? opcoes.filter((o) => normalizar(o.rotulo).includes(termo)) : opcoes;

  function alternar(v: string) {
    const novos = escolhidos.includes(v) ? escolhidos.filter((x) => x !== v) : [...escolhidos, v];
    mudar(novos.length ? { valores: novos } : undefined);
  }

  return (
    <div className="space-y-1">
      {opcoes.length > 7 && (
        <div className="relative p-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={procura}
            onChange={(e) => setProcura(e.target.value)}
            placeholder={`Procurar ${def.rotulo.toLowerCase()}…`}
            aria-label={`Procurar ${def.rotulo.toLowerCase()}`}
            className="h-9 pl-8"
          />
        </div>
      )}
      <ul className="max-h-64 overflow-y-auto p-1" aria-label={def.rotulo}>
        {visiveis.length === 0 && <li className="px-2 py-3 text-center text-body text-muted-foreground">Nenhuma opção.</li>}
        {visiveis.map((o) => {
          const marcado = escolhidos.includes(o.valor);
          return (
            <li key={o.valor}>
              <button
                type="button"
                role="checkbox"
                aria-checked={marcado}
                onClick={() => alternar(o.valor)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-body hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                    marcado ? "bg-primary text-primary-foreground" : "bg-background",
                  )}
                  aria-hidden="true"
                >
                  {marcado && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 truncate" title={o.rotulo}>
                  {o.rotulo}
                </span>
                <span className="ml-2 text-caption tabular-nums text-muted-foreground">
                  {numeroBR.format(o.quantidade)}
                  <span className="sr-only"> {o.quantidade === 1 ? "item" : "itens"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CorpoPeriodo<T>({ def, valor, mudar }: CorpoProps<T, FiltroPeriodo<T>>) {
  const relativo = valor && "relativo" in valor ? valor.relativo : null;
  const fixo = valor && !("relativo" in valor) ? (valor as { de?: string; ate?: string }) : {};
  const idBase = `filtro-${def.id}`;

  function mudarData(campo: "de" | "ate", texto: string) {
    const novo = { ...fixo, [campo]: texto || undefined };
    mudar(novo.de || novo.ate ? novo : undefined);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Atalhos de período">
        {PERIODOS_RELATIVOS.map((p) => (
          <Button
            key={p.valor}
            type="button"
            size="sm"
            variant={relativo === p.valor ? "default" : "outline"}
            aria-pressed={relativo === p.valor}
            onClick={() => mudar(relativo === p.valor ? undefined : { relativo: p.valor })}
            className="justify-start"
          >
            {p.rotulo}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${idBase}-de`}>De</Label>
          <Input id={`${idBase}-de`} type="date" value={fixo.de ?? ""} onChange={(e) => mudarData("de", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idBase}-ate`}>Até</Label>
          <Input id={`${idBase}-ate`} type="date" value={fixo.ate ?? ""} onChange={(e) => mudarData("ate", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

/** Aceita "10.000,50", "10000.5" ou "10000". */
function lerNumero(texto: string): number | undefined {
  const t = texto.trim();
  if (!t) return undefined;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(normal);
  return Number.isFinite(n) ? n : undefined;
}

function CorpoFaixa<T>({ def, valor, mudar }: CorpoProps<T, FiltroFaixa<T>>) {
  const atual = (valor ?? {}) as { min?: number; max?: number };
  const [textos, setTextos] = React.useState({ min: atual.min?.toString() ?? "", max: atual.max?.toString() ?? "" });
  const idBase = `filtro-${def.id}`;

  // Limpo por fora (chip ou "Limpar filtros"): esvazia os campos.
  React.useEffect(() => {
    if (!valor) setTextos({ min: "", max: "" });
  }, [valor]);

  function mudarCampo(campo: "min" | "max", texto: string) {
    const novosTextos = { ...textos, [campo]: texto };
    setTextos(novosTextos);
    const min = lerNumero(novosTextos.min);
    const max = lerNumero(novosTextos.max);
    mudar(min != null || max != null ? { min, max } : undefined);
  }

  const prefixo = def.formato === "moeda" ? "R$" : null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["min", "max"] as const).map((campo) => (
        <div key={campo} className="space-y-1">
          <Label htmlFor={`${idBase}-${campo}`}>{campo === "min" ? "A partir de" : "Até"}</Label>
          <div className="relative">
            {prefixo && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-body text-muted-foreground" aria-hidden="true">
                {prefixo}
              </span>
            )}
            <Input
              id={`${idBase}-${campo}`}
              inputMode="decimal"
              value={textos[campo]}
              onChange={(e) => mudarCampo(campo, e.target.value)}
              placeholder={campo === "min" ? "0" : "sem limite"}
              className={cn("tabular-nums", prefixo && "pl-9")}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CorpoFiltro<T>(props: CorpoProps<T, FiltroDef<T>>) {
  const { def } = props;
  if (def.tipo === "lista") return <CorpoLista {...props} def={def} />;
  if (def.tipo === "periodo") return <CorpoPeriodo {...props} def={def} />;
  if (def.tipo === "faixa") return <CorpoFaixa {...props} def={def} />;
  return null;
}

// --- botão com popover (telas largas) ----------------------------------------

function BotaoFiltro<T>({ def, valor, mudar, ...resto }: CorpoProps<T, FiltroDef<T>>) {
  const ativo = filtroAtivo(def as FiltroDef<unknown>, valor);

  if (def.tipo === "booleano") {
    return (
      <Button
        type="button"
        size="sm"
        variant={ativo ? "secondary" : "outline"}
        aria-pressed={ativo}
        onClick={() => mudar(ativo ? undefined : { ativo: true })}
        className={cn(!ativo && "border-dashed")}
      >
        {ativo ? <Check aria-hidden="true" /> : <PlusCircle aria-hidden="true" />}
        {def.rotulo}
      </Button>
    );
  }

  const quantidade = ativo && def.tipo === "lista" ? (valor as { valores: string[] }).valores.length : null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className={cn(!ativo && "border-dashed", ativo && "border-primary")}>
          {!ativo && <PlusCircle aria-hidden="true" />}
          {def.rotulo}
          {ativo && (
            <span className="rounded-full bg-primary px-1.5 text-caption font-medium text-primary-foreground tabular-nums">
              {quantidade ?? 1}
              <span className="sr-only"> escolhido{(quantidade ?? 1) > 1 ? "s" : ""}</span>
            </span>
          )}
          <ChevronDown className="opacity-60" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("p-2", def.tipo === "lista" ? "w-72" : "w-80 p-3")}>
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-body font-medium">{def.rotulo}</p>
          {ativo && (
            <Button type="button" variant="ghost" size="sm" onClick={() => mudar(undefined)} className="h-7 px-2 sm:h-7">
              Limpar
            </Button>
          )}
        </div>
        <CorpoFiltro def={def} valor={valor} mudar={mudar} {...resto} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Botões de filtro da barra da tabela. Telas largas: os filtros principais à
 * vista e o resto em "Mais filtros". Celular: um botão "Filtros" que abre uma
 * gaveta com todos. O que está escolhido aparece em `ChipsFiltros`.
 */
export function BarraFiltros<T>({ filtros, dados, estado, aoMudar }: BarraFiltrosProps<T>) {
  const [mais, setMais] = React.useState(false);
  const atualizar = useAtualizador<T>(estado, aoMudar);
  const ativos = contarAtivos(filtros, estado);

  const temPrincipal = filtros.some((f) => f.principal);
  const visivel = (f: FiltroDef<T>) => !temPrincipal || f.principal || mais || filtroAtivo(f as FiltroDef<unknown>, estado[f.id]);
  const escondidos = filtros.filter((f) => !visivel(f)).length;

  const corpo = (def: FiltroDef<T>) => ({
    def,
    valor: estado[def.id],
    mudar: (v: ValorFiltro | undefined) => atualizar(def, v),
    dados,
    filtros,
    estado,
  });

  return (
    <>
      {/* Telas largas */}
      <div className="hidden flex-wrap items-center gap-2 md:flex" role="group" aria-label="Filtros">
        {filtros.filter(visivel).map((def) => (
          <BotaoFiltro key={def.id} {...corpo(def)} />
        ))}
        {temPrincipal && (escondidos > 0 || mais) && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setMais((m) => !m)} aria-expanded={mais}>
            <ListFilter aria-hidden="true" />
            {mais ? "Menos filtros" : `Mais filtros (${escondidos})`}
          </Button>
        )}
      </div>

      {/* Celular */}
      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" className="w-full md:hidden">
            <ListFilter aria-hidden="true" />
            Filtros
            {ativos > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-caption font-medium text-primary-foreground tabular-nums">{ativos}</span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Combine quantos quiser. A lista atualiza na hora.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-5">
            {filtros.map((def) => (
              <section key={def.id} className="space-y-2" aria-label={def.rotulo}>
                {def.tipo === "booleano" ? (
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={`filtro-m-${def.id}`} className="text-body font-medium">
                      {def.rotulo}
                    </Label>
                    <Switch
                      id={`filtro-m-${def.id}`}
                      checked={filtroAtivo(def as FiltroDef<unknown>, estado[def.id])}
                      onCheckedChange={(v) => atualizar(def, v ? { ativo: true } : undefined)}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-body font-medium">{def.rotulo}</p>
                    <div className={cn(def.tipo === "lista" && "rounded-md border border-border")}>
                      <CorpoFiltro {...corpo(def)} />
                    </div>
                  </>
                )}
              </section>
            ))}
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => aoMudar({})} disabled={ativos === 0}>
              Limpar filtros
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export interface ChipsFiltrosProps<T> {
  filtros: FiltroDef<T>[];
  estado: EstadoFiltros;
  aoMudar: (estado: EstadoFiltros) => void;
  /** Quantos itens sobraram e quantos havia (ex.: 37 de 412). */
  contagem?: { visiveis: number; total: number; rotulo?: string };
  className?: string;
}

/** O que está filtrado, com ✕ em cada filtro, o contador e "Limpar filtros". Some quando não há filtro. */
export function ChipsFiltros<T>({ filtros, estado, aoMudar, contagem, className }: ChipsFiltrosProps<T>) {
  const atualizar = useAtualizador<T>(estado, aoMudar);
  const ativos = filtros.filter((f) => filtroAtivo(f as FiltroDef<unknown>, estado[f.id]));
  if (ativos.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} role="region" aria-label="Filtros aplicados">
      {ativos.map((def) => {
        const texto = def.tipo === "booleano" ? def.rotulo : `${def.rotulo}: ${descreverFiltro(def, estado[def.id])}`;
        return (
          <span
            key={def.id}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted py-0.5 pl-3 pr-1 text-caption font-medium text-foreground"
          >
            <span className="truncate">{texto}</span>
            <button
              type="button"
              onClick={() => atualizar(def, undefined)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Tirar filtro ${def.rotulo}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        );
      })}
      <Button type="button" variant="link" size="sm" onClick={() => aoMudar({})} className="h-auto px-1 sm:h-auto">
        Limpar filtros
      </Button>
      {contagem && (
        <span className="ml-auto text-caption tabular-nums text-muted-foreground" aria-live="polite">
          {numeroBR.format(contagem.visiveis)} de {numeroBR.format(contagem.total)}
          {contagem.rotulo ? ` ${contagem.rotulo}` : ""}
        </span>
      )}
    </div>
  );
}
