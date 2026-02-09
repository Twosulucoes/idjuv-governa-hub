/**
 * CMS CONTEÚDOS - MÓDULO COMUNICAÇÃO
 * Página administrativa centralizada para gerenciar conteúdos de todo o portal
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileText, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Send,
  Loader2,
  Globe,
  Newspaper,
  Calendar,
  Image as ImageIcon,
  Video
} from "lucide-react";
import { 
  useCMSConteudos, 
  useCMSCategorias,
  type CMSConteudo,
  type CMSDestino,
  type CMSTipoConteudo,
  type CMSStatus,
  DESTINO_LABELS,
  TIPO_LABELS,
  STATUS_LABELS
} from "@/hooks/cms/useCMSConteudos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLORS: Record<CMSStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  revisao: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  aprovado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  publicado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  arquivado: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const TIPO_ICONS: Record<CMSTipoConteudo, React.ReactNode> = {
  noticia: <Newspaper className="h-4 w-4" />,
  comunicado: <FileText className="h-4 w-4" />,
  banner: <ImageIcon className="h-4 w-4" />,
  destaque: <Star className="h-4 w-4" />,
  evento: <Calendar className="h-4 w-4" />,
  galeria: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  documento: <FileText className="h-4 w-4" />,
};

export default function CMSConteudosPage() {
  const [filtroDestino, setFiltroDestino] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  
  const { conteudos, isLoading, createConteudo, updateConteudo, deleteConteudo, publicarConteudo, despublicarConteudo } = useCMSConteudos();
  const { categorias } = useCMSCategorias();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conteudoEdit, setConteudoEdit] = useState<CMSConteudo | null>(null);
  const [conteudoDelete, setConteudoDelete] = useState<CMSConteudo | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    resumo: "",
    conteudo: "",
    tipo: "noticia" as CMSTipoConteudo,
    destino: "portal_noticias" as CMSDestino,
    categoria: "",
    imagem_destaque_url: "",
    status: "rascunho" as CMSStatus,
    destaque: false,
  });

  const conteudosFiltrados = conteudos.filter(c => {
    const matchBusca = c.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchDestino = filtroDestino === "todos" || c.destino === filtroDestino;
    const matchTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    return matchBusca && matchDestino && matchTipo && matchStatus;
  });

  // Stats por destino
  const statsPorDestino = Object.entries(DESTINO_LABELS).map(([key, label]) => ({
    destino: key,
    label,
    total: conteudos.filter(c => c.destino === key).length,
    publicados: conteudos.filter(c => c.destino === key && c.status === "publicado").length,
  })).filter(s => s.total > 0);

  const handleOpenNew = () => {
    setConteudoEdit(null);
    setForm({
      titulo: "",
      subtitulo: "",
      resumo: "",
      conteudo: "",
      tipo: "noticia",
      destino: "portal_noticias",
      categoria: "",
      imagem_destaque_url: "",
      status: "rascunho",
      destaque: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (conteudo: CMSConteudo) => {
    setConteudoEdit(conteudo);
    setForm({
      titulo: conteudo.titulo,
      subtitulo: conteudo.subtitulo || "",
      resumo: conteudo.resumo || "",
      conteudo: conteudo.conteudo || "",
      tipo: conteudo.tipo,
      destino: conteudo.destino,
      categoria: conteudo.categoria || "",
      imagem_destaque_url: conteudo.imagem_destaque_url || "",
      status: conteudo.status,
      destaque: conteudo.destaque || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (conteudoEdit) {
      await updateConteudo.mutateAsync({
        id: conteudoEdit.id,
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        resumo: form.resumo || null,
        conteudo: form.conteudo || null,
        tipo: form.tipo,
        destino: form.destino,
        categoria: form.categoria || null,
        imagem_destaque_url: form.imagem_destaque_url || null,
        status: form.status,
        destaque: form.destaque,
      });
    } else {
      await createConteudo.mutateAsync({
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        resumo: form.resumo || null,
        conteudo: form.conteudo || null,
        tipo: form.tipo,
        destino: form.destino,
        categoria: form.categoria || null,
        imagem_destaque_url: form.imagem_destaque_url || null,
        status: form.status,
        destaque: form.destaque,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (conteudoDelete) {
      await deleteConteudo.mutateAsync(conteudoDelete.id);
      setDeleteDialogOpen(false);
      setConteudoDelete(null);
    }
  };

  const handleTogglePublish = async (conteudo: CMSConteudo) => {
    if (conteudo.status === "publicado") {
      await despublicarConteudo.mutateAsync(conteudo.id);
    } else {
      await publicarConteudo.mutateAsync(conteudo.id);
    }
  };

  const handleToggleDestaque = async (conteudo: CMSConteudo) => {
    await updateConteudo.mutateAsync({
      id: conteudo.id,
      destaque: !conteudo.destaque,
    });
  };

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              CMS de Conteúdos
            </h1>
            <p className="text-muted-foreground">Gerenciamento centralizado de conteúdo do portal</p>
          </div>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Conteúdo
          </Button>
        </div>

        {/* Stats Rápidos */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{conteudos.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Publicados</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {conteudos.filter(c => c.status === "publicado").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rascunhos</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">
                {conteudos.filter(c => c.status === "rascunho").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Em Revisão</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {conteudos.filter(c => c.status === "revisao").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Destaques</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {conteudos.filter(c => c.destaque).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroDestino} onValueChange={setFiltroDestino}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Destinos</SelectItem>
                  {Object.entries(DESTINO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  {Object.entries(TIPO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
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
            ) : conteudosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum conteúdo encontrado</p>
                <Button variant="outline" className="mt-4" onClick={handleOpenNew}>
                  Criar primeiro conteúdo
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conteudosFiltrados.map((conteudo) => (
                    <TableRow key={conteudo.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleDestaque(conteudo)}
                        >
                          {conteudo.destaque ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{conteudo.titulo}</p>
                          {conteudo.subtitulo && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {conteudo.subtitulo}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {DESTINO_LABELS[conteudo.destino]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {TIPO_ICONS[conteudo.tipo]}
                          <span className="text-sm">{TIPO_LABELS[conteudo.tipo]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[conteudo.status]}>
                          {STATUS_LABELS[conteudo.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(conteudo.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleTogglePublish(conteudo)}
                            title={conteudo.status === "publicado" ? "Despublicar" : "Publicar"}
                          >
                            {conteudo.status === "publicado" ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(conteudo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setConteudoDelete(conteudo);
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
              <DialogTitle>{conteudoEdit ? "Editar Conteúdo" : "Novo Conteúdo"}</DialogTitle>
              <DialogDescription>
                {conteudoEdit ? "Atualize as informações" : "Preencha os dados do novo conteúdo"}
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
                    placeholder="Digite o título"
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
                  <Label>Destino</Label>
                  <Select value={form.destino} onValueChange={(v: CMSDestino) => setForm({ ...form, destino: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DESTINO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v: CMSTipoConteudo) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v: CMSStatus) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
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
                  <Label htmlFor="conteudo">Conteúdo</Label>
                  <Textarea
                    id="conteudo"
                    value={form.conteudo}
                    onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                    placeholder="Conteúdo completo (suporta HTML)"
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
                disabled={!form.titulo || createConteudo.isPending || updateConteudo.isPending}
              >
                {(createConteudo.isPending || updateConteudo.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {conteudoEdit ? "Salvar Alterações" : "Criar Conteúdo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Confirmação Delete */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O conteúdo "{conteudoDelete?.titulo}" será permanentemente excluído.
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
