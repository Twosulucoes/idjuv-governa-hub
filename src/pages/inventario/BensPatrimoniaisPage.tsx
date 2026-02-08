/**
 * GESTÃO DE BENS PATRIMONIAIS
 * Listagem, cadastro e detalhamento de bens permanentes
 */

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Package, Plus, Search, Filter, Eye, Edit, QrCode,
  ArrowLeft, Building2, User, Calendar, Tag, MoreHorizontal
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBensPatrimoniais, useCreateBem } from "@/hooks/usePatrimonio";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CATEGORIAS_BEM = [
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'informatica', label: 'Informática' },
  { value: 'equipamento_esportivo', label: 'Equipamento Esportivo' },
  { value: 'veiculo', label: 'Veículo' },
  { value: 'eletrodomestico', label: 'Eletrodoméstico' },
  { value: 'outros', label: 'Outros' },
];

const SITUACOES_BEM = [
  { value: 'cadastrado', label: 'Cadastrado', color: 'bg-muted' },
  { value: 'tombado', label: 'Tombado', color: 'bg-primary' },
  { value: 'alocado', label: 'Alocado', color: 'bg-success' },
  { value: 'em_manutencao', label: 'Em Manutenção', color: 'bg-warning' },
  { value: 'baixado', label: 'Baixado', color: 'bg-destructive' },
  { value: 'extraviado', label: 'Extraviado', color: 'bg-destructive' },
];

const ESTADOS_CONSERVACAO = [
  { value: 'otimo', label: 'Ótimo' },
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim', label: 'Ruim' },
  { value: 'irrecuperavel', label: 'Irrecuperável' },
];

export default function BensPatrimoniaisPage() {
  const [searchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<string>("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [modalAberto, setModalAberto] = useState(searchParams.get('acao') === 'novo');

  const { data: bens, isLoading } = useBensPatrimoniais({
    situacao: filtroSituacao || undefined,
    categoria_bem: filtroCategoria || undefined,
  });

  const createBem = useCreateBem();

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

  const bensFiltrados = bens?.filter(bem => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      bem.descricao?.toLowerCase().includes(termo) ||
      bem.numero_patrimonio?.toLowerCase().includes(termo) ||
      bem.marca?.toLowerCase().includes(termo)
    );
  });

  const handleCriarBem = async () => {
    if (!novoBem.descricao || !novoBem.categoria_bem || !novoBem.valor_aquisicao || !novoBem.unidade_local_id) {
      toast.error('Preencha os campos obrigatórios (Descrição, Categoria, Valor e Unidade Local)');
      return;
    }

    try {
      // numero_patrimonio será gerado automaticamente pelo trigger
      await createBem.mutateAsync({
        descricao: novoBem.descricao,
        categoria_bem: novoBem.categoria_bem as any,
        marca: novoBem.marca || null,
        modelo: novoBem.modelo || null,
        numero_serie: novoBem.numero_serie || null,
        estado_conservacao: novoBem.estado_conservacao,
        valor_aquisicao: novoBem.valor_aquisicao,
        data_aquisicao: novoBem.data_aquisicao,
        observacao: novoBem.observacao || null,
        situacao: 'cadastrado',
        numero_patrimonio: '', // trigger vai gerar
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

  const getSituacaoBadge = (situacao: string | null) => {
    const sit = SITUACOES_BEM.find(s => s.value === situacao);
    return sit ? (
      <Badge variant="outline" className={`${sit.color} text-white border-0`}>
        {sit.label}
      </Badge>
    ) : (
      <Badge variant="secondary">-</Badge>
    );
  };

  const formatCurrency = (value: number | null) => 
    value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

  return (
    <ModuleLayout module="patrimonio">
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <span>Bens Patrimoniais</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Bens Patrimoniais</h1>
                <p className="opacity-90 text-sm">Cadastro e gestão de bens permanentes</p>
              </div>
            </div>
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Bem
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
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input 
                        id="modelo" 
                        value={novoBem.modelo}
                        onChange={e => setNovoBem(prev => ({ ...prev, modelo: e.target.value }))}
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
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valor">Valor de Aquisição *</Label>
                      <Input 
                        id="valor" 
                        type="number"
                        step="0.01"
                        value={novoBem.valor_aquisicao}
                        onChange={e => setNovoBem(prev => ({ ...prev, valor_aquisicao: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="data">Data de Aquisição *</Label>
                      <Input 
                        id="data" 
                        type="date"
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
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por descrição, patrimônio, marca..."
                  className="pl-10"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>
            <Select value={filtroSituacao || "all"} onValueChange={v => setFiltroSituacao(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {SITUACOES_BEM.map(sit => (
                  <SelectItem key={sit.value} value={sit.value}>{sit.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroCategoria || "all"} onValueChange={v => setFiltroCategoria(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIAS_BEM.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patrimônio</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : bensFiltrados?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum bem encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    bensFiltrados?.map(bem => (
                      <TableRow key={bem.id}>
                        <TableCell className="font-mono text-sm">
                          {bem.numero_patrimonio || <span className="text-muted-foreground">Pendente</span>}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{bem.descricao}</span>
                            {bem.marca && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {bem.marca} {bem.modelo}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {bem.categoria_bem?.replace('_', ' ') || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 className="w-3 h-3 text-primary" />
                            <span className="truncate max-w-[150px]" title={(bem as any).unidade_local?.nome_unidade}>
                              {(bem as any).unidade_local?.nome_unidade || 
                               (bem as any).unidade?.sigla || 
                               <span className="text-destructive text-xs">Sem local</span>}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <User className="w-3 h-3" />
                            {(bem as any).responsavel?.nome_completo?.split(' ').slice(0, 2).join(' ') || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(bem.valor_aquisicao)}</TableCell>
                        <TableCell>{getSituacaoBadge(bem.situacao)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/inventario/bens/${bem.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Visualizar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/inventario/bens/${bem.id}/editar`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <QrCode className="w-4 h-4 mr-2" />
                                Gerar QR Code
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </ModuleLayout>
  );
}
