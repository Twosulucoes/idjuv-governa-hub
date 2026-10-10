/**
 * Consulta da trilha de auditoria (audit_logs), usada em /admin/auditoria (todos os módulos), em /rh/auditoria
 * (travada no módulo rh) e nas abas "Histórico de alterações" (recorte de uma ficha).
 *
 * Filtros e paginação no servidor (o banco devolve uma página por vez, sem antes/depois), ordem pela `sequencia`
 * (ordem de gravação), servidor responsável e origem na lista e diff ao abrir a linha. A exportação CSV é
 * registrada na trilha (registrar_evento) antes do download; se o registro falhar, o arquivo não é entregue.
 * Descrição e metadados são texto: nada aqui vira HTML.
 */

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Download, Eye, Filter, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { DetalheTrilhaDialog } from "@/components/auditoria/DetalheTrilhaDialog";
import { TOM_ACAO_TRILHA, nomeModulo, rotuloEntidade } from "@/components/auditoria/trilhaRotulos";
import { AUDIT_ACTION_LABELS, type AuditAction } from "@/types/auth";
import { MODULES_CONFIG } from "@/shared/config/modules.config";
import {
  LIMITE_EXPORTACAO_TRILHA,
  ORIGEM_TRILHA_LABELS,
  buscarTrilhaParaExportar,
  ehUuid,
  responsavelTrilha,
  useRegistrarEvento,
  useTrilhaAuditoria,
  type EscopoTrilha,
  type FiltrosTrilha,
  type LinhaTrilha,
  type OrigemTrilha,
} from "@/hooks/useTrilhaAuditoria";
import { toast } from "sonner";

const TODOS = "todos";
const TAMANHO_PAGINA = 50;

interface TrilhaAuditoriaProps {
  /** Nome da tabela para leitores de tela. */
  rotulo?: string;
  /** Trava o filtro de módulo (ex.: "rh"). */
  moduloFixo?: string;
  /** Recorte de uma ficha (servidor ou folha). */
  escopo?: EscopoTrilha;
  /** Mostra o botão de exportar CSV. */
  exportavel?: boolean;
  /** Versão enxuta para abas: período, ação e responsável. */
  compacta?: boolean;
}

interface Rascunho {
  inicio: string;
  fim: string;
  modulo: string;
  acao: string;
  origem: string;
  entidade: string;
  registroId: string;
  usuarioId: string;
  responsavel: string;
  servidorId: string;
}

const RASCUNHO_VAZIO: Rascunho = {
  inicio: "",
  fim: "",
  modulo: TODOS,
  acao: TODOS,
  origem: TODOS,
  entidade: "",
  registroId: "",
  usuarioId: "",
  responsavel: "",
  servidorId: "",
};

function paraFiltros(r: Rascunho, moduloFixo?: string, escopo?: EscopoTrilha): FiltrosTrilha {
  return {
    inicio: r.inicio || undefined,
    fim: r.fim || undefined,
    modulo: moduloFixo ?? (r.modulo !== TODOS ? r.modulo : undefined),
    acao: r.acao !== TODOS ? (r.acao as AuditAction) : undefined,
    origem: r.origem !== TODOS ? (r.origem as OrigemTrilha) : undefined,
    entidade: r.entidade.trim() || undefined,
    registroId: r.registroId.trim() || undefined,
    usuarioId: r.usuarioId.trim() || undefined,
    responsavel: r.responsavel.trim() || undefined,
    servidorId: r.servidorId.trim() || undefined,
    escopo,
  };
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** Célula de CSV: entre aspas e sem fórmula (=, +, -, @ no início viram texto). */
function celulaCsv(valor: unknown): string {
  let s = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function montarCsv(linhas: LinhaTrilha[]): string {
  const cabecalho = [
    "Sequência",
    "Data/hora",
    "Responsável",
    "Matrícula",
    "Origem",
    "ID do usuário",
    "Perfil",
    "Ação",
    "Módulo",
    "Tabela/entidade",
    "ID do registro",
    "Campos alterados",
    "Descrição",
  ];
  const corpo = linhas.map((l) => [
    l.sequencia ?? "",
    format(new Date(l.timestamp), "dd/MM/yyyy HH:mm:ss"),
    l.servidor_nome ?? l.usuario_nome ?? responsavelTrilha(l),
    l.servidor_matricula ?? "",
    l.origem ? ORIGEM_TRILHA_LABELS[l.origem] ?? l.origem : "",
    l.user_id ?? "",
    l.role_at_time ?? "",
    AUDIT_ACTION_LABELS[l.action] ?? l.action,
    l.module_name ?? "",
    l.entity_type ?? "",
    l.entity_id ?? "",
    (l.campos_alterados ?? []).join(", "),
    l.description ?? "",
  ]);
  return "﻿" + [cabecalho, ...corpo].map((linha) => linha.map(celulaCsv).join(";")).join("\r\n");
}

function baixarArquivo(conteudo: string, nome: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function TrilhaAuditoria({
  rotulo = "Registros da trilha de auditoria",
  moduloFixo,
  escopo,
  exportavel = false,
  compacta = false,
}: TrilhaAuditoriaProps) {
  const [rascunho, setRascunho] = useState<Rascunho>(RASCUNHO_VAZIO);
  const [filtros, setFiltros] = useState<FiltrosTrilha>(() => paraFiltros(RASCUNHO_VAZIO, moduloFixo, escopo));
  const [pagina, setPagina] = useState(0);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const { registrarAntes } = useRegistrarEvento();

  const { data, isLoading, isFetching, error, refetch } = useTrilhaAuditoria(filtros, pagina, TAMANHO_PAGINA);
  const linhas = data?.linhas ?? [];

  const alterar = (campo: keyof Rascunho) => (valor: string) => setRascunho((r) => ({ ...r, [campo]: valor }));

  const idsInvalidos = (["registroId", "usuarioId", "servidorId"] as const).filter(
    (c) => rascunho[c].trim() !== "" && !ehUuid(rascunho[c]),
  );

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault();
    if (idsInvalidos.length > 0) return;
    setPagina(0);
    setFiltros(paraFiltros(rascunho, moduloFixo, escopo));
  };

  const limpar = () => {
    setRascunho(RASCUNHO_VAZIO);
    setPagina(0);
    setFiltros(paraFiltros(RASCUNHO_VAZIO, moduloFixo, escopo));
  };

  const exportarCsv = async () => {
    setExportando(true);
    try {
      const registros = await buscarTrilhaParaExportar(filtros);
      if (registros.length === 0) {
        toast.info("Nenhum registro no filtro para exportar.");
        return;
      }
      const cortado = registros.length >= LIMITE_EXPORTACAO_TRILHA;
      // Filtros registrados sem o texto livre (nome/matrícula do responsável): só se foi usado.
      const { responsavel, escopo: recorte, ...demais } = filtros;
      const ok = await registrarAntes({
        acao: "export",
        entidade: "trilha_auditoria",
        descricao: `Exportação CSV da trilha de auditoria (${registros.length} registros)`,
        metadados: {
          formato: "csv",
          quantidade: registros.length,
          cortado,
          filtros: { ...demais, responsavel_informado: !!responsavel },
          ...(recorte?.tipo === "servidor" ? { servidor_id: recorte.servidorId } : {}),
          ...(recorte?.tipo === "folha" ? { folha_id: recorte.folhaId } : {}),
        },
      });
      if (!ok) return;
      baixarArquivo(montarCsv(registros), `trilha_auditoria_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      toast.success(
        cortado
          ? `Exportados os ${LIMITE_EXPORTACAO_TRILHA} registros mais recentes do filtro. Refine o filtro para o restante.`
          : `${registros.length} registros exportados.`,
      );
    } catch (erro) {
      console.error("Erro ao exportar a trilha:", erro);
      toast.error("Não foi possível exportar a trilha de auditoria.");
    } finally {
      setExportando(false);
    }
  };

  const colunas: ColunaTabela<LinhaTrilha>[] = [
    {
      id: "quando",
      cabecalho: "Data/hora",
      className: "whitespace-nowrap",
      celula: (l) => (
        <span className="tabular-nums">
          {format(new Date(l.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
          {l.sequencia != null && (
            <span className="block text-caption text-muted-foreground">nº {l.sequencia}</span>
          )}
        </span>
      ),
    },
    {
      id: "responsavel",
      cabecalho: "Responsável",
      mobile: "titulo",
      celula: (l) => (
        <span>
          {responsavelTrilha(l)}
          {l.origem && l.origem !== "usuario" && (
            <span className="block text-caption text-muted-foreground">{ORIGEM_TRILHA_LABELS[l.origem] ?? l.origem}</span>
          )}
        </span>
      ),
    },
    {
      id: "acao",
      cabecalho: "Ação",
      celula: (l) => (
        <StatusBadge tom={TOM_ACAO_TRILHA[l.action] ?? "neutro"} icone={false}>
          {AUDIT_ACTION_LABELS[l.action] ?? l.action}
        </StatusBadge>
      ),
    },
    ...(moduloFixo || escopo
      ? []
      : [
          {
            id: "modulo",
            cabecalho: "Módulo",
            celula: (l: LinhaTrilha) => nomeModulo(l.module_name),
          } satisfies ColunaTabela<LinhaTrilha>,
        ]),
    {
      id: "oque",
      cabecalho: "Tabela / o que mudou",
      celula: (l) => {
        const campos = l.campos_alterados ?? [];
        return (
          <span className="min-w-0">
            <span className="font-mono text-xs">{rotuloEntidade(l.entity_type)}</span>
            {campos.length > 0 ? (
              <span className="block text-caption text-muted-foreground break-words">
                {campos.slice(0, 4).join(", ")}
                {campos.length > 4 && ` e mais ${campos.length - 4}`}
              </span>
            ) : (
              l.description && (
                <span className="block text-caption text-muted-foreground line-clamp-2 break-words">{l.description}</span>
              )
            )}
          </span>
        );
      },
    },
  ];

  const temFiltroAvancado =
    !compacta &&
    (rascunho.entidade || rascunho.registroId || rascunho.usuarioId || rascunho.servidorId || rascunho.origem !== TODOS);

  return (
    <div className="space-y-4">
      <form onSubmit={aplicar} className="space-y-3 rounded-lg border bg-card p-4" aria-label="Filtros da trilha">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="trilha-inicio">De</Label>
            <Input id="trilha-inicio" type="date" value={rascunho.inicio} onChange={(e) => alterar("inicio")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="trilha-fim">Até</Label>
            <Input id="trilha-fim" type="date" value={rascunho.fim} onChange={(e) => alterar("fim")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="trilha-acao">Ação</Label>
            <Select value={rascunho.acao} onValueChange={alterar("acao")}>
              <SelectTrigger id="trilha-acao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas as ações</SelectItem>
                {Object.entries(AUDIT_ACTION_LABELS).map(([valor, rotuloAcao]) => (
                  <SelectItem key={valor} value={valor}>
                    {rotuloAcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {moduloFixo || escopo ? (
            <div className="space-y-1">
              <Label htmlFor="trilha-responsavel">Responsável</Label>
              <Input
                id="trilha-responsavel"
                placeholder="Nome ou matrícula"
                value={rascunho.responsavel}
                onChange={(e) => alterar("responsavel")(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="trilha-modulo">Módulo</Label>
              <Select value={rascunho.modulo} onValueChange={alterar("modulo")}>
                <SelectTrigger id="trilha-modulo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos os módulos</SelectItem>
                  {MODULES_CONFIG.map((m) => (
                    <SelectItem key={m.codigo} value={m.codigo}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {!compacta && (
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="gap-1 px-2">
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                Mais filtros{temFiltroAvancado ? " (em uso)" : ""}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {!(moduloFixo || escopo) && (
                  <div className="space-y-1">
                    <Label htmlFor="trilha-responsavel">Responsável</Label>
                    <Input
                      id="trilha-responsavel"
                      placeholder="Nome ou matrícula"
                      value={rascunho.responsavel}
                      onChange={(e) => alterar("responsavel")(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="trilha-origem">Origem</Label>
                  <Select value={rascunho.origem} onValueChange={alterar("origem")}>
                    <SelectTrigger id="trilha-origem">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TODOS}>Todas as origens</SelectItem>
                      {Object.entries(ORIGEM_TRILHA_LABELS).map(([valor, rotuloOrigem]) => (
                        <SelectItem key={valor} value={valor}>
                          {rotuloOrigem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="trilha-entidade">Tabela/entidade</Label>
                  <Input
                    id="trilha-entidade"
                    placeholder="ex.: servidores"
                    value={rascunho.entidade}
                    onChange={(e) => alterar("entidade")(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="trilha-registro">ID do registro</Label>
                  <Input
                    id="trilha-registro"
                    className="font-mono"
                    value={rascunho.registroId}
                    aria-invalid={idsInvalidos.includes("registroId")}
                    onChange={(e) => alterar("registroId")(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="trilha-usuario">ID do usuário</Label>
                  <Input
                    id="trilha-usuario"
                    className="font-mono"
                    value={rascunho.usuarioId}
                    aria-invalid={idsInvalidos.includes("usuarioId")}
                    onChange={(e) => alterar("usuarioId")(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="trilha-servidor">ID do servidor responsável</Label>
                  <Input
                    id="trilha-servidor"
                    className="font-mono"
                    value={rascunho.servidorId}
                    aria-invalid={idsInvalidos.includes("servidorId")}
                    onChange={(e) => alterar("servidorId")(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {idsInvalidos.length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            Os campos de ID aceitam só o identificador completo (formato UUID).
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" className="gap-2">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtrar
          </Button>
          <Button type="button" size="sm" variant="ghost" className="gap-2" onClick={limpar}>
            <X className="h-4 w-4" aria-hidden="true" />
            Limpar
          </Button>
          {exportavel && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2 sm:ml-auto"
              onClick={exportarCsv}
              disabled={exportando}
            >
              {exportando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Exportar CSV
            </Button>
          )}
        </div>
      </form>

      <DataTable
        rotulo={rotulo}
        dados={linhas}
        colunas={colunas}
        chaveLinha={(l) => l.id}
        carregando={isLoading}
        erro={error ? "Verifique sua permissão de leitura da trilha ou tente novamente." : null}
        aoTentarNovamente={() => refetch()}
        tamanhoPagina={TAMANHO_PAGINA}
        aoClicarLinha={(l) => setSelecionada(l.id)}
        vazio={{
          icone: Activity,
          titulo: "Nenhum registro encontrado",
          descricao: "Ajuste o período ou os filtros.",
        }}
        acoesLinha={(l) => (
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Ver detalhes do registro de ${responsavelTrilha(l)} em ${format(new Date(l.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelecionada(l.id);
            }}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      />

      {!error && (pagina > 0 || data?.temProxima) && (
        <nav className="flex items-center justify-between gap-2" aria-label={`Paginação de ${rotulo.toLowerCase()}`}>
          <span className="text-caption text-muted-foreground tabular-nums" aria-live="polite">
            Página {pagina + 1}
            {isFetching && " (carregando…)"}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0 || isFetching}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setPagina((p) => p + 1)}
              disabled={!data?.temProxima || isFetching}
            >
              Próxima
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}

      <DetalheTrilhaDialog id={selecionada} onOpenChange={(aberto) => !aberto && setSelecionada(null)} />
    </div>
  );
}
