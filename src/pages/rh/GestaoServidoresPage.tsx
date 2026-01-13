import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Eye,
  Users,
  UserCheck,
  ArrowRightLeft,
  Building2,
  FileDown,
  Briefcase,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { EdicaoLoteBancarioDialog } from "@/components/rh/EdicaoLoteBancarioDialog";
import { useNavigate } from "react-router-dom";
import { 
  type SituacaoFuncional,
  SITUACAO_LABELS,
  SITUACAO_COLORS,
  type TipoServidor,
  TIPO_SERVIDOR_LABELS,
  TIPO_SERVIDOR_COLORS,
} from "@/types/rh";

interface ServidorCompleto {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula?: string;
  foto_url?: string;
  tipo_servidor?: TipoServidor;
  situacao: SituacaoFuncional;
  orgao_origem?: string;
  orgao_destino_cessao?: string;
  funcao_exercida?: string;
  ativo?: boolean;
  cargo?: {
    id: string;
    nome: string;
    sigla?: string;
  };
  unidade?: {
    id: string;
    nome: string;
    sigla?: string;
  };
}

export default function GestaoServidoresPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoServidor, setFilterTipoServidor] = useState<string>("all");
  const [filterSituacao, setFilterSituacao] = useState<string>("all");
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [showEdicaoBancaria, setShowEdicaoBancaria] = useState(false);

  // Fetch servidores
  const { data: servidores = [], isLoading } = useQuery({
    queryKey: ["servidores-rh"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          foto_url,
          tipo_servidor,
          situacao,
          orgao_origem,
          orgao_destino_cessao,
          funcao_exercida,
          ativo,
          banco_codigo,
          banco_agencia,
          banco_conta,
          cargo:cargos!servidores_cargo_atual_id_fkey(id, nome, sigla),
          unidade:estrutura_organizacional!servidores_unidade_atual_id_fkey(id, nome, sigla)
        `)
        .eq("ativo", true)
        .order("nome_completo");
      
      if (error) throw error;
      return data as unknown as (ServidorCompleto & { banco_codigo?: string; banco_agencia?: string; banco_conta?: string })[];
    },
  });

  // Fetch unidades para filtro
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-filtro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Filtros
  const filteredServidores = servidores.filter((s) => {
    const matchesSearch = 
      s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cpf?.includes(searchTerm) ||
      s.matricula?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipoServidor = filterTipoServidor === "all" || s.tipo_servidor === filterTipoServidor;
    const matchesSituacao = filterSituacao === "all" || s.situacao === filterSituacao;
    const matchesUnidade = filterUnidade === "all" || s.unidade?.id === filterUnidade;
    
    return matchesSearch && matchesTipoServidor && matchesSituacao && matchesUnidade;
  });

  // Stats por tipo de servidor
  const totalEfetivos = servidores.filter(s => s.tipo_servidor === 'efetivo_idjuv').length;
  const totalComissionados = servidores.filter(s => s.tipo_servidor === 'comissionado_idjuv').length;
  const totalCedidosEntrada = servidores.filter(s => s.tipo_servidor === 'cedido_entrada').length;
  const totalCedidosSaida = servidores.filter(s => s.tipo_servidor === 'cedido_saida').length;
  const totalSemTipo = servidores.filter(s => !s.tipo_servidor).length;
  const totalSemDadosBancarios = servidores.filter(s => !s.banco_codigo || !s.banco_agencia || !s.banco_conta).length;

  const getInitials = (nome: string) => {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getTipoServidorBadge = (tipo?: TipoServidor) => {
    if (!tipo) {
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          Não classificado
        </Badge>
      );
    }
    return (
      <Badge className={TIPO_SERVIDOR_COLORS[tipo]}>
        {TIPO_SERVIDOR_LABELS[tipo]}
      </Badge>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <AdminLayout>
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Servidores</h1>
                <p className="text-muted-foreground">
                  Cadastro e gerenciamento por tipo de servidor
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {totalSemDadosBancarios > 0 && (
                <Button 
                  variant="outline" 
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={() => setShowEdicaoBancaria(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {totalSemDadosBancarios} sem banco
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowEdicaoBancaria(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Dados Bancários
              </Button>
              <Button variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => navigate('/rh/servidores/novo')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Servidor
              </Button>
            </div>
          </div>

          {/* Stats Cards - Por Tipo de Servidor */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" 
                  onClick={() => setFilterTipoServidor('efetivo_idjuv')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Efetivos IDJuv</p>
                  <p className="text-2xl font-bold">{totalEfetivos}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setFilterTipoServidor('comissionado_idjuv')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissionados</p>
                  <p className="text-2xl font-bold">{totalComissionados}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setFilterTipoServidor('cedido_entrada')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-info/10 rounded-lg">
                  <ArrowRightLeft className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cedidos (Entrada)</p>
                  <p className="text-2xl font-bold">{totalCedidosEntrada}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setFilterTipoServidor('cedido_saida')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cedidos (Saída)</p>
                  <p className="text-2xl font-bold">{totalCedidosSaida}</p>
                </div>
              </CardContent>
            </Card>
            {totalSemTipo > 0 && (
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-destructive/50"
                    onClick={() => setFilterTipoServidor('sem_tipo')}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <Users className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-destructive">Sem Tipo</p>
                    <p className="text-2xl font-bold text-destructive">{totalSemTipo}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipoServidor} onValueChange={setFilterTipoServidor}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Tipo de Servidor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(TIPO_SERVIDOR_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
                <SelectItem value="sem_tipo">Sem classificação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSituacao} onValueChange={setFilterSituacao}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as situações</SelectItem>
                {Object.entries(SITUACAO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.sigla || u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Tipo de Servidor</TableHead>
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Lotação / Órgão</TableHead>
                  <TableHead className="text-center">Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredServidores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum servidor encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServidores.map((servidor) => (
                    <TableRow key={servidor.id} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/rh/servidores/${servidor.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={servidor.foto_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(servidor.nome_completo)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{servidor.nome_completo}</p>
                            <p className="text-xs text-muted-foreground">
                              {servidor.matricula ? `Mat: ${servidor.matricula}` : formatCPF(servidor.cpf)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTipoServidorBadge(servidor.tipo_servidor as TipoServidor)}
                      </TableCell>
                      <TableCell>
                        {servidor.tipo_servidor === 'cedido_entrada' 
                          ? servidor.funcao_exercida || 'Função não informada'
                          : servidor.cargo?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        {servidor.tipo_servidor === 'cedido_entrada' 
                          ? (
                            <div>
                              <p>{servidor.unidade?.sigla || servidor.unidade?.nome || '-'}</p>
                              {servidor.orgao_origem && (
                                <p className="text-xs text-muted-foreground">
                                  Origem: {servidor.orgao_origem}
                                </p>
                              )}
                            </div>
                          )
                          : servidor.tipo_servidor === 'cedido_saida'
                          ? (
                            <div>
                              <p className="text-warning">{servidor.orgao_destino_cessao || 'Órgão não informado'}</p>
                              <p className="text-xs text-muted-foreground">Cedido para outro órgão</p>
                            </div>
                          )
                          : servidor.unidade?.sigla || servidor.unidade?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={SITUACAO_COLORS[servidor.situacao as SituacaoFuncional]}>
                          {SITUACAO_LABELS[servidor.situacao as SituacaoFuncional]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rh/servidores/${servidor.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Dialog de Edição em Lote de Dados Bancários */}
        <EdicaoLoteBancarioDialog
          open={showEdicaoBancaria}
          onOpenChange={setShowEdicaoBancaria}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}
