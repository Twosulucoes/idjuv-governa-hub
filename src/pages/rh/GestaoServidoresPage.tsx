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
  UserX,
  Building2,
  FileDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  type Servidor, 
  type VinculoFuncional,
  type SituacaoFuncional,
  VINCULO_LABELS, 
  SITUACAO_LABELS,
  SITUACAO_COLORS 
} from "@/types/rh";

export default function GestaoServidoresPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVinculo, setFilterVinculo] = useState<string>("all");
  const [filterSituacao, setFilterSituacao] = useState<string>("all");
  const [filterUnidade, setFilterUnidade] = useState<string>("all");

  // Fetch servidores
  const { data: servidores = [], isLoading } = useQuery({
    queryKey: ["servidores-rh"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(`
          *,
          cargo:cargos!servidores_cargo_atual_id_fkey(id, nome, sigla),
          unidade:estrutura_organizacional!servidores_unidade_atual_id_fkey(id, nome, sigla)
        `)
        .eq("ativo", true)
        .order("nome_completo");
      
      if (error) throw error;
      return data as unknown as Servidor[];
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
    
    const matchesVinculo = filterVinculo === "all" || s.vinculo === filterVinculo;
    const matchesSituacao = filterSituacao === "all" || s.situacao === filterSituacao;
    const matchesUnidade = filterUnidade === "all" || s.unidade_atual_id === filterUnidade;
    
    return matchesSearch && matchesVinculo && matchesSituacao && matchesUnidade;
  });

  // Stats
  const totalAtivos = servidores.filter(s => s.situacao === 'ativo').length;
  const totalAfastados = servidores.filter(s => ['afastado', 'licenca', 'ferias', 'cedido'].includes(s.situacao)).length;
  const totalComissionados = servidores.filter(s => s.vinculo === 'comissionado').length;
  const totalEfetivos = servidores.filter(s => s.vinculo === 'efetivo').length;

  const getInitials = (nome: string) => {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
                  Cadastro e gerenciamento de servidores do instituto
                </p>
              </div>
            </div>

            <div className="flex gap-2">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{totalAtivos}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <UserX className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Afastados</p>
                  <p className="text-2xl font-bold">{totalAfastados}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissionados</p>
                  <p className="text-2xl font-bold">{totalComissionados}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-info/10 rounded-lg">
                  <Users className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Efetivos</p>
                  <p className="text-2xl font-bold">{totalEfetivos}</p>
                </div>
              </CardContent>
            </Card>
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
            <Select value={filterVinculo} onValueChange={setFilterVinculo}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Vínculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vínculos</SelectItem>
                {Object.entries(VINCULO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
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
                  <TableHead>CPF</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-center">Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredServidores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                            {servidor.matricula && (
                              <p className="text-xs text-muted-foreground">Mat: {servidor.matricula}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCPF(servidor.cpf)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {VINCULO_LABELS[servidor.vinculo as VinculoFuncional]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {servidor.cargo?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        {servidor.unidade?.sigla || servidor.unidade?.nome || '-'}
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
      </AdminLayout>
    </ProtectedRoute>
  );
}
