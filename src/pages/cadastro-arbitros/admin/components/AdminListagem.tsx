import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { MODALIDADES_ESPORTIVAS } from "../../modalidadesEsportivas";
import type { ArbitroCadastro } from "../arbitrosAdminService";

interface Props {
  arbitros: ArbitroCadastro[];
  loading: boolean;
  filtros: { status: string; categoria: string; uf: string; modalidade: string; busca: string };
  setFiltros: (f: any) => void;
  onSelect: (a: ArbitroCadastro) => void;
  onEdit: (a: ArbitroCadastro) => void;
  onDelete: (a: ArbitroCadastro) => void;
  onChangeStatus: (id: string, status: string) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
};

export function AdminListagem({ arbitros, loading, filtros, setFiltros, onSelect, onEdit, onDelete, onChangeStatus }: Props) {
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, CPF, protocolo, email..."
                className="pl-9"
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              />
            </div>
            <Select value={filtros.status} onValueChange={(v) => setFiltros({ ...filtros, status: v })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.categoria} onValueChange={(v) => setFiltros({ ...filtros, categoria: v })}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas categorias</SelectItem>
                <SelectItem value="estadual">Estadual</SelectItem>
                <SelectItem value="nacional">Nacional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.modalidade || "todos"} onValueChange={(v) => setFiltros({ ...filtros, modalidade: v === "todos" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Modalidade" /></SelectTrigger>
              <SelectContent className="max-h-[280px]">
                <SelectItem value="todos">Todas modalidades</SelectItem>
                {MODALIDADES_ESPORTIVAS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : arbitros.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Nenhum cadastro encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arbitros.map((a) => {
                    const badge = STATUS_BADGE[a.status] || STATUS_BADGE.pendente;
                    return (
                      <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">{a.protocolo || "—"}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{a.nome}</TableCell>
                        <TableCell className="text-xs">{a.cpf}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{a.categoria}</Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate">{a.modalidade}</TableCell>
                        <TableCell>{a.uf || "—"}</TableCell>
                        <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSelect(a)} title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(a)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {a.status === "pendente" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => onChangeStatus(a.id, "aprovado")} title="Aprovar">
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onChangeStatus(a.id, "rejeitado")} title="Rejeitar">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(a)} title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Exibindo {arbitros.length} registro(s)
      </p>
    </div>
  );
}
