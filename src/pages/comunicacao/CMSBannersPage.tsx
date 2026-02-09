/**
 * CMS BANNERS - MÓDULO COMUNICAÇÃO
 * Página para gerenciar banners e destaques visuais do portal
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Image as ImageIcon, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Layers
} from "lucide-react";
import { useCMSBanners, type CMSBanner, POSICAO_LABELS } from "@/hooks/cms/useCMSBanners";
import { DESTINO_LABELS, type CMSDestino } from "@/hooks/cms/useCMSConteudos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CMSBannersPage() {
  const [filtroDestino, setFiltroDestino] = useState<string>("todos");
  const [filtroAtivo, setFiltroAtivo] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  
  const { banners, isLoading, createBanner, updateBanner, deleteBanner, toggleBanner } = useCMSBanners();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerEdit, setBannerEdit] = useState<CMSBanner | null>(null);
  const [bannerDelete, setBannerDelete] = useState<CMSBanner | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    imagem_url: "",
    imagem_mobile_url: "",
    link_url: "",
    link_texto: "",
    link_externo: false,
    destino: "portal_home" as CMSDestino,
    posicao: "hero",
    ativo: true,
    ordem: 0,
  });

  const bannersFiltrados = banners.filter(b => {
    const matchBusca = b.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchDestino = filtroDestino === "todos" || b.destino === filtroDestino;
    const matchAtivo = filtroAtivo === "todos" || 
      (filtroAtivo === "ativos" && b.ativo) || 
      (filtroAtivo === "inativos" && !b.ativo);
    return matchBusca && matchDestino && matchAtivo;
  });

  const handleOpenNew = () => {
    setBannerEdit(null);
    setForm({
      titulo: "",
      subtitulo: "",
      imagem_url: "",
      imagem_mobile_url: "",
      link_url: "",
      link_texto: "",
      link_externo: false,
      destino: "portal_home",
      posicao: "hero",
      ativo: true,
      ordem: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (banner: CMSBanner) => {
    setBannerEdit(banner);
    setForm({
      titulo: banner.titulo,
      subtitulo: banner.subtitulo || "",
      imagem_url: banner.imagem_url,
      imagem_mobile_url: banner.imagem_mobile_url || "",
      link_url: banner.link_url || "",
      link_texto: banner.link_texto || "",
      link_externo: banner.link_externo || false,
      destino: banner.destino,
      posicao: banner.posicao || "hero",
      ativo: banner.ativo ?? true,
      ordem: banner.ordem || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (bannerEdit) {
      await updateBanner.mutateAsync({
        id: bannerEdit.id,
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        imagem_url: form.imagem_url,
        imagem_mobile_url: form.imagem_mobile_url || null,
        link_url: form.link_url || null,
        link_texto: form.link_texto || null,
        link_externo: form.link_externo,
        destino: form.destino,
        posicao: form.posicao,
        ativo: form.ativo,
        ordem: form.ordem,
      });
    } else {
      await createBanner.mutateAsync({
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        imagem_url: form.imagem_url,
        imagem_mobile_url: form.imagem_mobile_url || null,
        link_url: form.link_url || null,
        link_texto: form.link_texto || null,
        link_externo: form.link_externo,
        destino: form.destino,
        posicao: form.posicao,
        ativo: form.ativo,
        ordem: form.ordem,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (bannerDelete) {
      await deleteBanner.mutateAsync(bannerDelete.id);
      setDeleteDialogOpen(false);
      setBannerDelete(null);
    }
  };

  const handleToggleAtivo = async (banner: CMSBanner) => {
    await toggleBanner.mutateAsync({ id: banner.id, ativo: !banner.ativo });
  };

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              CMS de Banners
            </h1>
            <p className="text-muted-foreground">Gerenciamento de banners e destaques visuais</p>
          </div>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Banner
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{banners.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ativos</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {banners.filter(b => b.ativo).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inativos</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">
                {banners.filter(b => !b.ativo).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Posição Hero</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {banners.filter(b => b.posicao === "hero").length}
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
              <Select value={filtroAtivo} onValueChange={setFiltroAtivo}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Banners */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : bannersFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum banner encontrado</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenNew}>
                Criar primeiro banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bannersFiltrados.map((banner) => (
              <Card key={banner.id} className={`overflow-hidden ${!banner.ativo ? 'opacity-60' : ''}`}>
                <div className="aspect-video relative bg-muted">
                  {banner.imagem_url ? (
                    <img
                      src={banner.imagem_url}
                      alt={banner.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay com status */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={banner.ativo ? "default" : "secondary"}>
                      {banner.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {/* Overlay com posição */}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="outline" className="bg-background/80">
                      {POSICAO_LABELS[banner.posicao || "hero"] || banner.posicao}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{banner.titulo}</h3>
                        {banner.subtitulo && (
                          <p className="text-sm text-muted-foreground truncate">{banner.subtitulo}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {DESTINO_LABELS[banner.destino]}
                      </Badge>
                      {banner.link_url && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Link
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(banner.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleAtivo(banner)}
                        >
                          {banner.ativo ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setBannerDelete(banner);
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{bannerEdit ? "Editar Banner" : "Novo Banner"}</DialogTitle>
              <DialogDescription>
                {bannerEdit ? "Atualize as informações do banner" : "Configure o novo banner"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="imagem_url">URL da Imagem *</Label>
                <Input
                  id="imagem_url"
                  value={form.imagem_url}
                  onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                  placeholder="https://..."
                />
                {form.imagem_url && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-muted aspect-video max-w-[400px]">
                    <img src={form.imagem_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Título do banner"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitulo">Subtítulo</Label>
                  <Input
                    id="subtitulo"
                    value={form.subtitulo}
                    onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                    placeholder="Texto secundário"
                  />
                </div>
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
                  <Label>Posição</Label>
                  <Select value={form.posicao} onValueChange={(v) => setForm({ ...form, posicao: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(POSICAO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagem_mobile_url">URL da Imagem Mobile (opcional)</Label>
                <Input
                  id="imagem_mobile_url"
                  value={form.imagem_mobile_url}
                  onChange={(e) => setForm({ ...form, imagem_mobile_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="link_url">URL do Link (opcional)</Label>
                  <Input
                    id="link_url"
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link_texto">Texto do Botão</Label>
                  <Input
                    id="link_texto"
                    value={form.link_texto}
                    onChange={(e) => setForm({ ...form, link_texto: e.target.value })}
                    placeholder="Saiba mais"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem de Exibição</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={form.ordem}
                    onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center gap-6 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.ativo}
                      onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
                    />
                    <Label>Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.link_externo}
                      onCheckedChange={(checked) => setForm({ ...form, link_externo: checked })}
                    />
                    <Label>Link Externo</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!form.titulo || !form.imagem_url || createBanner.isPending || updateBanner.isPending}
              >
                {(createBanner.isPending || updateBanner.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {bannerEdit ? "Salvar Alterações" : "Criar Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Confirmação Delete */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O banner "{bannerDelete?.titulo}" será permanentemente excluído.
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
