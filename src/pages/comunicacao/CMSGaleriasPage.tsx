/**
 * CMS GALERIAS - MÓDULO COMUNICAÇÃO
 * Página para gerenciar galerias de fotos
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Camera, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  Send,
  Loader2,
  Image as ImageIcon,
  FolderOpen
} from "lucide-react";
import { useCMSGalerias, useCMSGaleriaFotos, type CMSGaleria } from "@/hooks/cms/useCMSGalerias";
import { DESTINO_LABELS, type CMSDestino } from "@/hooks/cms/useCMSConteudos";
import { GalleryManager, type GalleryPhoto } from "@/components/cms";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  publicado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  arquivado: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  arquivado: "Arquivado",
};

export default function CMSGaleriasPage() {
  const [filtroDestino, setFiltroDestino] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  
  const { galerias, isLoading, createGaleria, updateGaleria, deleteGaleria, publicarGaleria } = useCMSGalerias();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [galeriaEdit, setGaleriaEdit] = useState<CMSGaleria | null>(null);
  const [galeriaDelete, setGaleriaDelete] = useState<CMSGaleria | null>(null);
  const [galeriaPhotos, setGaleriaPhotos] = useState<CMSGaleria | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    destino: "portal_noticias" as CMSDestino,
    categoria: "",
    imagem_capa_url: "",
    status: "rascunho" as "rascunho" | "publicado" | "arquivado",
  });

  // Photos state
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const { fotos: fotosExistentes, syncFotos } = useCMSGaleriaFotos(galeriaPhotos?.id || null);

  const galeriasFiltradas = galerias.filter(g => {
    const matchBusca = g.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchDestino = filtroDestino === "todos" || g.destino === filtroDestino;
    const matchStatus = filtroStatus === "todos" || g.status === filtroStatus;
    return matchBusca && matchDestino && matchStatus;
  });

  const handleOpenNew = () => {
    setGaleriaEdit(null);
    setForm({
      titulo: "",
      descricao: "",
      destino: "portal_noticias",
      categoria: "",
      imagem_capa_url: "",
      status: "rascunho",
    });
    setDialogOpen(true);
  };

  const handleEdit = (galeria: CMSGaleria) => {
    setGaleriaEdit(galeria);
    setForm({
      titulo: galeria.titulo,
      descricao: galeria.descricao || "",
      destino: galeria.destino as CMSDestino,
      categoria: galeria.categoria || "",
      imagem_capa_url: galeria.imagem_capa_url || "",
      status: galeria.status,
    });
    setDialogOpen(true);
  };

  const handleOpenPhotos = (galeria: CMSGaleria) => {
    setGaleriaPhotos(galeria);
    // Converter fotos existentes para o formato do GalleryManager
    const mappedPhotos: GalleryPhoto[] = fotosExistentes.map(f => ({
      id: f.id,
      url: f.url,
      thumbnail_url: f.thumbnail_url || undefined,
      titulo: f.titulo || undefined,
      legenda: f.legenda || undefined,
      ordem: f.ordem,
    }));
    setPhotos(mappedPhotos);
    setPhotosDialogOpen(true);
  };

  const handleSave = async () => {
    if (galeriaEdit) {
      await updateGaleria.mutateAsync({
        id: galeriaEdit.id,
        titulo: form.titulo,
        descricao: form.descricao || null,
        destino: form.destino,
        categoria: form.categoria || null,
        imagem_capa_url: form.imagem_capa_url || null,
        status: form.status,
      });
    } else {
      await createGaleria.mutateAsync({
        titulo: form.titulo,
        descricao: form.descricao || null,
        destino: form.destino,
        categoria: form.categoria || null,
        imagem_capa_url: form.imagem_capa_url || null,
        status: form.status,
      });
    }
    setDialogOpen(false);
  };

  const handleSavePhotos = async () => {
    if (!galeriaPhotos) return;
    
    await syncFotos.mutateAsync({
      galeriaId: galeriaPhotos.id,
      fotos: photos.map(p => ({
        url: p.url,
        thumbnail_url: p.thumbnail_url || null,
        titulo: p.titulo || null,
        legenda: p.legenda || null,
        ordem: p.ordem,
      })),
    });
    setPhotosDialogOpen(false);
  };

  const handleDelete = async () => {
    if (galeriaDelete) {
      await deleteGaleria.mutateAsync(galeriaDelete.id);
      setDeleteDialogOpen(false);
      setGaleriaDelete(null);
    }
  };

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Camera className="h-6 w-6 text-primary" />
              CMS de Galerias
            </h1>
            <p className="text-muted-foreground">Gerenciamento de galerias de fotos</p>
          </div>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Galeria
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{galerias.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Publicadas</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {galerias.filter(g => g.status === "publicado").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rascunhos</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">
                {galerias.filter(g => g.status === "rascunho").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Fotos</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {galerias.reduce((acc, g) => acc + (g.visualizacoes || 0), 0)}
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
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Galerias */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : galeriasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma galeria encontrada</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenNew}>
                Criar primeira galeria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {galeriasFiltradas.map((galeria) => (
              <Card key={galeria.id} className={`overflow-hidden ${galeria.status === 'arquivado' ? 'opacity-60' : ''}`}>
                <div className="aspect-video relative bg-muted">
                  {galeria.imagem_capa_url ? (
                    <img
                      src={galeria.imagem_capa_url}
                      alt={galeria.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={STATUS_COLORS[galeria.status]}>
                      {STATUS_LABELS[galeria.status]}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold truncate">{galeria.titulo}</h3>
                    {galeria.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {galeria.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {DESTINO_LABELS[galeria.destino as CMSDestino] || galeria.destino}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(galeria.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenPhotos(galeria)}
                          title="Gerenciar fotos"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        {galeria.status !== "publicado" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => publicarGaleria.mutate(galeria.id)}
                            title="Publicar"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(galeria)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setGaleriaDelete(galeria);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Editor */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{galeriaEdit ? "Editar Galeria" : "Nova Galeria"}</DialogTitle>
              <DialogDescription>
                {galeriaEdit ? "Atualize as informações da galeria" : "Configure a nova galeria"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Título da galeria"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição da galeria"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label>Status</Label>
                  <Select 
                    value={form.status} 
                    onValueChange={(v: "rascunho" | "publicado" | "arquivado") => setForm({ ...form, status: v })}
                  >
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagem_capa_url">URL da Imagem de Capa</Label>
                <Input
                  id="imagem_capa_url"
                  value={form.imagem_capa_url}
                  onChange={(e) => setForm({ ...form, imagem_capa_url: e.target.value })}
                  placeholder="https://..."
                />
                {form.imagem_capa_url && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-muted aspect-video max-w-[300px]">
                    <img src={form.imagem_capa_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!form.titulo || createGaleria.isPending || updateGaleria.isPending}
              >
                {(createGaleria.isPending || updateGaleria.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Gerenciar Fotos */}
        <Dialog open={photosDialogOpen} onOpenChange={setPhotosDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Fotos</DialogTitle>
              <DialogDescription>
                {galeriaPhotos?.titulo}
              </DialogDescription>
            </DialogHeader>
            
            <GalleryManager
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={50}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setPhotosDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSavePhotos}
                disabled={syncFotos.isPending}
              >
                {syncFotos.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Fotos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog confirmar exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Galeria</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a galeria "{galeriaDelete?.titulo}"?
                Esta ação não pode ser desfeita e todas as fotos serão removidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ModuleLayout>
  );
}
