/**
 * Aba "Itens" do PCA: os DFDs lançados, com filtros por setor, fonte, mês, prioridade e grupo do catálogo.
 * Item retirado do PCA (situacao = excluido) não aparece aqui nem soma no orçamento.
 */

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { useUnidadesEstrutura } from "@/hooks/useLancamentoPorSetor";
import {
  useExcluirPcaItem, useNomesCatalogo, useSalvarPcaItem, type ClassificadoresPca, type PcaItem, type PcaPlano,
} from "@/hooks/usePca";
import { PcaItemDialog } from "./PcaItemDialog";
import { MESES, PRIORIDADE_LABEL, TOM_PRIORIDADE, rotuloClassificador } from "./rotulos";

const TODOS = "todos";

interface PcaItensTabProps {
  plano: PcaPlano;
  itens: PcaItem[] | undefined;
  carregando: boolean;
  erro: string | null;
  aoTentarNovamente: () => void;
  classificadores: ClassificadoresPca | undefined;
  podeEditar: boolean;
}

export function PcaItensTab({ plano, itens, carregando, erro, aoTentarNovamente, classificadores, podeEditar }: PcaItensTabProps) {
  const ativos = useMemo(() => (itens ?? []).filter((i) => i.situacao === "ativo"), [itens]);
  const { data: setores } = useUnidadesEstrutura();
  const { data: grupos } = useNomesCatalogo(ativos);
  const salvar = useSalvarPcaItem(plano.id);
  const excluir = useExcluirPcaItem();
  const [editando, setEditando] = useState<PcaItem | null>(null);
  const [dialogo, setDialogo] = useState(false);
  const [retirar, setRetirar] = useState<PcaItem | null>(null);
  const [filtro, setFiltro] = useState({ setor: TODOS, fonte: TODOS, mes: TODOS, prioridade: TODOS, grupo: TODOS });

  const nomeSetor = (id: string | null) => {
    const s = setores?.find((x) => x.id === id);
    return s ? s.sigla || s.nome : "—";
  };
  const grupoDe = (i: PcaItem) => grupos?.get(i.tipo === "material" ? `m${i.codigo_pdm}` : `s${i.codigo_servico}`) ?? "—";
  const fonteDe = (id: string) => classificadores?.fontes.find((f) => f.id === id);

  const filtrados = ativos.filter((i) =>
    (filtro.setor === TODOS || i.setor_id === filtro.setor)
    && (filtro.fonte === TODOS || i.fonte_recurso_id === filtro.fonte)
    && (filtro.mes === TODOS || String(i.mes_desejado) === filtro.mes)
    && (filtro.prioridade === TODOS || i.prioridade === filtro.prioridade)
    && (filtro.grupo === TODOS || grupoDe(i) === filtro.grupo));

  // memorizado: o diálogo recarrega o formulário quando esta referência muda
  const escolhaInicial = useMemo(() => editando ? {
    codigo: (editando.tipo === "material" ? editando.codigo_pdm : editando.codigo_servico) ?? 0,
    nome: editando.descricao,
    grupo: grupos?.get(editando.tipo === "material" ? `m${editando.codigo_pdm}` : `s${editando.codigo_servico}`) ?? "Catálogo",
  } : null, [editando, grupos]);

  const opcoesGrupo = [...new Set(ativos.map(grupoDe))].filter((g) => g !== "—").sort();
  const opcoesSetor = [...new Set(ativos.map((i) => i.setor_id).filter((s): s is string => !!s))];
  const opcoesFonte = [...new Set(ativos.map((i) => i.fonte_recurso_id))];

  const colunas: ColunaTabela<PcaItem>[] = [
    {
      id: "descricao", cabecalho: "Item", mobile: "titulo",
      celula: (i) => (
        <div>
          <p className="font-medium">{i.descricao}</p>
          <p className="text-xs text-muted-foreground">{grupoDe(i)} · SEI {i.numero_sei}</p>
        </div>
      ),
      buscarPor: (i) => `${i.descricao} ${i.numero_sei}`,
      ordenarPor: (i) => i.descricao,
    },
    { id: "setor", cabecalho: "Setor", celula: (i) => nomeSetor(i.setor_id), ordenarPor: (i) => nomeSetor(i.setor_id) },
    {
      id: "quantidade", cabecalho: "Qtd.", alinhamento: "direita",
      celula: (i) => `${Number(i.quantidade).toLocaleString("pt-BR")} ${i.unidade_fornecimento}`,
    },
    { id: "valor", cabecalho: "Valor total", alinhamento: "direita", celula: (i) => formatCurrency(Number(i.valor_total ?? 0)), ordenarPor: (i) => Number(i.valor_total ?? 0) },
    { id: "mes", cabecalho: "Mês", celula: (i) => MESES[i.mes_desejado - 1], ordenarPor: (i) => i.mes_desejado },
    {
      id: "prioridade", cabecalho: "Prioridade",
      celula: (i) => <StatusBadge tom={TOM_PRIORIDADE[i.prioridade]} icone={false}>{PRIORIDADE_LABEL[i.prioridade]}</StatusBadge>,
    },
    { id: "fonte", cabecalho: "Fonte", celula: (i) => fonteDe(i.fonte_recurso_id)?.codigo ?? "—" },
  ];

  const filtroSelect = (chave: keyof typeof filtro, rotulo: string, opcoes: { valor: string; rotulo: string }[]) => (
    <Select value={filtro[chave]} onValueChange={(v) => setFiltro((f) => ({ ...f, [chave]: v }))}>
      <SelectTrigger className="w-full sm:w-40" aria-label={`Filtrar por ${rotulo.toLowerCase()}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{rotulo}: todos</SelectItem>
        {opcoes.map((o) => <SelectItem key={o.valor} value={o.valor}>{o.rotulo}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      {podeEditar && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditando(null); setDialogo(true); }}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Lançar DFD
          </Button>
        </div>
      )}

      <DataTable
        rotulo={`Itens do PCA ${plano.exercicio}`}
        dados={filtrados}
        colunas={colunas}
        chaveLinha={(i) => i.id}
        carregando={carregando}
        erro={erro}
        aoTentarNovamente={aoTentarNovamente}
        busca={{ placeholder: "Buscar por item ou processo SEI" }}
        vazio={{
          titulo: "Nenhum item lançado",
          descricao: podeEditar ? "Use \"Lançar DFD\" para incluir o primeiro item." : "Compras ainda não lançou itens neste PCA.",
        }}
        filtros={
          <div className="flex flex-wrap gap-2">
            {filtroSelect("setor", "Setor", opcoesSetor.map((s) => ({ valor: s, rotulo: nomeSetor(s) })))}
            {filtroSelect("fonte", "Fonte", opcoesFonte.map((f) => ({ valor: f, rotulo: rotuloClassificador(fonteDe(f)) })))}
            {filtroSelect("mes", "Mês", MESES.map((m, i) => ({ valor: String(i + 1), rotulo: m })))}
            {filtroSelect("prioridade", "Prioridade", Object.entries(PRIORIDADE_LABEL).map(([valor, rotulo]) => ({ valor, rotulo })))}
            {filtroSelect("grupo", "Grupo", opcoesGrupo.map((g) => ({ valor: g, rotulo: g })))}
          </div>
        }
        acoesLinha={podeEditar ? (i) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label={`Editar ${i.descricao}`} onClick={() => { setEditando(i); setDialogo(true); }}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Retirar ${i.descricao} do PCA`} onClick={() => setRetirar(i)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : undefined}
      />

      <PcaItemDialog
        open={dialogo}
        onOpenChange={setDialogo}
        item={editando}
        escolhaInicial={escolhaInicial}
        classificadores={classificadores}
        salvando={salvar.isPending}
        onSalvar={(item) => salvar.mutateAsync(item)}
      />

      <AlertDialog open={!!retirar} onOpenChange={(o) => !o && setRetirar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirar o item do PCA?</AlertDialogTitle>
            <AlertDialogDescription>
              "{retirar?.descricao}" deixa de somar no PCA. O registro continua no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (retirar) excluir.mutate(retirar.id); setRetirar(null); }}>
              Retirar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
