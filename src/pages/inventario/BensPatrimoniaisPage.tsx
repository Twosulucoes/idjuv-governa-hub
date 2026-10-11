/**
 * GESTÃO DE BENS PATRIMONIAIS
 * Listagem, cadastro e detalhamento de bens permanentes
 */

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Package, Plus, Eye, Edit, QrCode, MoreHorizontal,
  PackagePlus, ArrowRightLeft
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBensPatrimoniais, useCreateBem } from "@/hooks/usePatrimonio";
import { imprimirEtiquetas } from "@/lib/etiquetasPatrimonio";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CadastroLoteDialog } from "@/components/inventario/CadastroLoteDialog";
import { MovimentacaoLoteDialog } from "@/components/inventario/MovimentacaoLoteDialog";

const CATEGORIAS_BEM = [
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'informatica', label: 'Informática' },
  { value: 'equipamento_esportivo', label: 'Equipamento esportivo' },
  { value: 'veiculo', label: 'Veículo' },
  { value: 'eletrodomestico', label: 'Eletrodoméstico' },
  { value: 'outros', label: 'Outros' },
];

// Valores do CHECK da coluna bens_patrimoniais.situacao
const SITUACOES_BEM: { value: string; label: string; tom: TomStatus }[] = [
  { value: 'ativo', label: 'Ativo', tom: 'sucesso' },
  { value: 'em_manutencao', label: 'Em manutenção', tom: 'pendente' },
  { value: 'cedido', label: 'Cedido', tom: 'andamento' },
  { value: 'em_transferencia', label: 'Em transferência', tom: 'andamento' },
  { value: 'baixado', label: 'Baixado', tom: 'erro' },
  { value: 'extraviado', label: 'Extraviado', tom: 'erro' },
];

const ESTADOS_CONSERVACAO = [
  { value: 'otimo', label: 'Ótimo' },
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim', label: 'Ruim' },
  { value: 'inservivel', label: 'Inservível' },
];

type Bem = NonNullable<ReturnType<typeof useBensPatrimoniais>["data"]>[number];

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function SituacaoBemBadge({ situacao }: { situacao: string | null }) {
  const sit = SITUACOES_BEM.find(s => s.value === situacao);
  return sit ? <StatusBadge tom={sit.tom}>{sit.label}</StatusBadge> : <StatusBadge tom="neutro">Sem situação</StatusBadge>;
}

const colunas: ColunaTabela<Bem>[] = [
  {
    id: "patrimonio",
    cabecalho: "Patrimônio",
    celula: (bem) => bem.numero_patrimonio
      ? <span className="font-mono">{bem.numero_patrimonio}</span>
      : <span className="text-muted-foreground">Pendente</span>,
    ordenarPor: (bem) => bem.numero_patrimonio,
    buscarPor: (bem) => bem.numero_patrimonio,
  },
  {
    id: "descricao",
    cabecalho: "Descrição",
    celula: (bem) => (
      <div>
        <span className="font-medium">{bem.descricao}</span>
        {bem.marca && (
          <span className="block text-caption text-muted-foreground">{bem.marca} {bem.modelo}</span>
        )}
      </div>
    ),
    ordenarPor: (bem) => bem.descricao,
    buscarPor: (bem) => `${bem.descricao ?? ''} ${bem.marca ?? ''} ${bem.modelo ?? ''}`,
    mobile: "titulo",
  },
  {
    id: "categoria",
    cabecalho: "Categoria",
    celula: (bem) => CATEGORIAS_BEM.find(c => c.value === bem.categoria_bem)?.label ?? bem.categoria_bem ?? '-',
    ordenarPor: (bem) => bem.categoria_bem,
  },
  {
    id: "localizacao",
    cabecalho: "Localização",
    celula: (bem) => {
      const local = bem.unidade_local?.nome_unidade || bem.unidade?.sigla;
      return local
        ? <span className="block max-w-[180px] truncate" title={local}>{local}</span>
        : <span className="text-destructive">Sem local</span>;
    },
    ordenarPor: (bem) => bem.unidade_local?.nome_unidade || bem.unidade?.sigla,
  },
  {
    id: "responsavel",
    cabecalho: "Responsável",
    celula: (bem) => bem.responsavel?.nome_completo?.split(' ').slice(0, 2).join(' ') || '-',
    ordenarPor: (bem) => bem.responsavel?.nome_completo,
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (bem) => bem.valor_aquisicao ? moeda.format(bem.valor_aquisicao) : '-',
    ordenarPor: (bem) => bem.valor_aquisicao,
    alinhamento: "direita",
  },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (bem) => <SituacaoBemBadge situacao={bem.situacao} />,
    ordenarPor: (bem) => bem.situacao,
  },
];

export default function BensPatrimoniaisPage() {
  const [searchParams] = useSearchParams();
  const [filtroSituacao, setFiltroSituacao] = useState<string>("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [modalAberto, setModalAberto] = useState(searchParams.get('acao') === 'novo');
  const [cadastroLoteOpen, setCadastroLoteOpen] = useState(false);
  const [movimentacaoLoteOpen, setMovimentacaoLoteOpen] = useState(false);

  const { data: bens, isLoading, isError, refetch } = useBensPatrimoniais({
    situacao: filtroSituacao || undefined,
    categoria_bem: filtroCategoria || undefined,
  });

  const createBem = useCreateBem();

  const handleGerarQrCode = async (bem: Bem) => {
    if (!bem.numero_patrimonio) {
      toast.error('Este bem ainda não tem número de tombamento.');
      return;
    }
    try {
      await imprimirEtiquetas([
        {
          numero_patrimonio: bem.numero_patrimonio,
          descricao: bem.descricao,
          codigo_qr: bem.codigo_qr,
          unidade: bem.unidade_local?.nome_unidade,
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a etiqueta.');
    }
  };

  // Form state para novo bem
  const [novoBem, setNovoBem] = useState({
    descricao: '',
    categoria_bem: '' as any,
    marca: '',
    modelo: '',
    numero_serie: '',
    estado_conservacao: 'bom',
    valor_aquisicao: 0,
    data_aquisicao: new Date().toISOString().split('T')[0],
    observacao: '',
    unidade_local_id: '',
    responsavel_id: '',
  });

  // Query para unidades locais
  const { data: unidadesLocais } = useQuery({
    queryKey: ["unidades-locais-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades_locais")
        .select("id, nome_unidade, codigo_unidade, municipio")
        .eq("status", "ativa")
        .order("nome_unidade");
      if (error) throw error;
      return data;
    },
  });

  // Query para servidores
  const { data: servidores } = useQuery({
    queryKey: ["servidores-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo")
        .eq("ativo", true)
        .order("nome_completo")
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const handleCriarBem = async () => {
    const desc = novoBem.descricao.trim();
    if (!desc || !novoBem.categoria_bem || !novoBem.valor_aquisicao || !novoBem.unidade_local_id) {
      toast.error('Preencha os campos obrigatórios (Descrição, Categoria, Valor e Unidade Local)');
      return;
    }
    if (novoBem.valor_aquisicao < 0) {
      toast.error('Valor de aquisição não pode ser negativo');
      return;
    }

    try {
      await createBem.mutateAsync({
        descricao: desc,
        categoria_bem: novoBem.categoria_bem as any,
        marca: novoBem.marca.trim() || null,
        modelo: novoBem.modelo.trim() || null,
        numero_serie: novoBem.numero_serie.trim() || null,
        estado_conservacao: novoBem.estado_conservacao,
        valor_aquisicao: novoBem.valor_aquisicao,
        data_aquisicao: novoBem.data_aquisicao,
        observacao: novoBem.observacao.trim() || null,
        situacao: 'ativo',
        // numero_patrimonio omitido: o banco gera o tombamento e o codigo_qr.
        unidade_local_id: novoBem.unidade_local_id,
        responsavel_id: novoBem.responsavel_id || null,
      });
      setModalAberto(false);
      setNovoBem({
        descricao: '',
        categoria_bem: '' as any,
        marca: '',
        modelo: '',
        numero_serie: '',
        estado_conservacao: 'bom',
        valor_aquisicao: 0,
        data_aquisicao: new Date().toISOString().split('T')[0],
        observacao: '',
        unidade_local_id: '',
        responsavel_id: '',
      });
    } catch (error) {
      // Erro tratado no hook
    }
  };

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Bens patrimoniais" }]}
          titulo="Bens patrimoniais"
          descricao="Cadastro e gestão de bens permanentes"
          acoes={
            <>
              <Button variant="outline" onClick={() => setCadastroLoteOpen(true)}>
                <PackagePlus className="h-4 w-4" aria-hidden="true" />
                Cadastro em lote
              </Button>
              <Button variant="outline" onClick={() => setMovimentacaoLoteOpen(true)}>
                <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                Movimentar em lote
              </Button>
              <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Novo bem
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Bem Patrimonial</DialogTitle>
                  <DialogDescription>
                    Preencha os dados básicos. Informações adicionais podem ser completadas depois.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* UNIDADE LOCAL - OBRIGATÓRIO */}
                  <div className="grid gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Label htmlFor="unidade_local" className="text-primary font-medium">
                      Unidade Local * (Obrigatório)
                    </Label>
                    <Select 
                      value={novoBem.unidade_local_id} 
                      onValueChange={v => setNovoBem(prev => ({ ...prev, unidade_local_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a Unidade Local" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesLocais?.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.codigo_unidade ? `[${u.codigo_unidade}] ` : ''}{u.nome_unidade} - {u.municipio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Todo bem deve estar vinculado a uma unidade local (ginásio, estádio, parque, etc.)
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input 
                      id="descricao" 
                      value={novoBem.descricao}
                      onChange={e => setNovoBem(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Ex: Computador Desktop Dell OptiPlex"
                      maxLength={300}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select 
                        value={novoBem.categoria_bem} 
                        onValueChange={v => setNovoBem(prev => ({ ...prev, categoria_bem: v as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS_BEM.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="estado">Estado de Conservação</Label>
                      <Select 
                        value={novoBem.estado_conservacao} 
                        onValueChange={v => setNovoBem(prev => ({ ...prev, estado_conservacao: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_CONSERVACAO.map(est => (
                            <SelectItem key={est.value} value={est.value}>{est.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="marca">Marca</Label>
                      <Input 
                        id="marca" 
                        value={novoBem.marca}
                        onChange={e => setNovoBem(prev => ({ ...prev, marca: e.target.value }))}
                        maxLength={100}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input 
                        id="modelo" 
                        value={novoBem.modelo}
                        onChange={e => setNovoBem(prev => ({ ...prev, modelo: e.target.value }))}
                        maxLength={100}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="serie">Número de Série</Label>
                      <Input 
                        id="serie" 
                        value={novoBem.numero_serie}
                        onChange={e => setNovoBem(prev => ({ ...prev, numero_serie: e.target.value }))}
                        maxLength={50}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valor">Valor de Aquisição *</Label>
                      <Input 
                        id="valor" 
                        type="number"
                        step="0.01"
                        min="0"
                        value={novoBem.valor_aquisicao}
                        onChange={e => setNovoBem(prev => ({ ...prev, valor_aquisicao: Math.max(0, parseFloat(e.target.value) || 0) }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="data">Data de Aquisição *</Label>
                      <Input 
                        id="data" 
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={novoBem.data_aquisicao}
                        onChange={e => setNovoBem(prev => ({ ...prev, data_aquisicao: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="responsavel">Responsável</Label>
                      <Select 
                        value={novoBem.responsavel_id} 
                        onValueChange={v => setNovoBem(prev => ({ ...prev, responsavel_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {servidores?.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.nome_completo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="obs">Observações</Label>
                    <Textarea 
                      id="obs" 
                      value={novoBem.observacao}
                      onChange={e => setNovoBem(prev => ({ ...prev, observacao: e.target.value }))}
                      rows={3}
                      maxLength={1000}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalAberto(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCriarBem} disabled={createBem.isPending}>
                    {createBem.isPending ? 'Salvando...' : 'Cadastrar Bem'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </>
          }
        />

        {/* Dialogs de Lote */}
        <CadastroLoteDialog open={cadastroLoteOpen} onOpenChange={setCadastroLoteOpen} />
        <MovimentacaoLoteDialog open={movimentacaoLoteOpen} onOpenChange={setMovimentacaoLoteOpen} />

        <DataTable
          rotulo="Bens patrimoniais"
          dados={bens ?? []}
          colunas={colunas}
          chaveLinha={(bem) => bem.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar os bens." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por descrição, nº ou marca" }}
          filtros={
            <>
              <Select value={filtroSituacao || "all"} onValueChange={v => setFiltroSituacao(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Situação">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situações</SelectItem>
                  {SITUACOES_BEM.map(sit => (
                    <SelectItem key={sit.value} value={sit.value}>{sit.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroCategoria || "all"} onValueChange={v => setFiltroCategoria(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Categoria">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {CATEGORIAS_BEM.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          vazio={{ icone: Package, titulo: "Nenhum bem encontrado", descricao: "Ajuste os filtros ou cadastre um bem." }}
          acoesLinha={(bem) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Ações do bem ${bem.numero_patrimonio || bem.descricao}`}>
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/inventario/bens/${bem.id}`}>
                    <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                    Visualizar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/inventario/bens/${bem.id}/editar`}>
                    <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { void handleGerarQrCode(bem); }}>
                  <QrCode className="w-4 h-4 mr-2" aria-hidden="true" />
                  Gerar QR Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      </div>
    </ModuleLayout>
  );
}
