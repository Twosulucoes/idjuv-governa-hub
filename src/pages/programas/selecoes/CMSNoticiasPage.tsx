/**
 * CMS NOTÍCIAS - SELEÇÕES ESTUDANTIS
 * Página administrativa para gerenciar notícias e publicações
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Newspaper, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  ExternalLink,
  Loader2
} from "lucide-react";
import { useNoticiasSelecoes, type NoticiaSelecao } from "@/hooks/selecoes/useNoticiasSelecoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIAS = [
  { value: "jogos-juventude", label: "Jogos da Juventude" },
  { value: "jogos-escolares", label: "Jogos Escolares" },
  { value: "seletivas", label: "Seletivas" },
  { value: "resultados", label: "Resultados" },
  { value: "geral", label: "Geral" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  publicado: { label: "Publicado", variant: "default" },
  rascunho: { label: "Rascunho", variant: "secondary" },
  arquivado: { label: "Arquivado", variant: "outline" },
};

export default function CMSNoticiasPage() {
  const { noticias, isLoading, createNoticia, updateNoticia, deleteNoticia } = useNoticiasSelecoes();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noticiaEdit, setNoticiaEdit] = useState<NoticiaSelecao | null>(null);
  const [noticiaDelete, setNoticiaDelete] = useState<NoticiaSelecao | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    resumo: "",
    conteudo: "",
    categoria: "jogos-juventude",
    imagem_destaque_url: "",
    status: "rascunho" as "rascunho" | "publicado" | "arquivado",
    destaque: false,
  });

  const noticiasFiltradas = noticias.filter(n => {
    const matchBusca = n.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || n.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const handleOpenNew = () => {
    setNoticiaEdit(null);
    setForm({
      titulo: "",
      subtitulo: "",
      resumo: "",
      conteudo: "",
      categoria: "jogos-juventude",
      imagem_destaque_url: "",
      status: "rascunho",
      destaque: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (noticia: NoticiaSelecao) => {
    setNoticiaEdit(noticia);
    setForm({
      titulo: noticia.titulo,
      subtitulo: noticia.subtitulo || "",
      resumo: noticia.resumo || "",
      conteudo: noticia.conteudo,
      categoria: noticia.categoria,
      imagem_destaque_url: noticia.imagem_destaque_url || "",
      status: noticia.status,
      destaque: noticia.destaque || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (noticiaEdit) {
      await updateNoticia.mutateAsync({
        id: noticiaEdit.id,
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        resumo: form.resumo || null,
        conteudo: form.conteudo,
        categoria: form.categoria,
        imagem_destaque_url: form.imagem_destaque_url || null,
        status: form.status,
        destaque: form.destaque,
        data_publicacao: form.status === "publicado" ? new Date().toISOString() : null,
      });
    } else {
      await createNoticia.mutateAsync({
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        resumo: form.resumo || null,
        conteudo: form.conteudo,
        categoria: form.categoria,
        imagem_destaque_url: form.imagem_destaque_url || null,
        status: form.status,
        destaque: form.destaque,
        data_publicacao: form.status === "publicado" ? new Date().toISOString() : null,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (noticiaDelete) {
      await deleteNoticia.mutateAsync(noticiaDelete.id);
      setDeleteDialogOpen(false);
      setNoticiaDelete(null);
    }
  };

  const handleToggleDestaque = async (noticia: NoticiaSelecao) => {
    await updateNoticia.mutateAsync({
      id: noticia.id,
      destaque: !noticia.destaque,
    });
  };

  const handleToggleStatus = async (noticia: NoticiaSelecao) => {
    const newStatus = noticia.status === "publicado" ? "rascunho" : "publicado";
    await updateNoticia.mutateAsync({
      id: noticia.id,
      status: newStatus,
      data_publicacao: newStatus === "publicado" ? new Date().toISOString() : null,
    });
  };

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" />
              CMS de Notícias
            </h1>
            <p className="text-muted-foreground">Seleções Estudantis - Jogos da Juventude 2026</p>
          </div>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Notícia
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{noticias.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Publicadas</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {noticias.filter(n => n.status === "publicado").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rascunhos</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {noticias.filter(n => n.status === "rascunho").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Destaques</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {noticias.filter(n => n.destaque).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="publicado">Publicadas</SelectItem>
                  <SelectItem value="rascunho">Rascunhos</SelectItem>
                  <SelectItem value="arquivado">Arquivadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : noticiasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma notícia encontrada</p>
                <Button variant="outline" className="mt-4" onClick={handleOpenNew}>
                  Criar primeira notícia
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noticiasFiltradas.map((noticia) => (
                    <TableRow key={noticia.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleDestaque(noticia)}
                        >
                          {noticia.destaque ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{noticia.titulo}</p>
                          {noticia.subtitulo && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {noticia.subtitulo}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORIAS.find(c => c.value === noticia.categoria)?.label || noticia.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[noticia.status]?.variant || "outline"}>
                          {STATUS_BADGE[noticia.status]?.label || noticia.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(noticia.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(noticia)}
                            title={noticia.status === "publicado" ? "Despublicar" : "Publicar"}
                          >
                            {noticia.status === "publicado" ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(noticia)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setNoticiaDelete(noticia);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog Editor */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{noticiaEdit ? "Editar Notícia" : "Nova Notícia"}</DialogTitle>
              <DialogDescription>
                {noticiaEdit ? "Atualize as informações da notícia" : "Preencha os dados para criar uma nova notícia"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Digite o título da notícia"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="subtitulo">Subtítulo</Label>
                  <Input
                    id="subtitulo"
                    value={form.subtitulo}
                    onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                    placeholder="Subtítulo opcional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                      <SelectItem value="arquivado">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="resumo">Resumo</Label>
                  <Textarea
                    id="resumo"
                    value={form.resumo}
                    onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                    placeholder="Breve resumo para cards e listagens"
                    rows={2}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="conteudo">Conteúdo *</Label>
                  <Textarea
                    id="conteudo"
                    value={form.conteudo}
                    onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                    placeholder="Conteúdo completo da notícia (suporta HTML)"
                    rows={8}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="imagem">URL da Imagem de Destaque</Label>
                  <Input
                    id="imagem"
                    value={form.imagem_destaque_url}
                    onChange={(e) => setForm({ ...form, imagem_destaque_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <Switch
                    checked={form.destaque}
                    onCheckedChange={(checked) => setForm({ ...form, destaque: checked })}
                  />
                  <Label>Marcar como destaque</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!form.titulo || !form.conteudo || createNoticia.isPending || updateNoticia.isPending}
              >
                {(createNoticia.isPending || updateNoticia.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {noticiaEdit ? "Salvar Alterações" : "Criar Notícia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Confirmação Delete */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir notícia?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A notícia "{noticiaDelete?.titulo}" será permanentemente excluída.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ModuleLayout>
  );
}
