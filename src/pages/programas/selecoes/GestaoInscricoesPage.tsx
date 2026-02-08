/**
 * GESTÃO DE INSCRIÇÕES - SELEÇÕES ESTUDANTIS
 * Página administrativa para gerenciar atletas inscritos nas seletivas
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Download, 
  Filter, 
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet
} from "lucide-react";

// Dados mock de inscrições
const inscricoesMock = [
  {
    id: "1",
    nome: "Maria Silva Santos",
    cpf: "123.456.789-00",
    dataNascimento: "2010-05-15",
    idade: 15,
    modalidade: "Voleibol",
    naipe: "Feminino",
    escola: "E.E. Prof. Antônio Ferreira",
    telefone: "(95) 98888-1234",
    email: "maria.silva@email.com",
    status: "aprovado",
    dataInscricao: "2026-02-10T10:30:00"
  },
  {
    id: "2",
    nome: "João Pedro Oliveira",
    cpf: "987.654.321-00",
    dataNascimento: "2009-08-20",
    idade: 16,
    modalidade: "Futsal",
    naipe: "Masculino",
    escola: "E.E. Hélio Campos",
    telefone: "(95) 99999-5678",
    email: "joao.pedro@email.com",
    status: "pendente",
    dataInscricao: "2026-02-11T14:15:00"
  },
  {
    id: "3",
    nome: "Ana Carolina Lima",
    cpf: "456.789.123-00",
    dataNascimento: "2011-03-10",
    idade: 15,
    modalidade: "Basquetebol",
    naipe: "Feminino",
    escola: "Colégio Estadual de Boa Vista",
    telefone: "(95) 98765-4321",
    email: "ana.lima@email.com",
    status: "pendente",
    dataInscricao: "2026-02-12T09:45:00"
  },
  {
    id: "4",
    nome: "Lucas Mendes Costa",
    cpf: "321.654.987-00",
    dataNascimento: "2010-11-25",
    idade: 15,
    modalidade: "Handebol",
    naipe: "Masculino",
    escola: "E.E. Maria das Dores",
    telefone: "(95) 97777-8888",
    email: "lucas.mendes@email.com",
    status: "rejeitado",
    dataInscricao: "2026-02-09T16:20:00"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "aprovado":
      return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
    case "pendente":
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    case "rejeitado":
      return <Badge className="bg-red-500/10 text-red-600 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function GestaoInscricoesPage() {
  const [busca, setBusca] = useState("");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("todas");
  const [naipeFiltro, setNaipeFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [inscricaoSelecionada, setInscricaoSelecionada] = useState<typeof inscricoesMock[0] | null>(null);

  const inscricoesFiltradas = inscricoesMock.filter(inscricao => {
    const matchBusca = inscricao.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       inscricao.cpf.includes(busca) ||
                       inscricao.escola.toLowerCase().includes(busca.toLowerCase());
    const matchModalidade = modalidadeFiltro === "todas" || inscricao.modalidade === modalidadeFiltro;
    const matchNaipe = naipeFiltro === "todos" || inscricao.naipe === naipeFiltro;
    const matchStatus = statusFiltro === "todos" || inscricao.status === statusFiltro;
    return matchBusca && matchModalidade && matchNaipe && matchStatus;
  });

  const stats = {
    total: inscricoesMock.length,
    aprovados: inscricoesMock.filter(i => i.status === "aprovado").length,
    pendentes: inscricoesMock.filter(i => i.status === "pendente").length,
    rejeitados: inscricoesMock.filter(i => i.status === "rejeitado").length,
  };

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Gestão de Inscrições
            </h1>
            <p className="text-muted-foreground">Seleções Estudantis - Jogos da Juventude 2026</p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Inscritos</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aprovados</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.aprovados}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.pendentes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rejeitados</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.rejeitados}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF ou escola..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={modalidadeFiltro} onValueChange={setModalidadeFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Modalidades</SelectItem>
                  <SelectItem value="Voleibol">Voleibol</SelectItem>
                  <SelectItem value="Futsal">Futsal</SelectItem>
                  <SelectItem value="Basquetebol">Basquetebol</SelectItem>
                  <SelectItem value="Handebol">Handebol</SelectItem>
                </SelectContent>
              </Select>
              <Select value={naipeFiltro} onValueChange={setNaipeFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Naipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Naipes</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Naipe</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Data Inscrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscricoesFiltradas.map((inscricao) => (
                  <TableRow key={inscricao.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inscricao.nome}</p>
                        <p className="text-sm text-muted-foreground">{inscricao.idade} anos</p>
                      </div>
                    </TableCell>
                    <TableCell>{inscricao.modalidade}</TableCell>
                    <TableCell>{inscricao.naipe}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{inscricao.escola}</TableCell>
                    <TableCell>
                      {new Date(inscricao.dataInscricao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(inscricao.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setInscricaoSelecionada(inscricao)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog Detalhes */}
        <Dialog open={!!inscricaoSelecionada} onOpenChange={() => setInscricaoSelecionada(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Inscrição</DialogTitle>
              <DialogDescription>Informações completas do atleta</DialogDescription>
            </DialogHeader>
            {inscricaoSelecionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{inscricaoSelecionada.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{inscricaoSelecionada.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Nascimento</p>
                    <p className="font-medium">
                      {new Date(inscricaoSelecionada.dataNascimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Idade</p>
                    <p className="font-medium">{inscricaoSelecionada.idade} anos</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modalidade</p>
                    <p className="font-medium">{inscricaoSelecionada.modalidade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Naipe</p>
                    <p className="font-medium">{inscricaoSelecionada.naipe}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Escola</p>
                    <p className="font-medium">{inscricaoSelecionada.escola}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{inscricaoSelecionada.telefone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{inscricaoSelecionada.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(inscricaoSelecionada.status)}</div>
                  </div>
                </div>
                
                {inscricaoSelecionada.status === "pendente" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button variant="destructive" className="flex-1 gap-2">
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
