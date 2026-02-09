/**
 * CMS GALERIA - SELEÇÕES ESTUDANTIS
 * Página administrativa para gerenciar fotos e galeria
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
  Image as ImageIcon, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Grid3X3,
  List,
  Loader2,
  ImagePlus
} from "lucide-react";
import { useGaleriaSelecoes, type FotoGaleria } from "@/hooks/selecoes/useGaleriaSelecoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";

const MODALIDADES = [
  { value: "voleibol", label: "Voleibol" },
  { value: "futsal", label: "Futsal" },
  { value: "basquete", label: "Basquetebol" },
  { value: "handebol", label: "Handebol" },
  { value: "geral", label: "Geral" },
];

const NAIPES = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "misto", label: "Misto" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  publicado: { label: "Publicado", variant: "default" },
  pendente: { label: "Pendente", variant: "secondary" },
  arquivado: { label: "Arquivado", variant: "outline" },
};

export default function CMSGaleriaPage() {
  const { fotos, isLoading, createFoto, updateFoto, deleteFoto } = useGaleriaSelecoes();
  const [busca, setBusca] = useState("");
  const [filtroModalidade, setFiltroModalidade] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fotoEdit, setFotoEdit] = useState<FotoGaleria | null>(null);
  const [fotoDelete, setFotoDelete] = useState<FotoGaleria | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    foto_url: "",
    modalidade: "",
    naipe: "",
    fotografo: "",
    status: "pendente" as "pendente" | "publicado" | "arquivado",
    destaque: false,
  });

  const fotosFiltradas = fotos.filter(f => {
    const matchBusca = f.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchModalidade = filtroModalidade === "todas" || f.modalidade === filtroModalidade;
    const matchStatus = filtroStatus === "todos" || f.status === filtroStatus;
    return matchBusca && matchModalidade && matchStatus;
  });

  const handleOpenNew = () => {
    setFotoEdit(null);
    setForm({
      titulo: "",
      descricao: "",
      foto_url: "",
      modalidade: "",
      naipe: "",
      fotografo: "",
      status: "pendente",
      destaque: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (foto: FotoGaleria) => {
    setFotoEdit(foto);
    setForm({
      titulo: foto.titulo,
      descricao: foto.descricao || "",
      foto_url: foto.foto_url,
      modalidade: foto.modalidade || "",
      naipe: foto.naipe || "",
      fotografo: foto.fotografo || "",
      status: foto.status as any,
      destaque: foto.destaque || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (fotoEdit) {
      await updateFoto.mutateAsync({
        id: fotoEdit.id,
        titulo: form.titulo,
        descricao: form.descricao || null,
        foto_url: form.foto_url,
        modalidade: form.modalidade || null,
        naipe: form.naipe || null,
        fotografo: form.fotografo || null,
        status: form.status,
        destaque: form.destaque,
      });
    } else {
      await createFoto.mutateAsync({
        titulo: form.titulo,
        descricao: form.descricao || null,
        foto_url: form.foto_url,
        modalidade: form.modalidade || null,
        naipe: form.naipe || null,
        fotografo: form.fotografo || null,
        status: form.status,
        destaque: form.destaque,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (fotoDelete) {
      await deleteFoto.mutateAsync(fotoDelete.id);
      setDeleteDialogOpen(false);
      setFotoDelete(null);
    }
  };

  const handleToggleDestaque = async (foto: FotoGaleria) => {
    await updateFoto.mutateAsync({
      id: foto.id,
      destaque: !foto.destaque,
    });
  };

  const handleToggleStatus = async (foto: FotoGaleria) => {
    const newStatus = foto.status === "publicado" ? "pendente" : "publicado";
    await updateFoto.mutateAsync({
      id: foto.id,
      status: newStatus,
    });
  };

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              CMS de Galeria
            </h1>
            <p className="text-muted-foreground">Seleções Estudantis - Jogos da Juventude 2026</p>
          </div>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Foto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Fotos</CardDescription>
              <CardTitle className="text-3xl">{fotos.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Publicadas</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {fotos.filter(f => f.status === "publicado").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {fotos.filter(f => f.status === "pendente").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Destaques</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {fotos.filter(f => f.destaque).length}
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
              <Select value={filtroModalidade} onValueChange={setFiltroModalidade}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {MODALIDADES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="publicado">Publicadas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="arquivado">Arquivadas</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Galeria */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : fotosFiltradas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma foto encontrada</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenNew}>
                Adicionar primeira foto
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {fotosFiltradas.map((foto) => (
              <Card key={foto.id} className="overflow-hidden group">
                <div className="aspect-video relative bg-muted">
                  {foto.foto_url ? (
                    <img
                      src={foto.foto_url}
                      alt={foto.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay de ações */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleEdit(foto)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleToggleStatus(foto)}
                    >
                      {foto.status === "publicado" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setFotoDelete(foto);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Badge destaque */}
                  {foto.destaque && (
                    <div className="absolute top-2 right-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-medium truncate">{foto.titulo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {foto.modalidade && (
                      <Badge variant="outline" className="text-xs">
                        {MODALIDADES.find(m => m.value === foto.modalidade)?.label || foto.modalidade}
                      </Badge>
                    )}
                    <Badge variant={STATUS_BADGE[foto.status]?.variant || "outline"} className="text-xs">
                      {STATUS_BADGE[foto.status]?.label || foto.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {fotosFiltradas.map((foto) => (
                  <div key={foto.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="w-20 h-14 rounded bg-muted overflow-hidden flex-shrink-0">
                      {foto.foto_url ? (
                        <img
                          src={foto.foto_url}
                          alt={foto.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{foto.titulo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {foto.modalidade && (
                          <Badge variant="outline" className="text-xs">
                            {MODALIDADES.find(m => m.value === foto.modalidade)?.label}
                          </Badge>
                        )}
                        <Badge variant={STATUS_BADGE[foto.status]?.variant || "outline"} className="text-xs">
                          {STATUS_BADGE[foto.status]?.label}
                        </Badge>
                        {foto.destaque && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleDestaque(foto)}>
                        {foto.destaque ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(foto)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          setFotoDelete(foto);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog Editor */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{fotoEdit ? "Editar Foto" : "Adicionar Foto"}</DialogTitle>
              <DialogDescription>
                {fotoEdit ? "Atualize as informações da foto" : "Preencha os dados da nova foto"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="foto_url">URL da Imagem *</Label>
                <Input
                  id="foto_url"
                  value={form.foto_url}
                  onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
                  placeholder="https://..."
                />
                {form.foto_url && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-muted aspect-video max-w-[300px]">
                    <img src={form.foto_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Título da foto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição opcional"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <Select value={form.modalidade} onValueChange={(v) => setForm({ ...form, modalidade: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODALIDADES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Naipe</Label>
                  <Select value={form.naipe} onValueChange={(v) => setForm({ ...form, naipe: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {NAIPES.map((n) => (
                        <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                      <SelectItem value="arquivado">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fotografo">Fotógrafo / Créditos</Label>
                <Input
                  id="fotografo"
                  value={form.fotografo}
                  onChange={(e) => setForm({ ...form, fotografo: e.target.value })}
                  placeholder="Nome do fotógrafo"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.destaque}
                  onCheckedChange={(checked) => setForm({ ...form, destaque: checked })}
                />
                <Label>Marcar como destaque</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!form.titulo || !form.foto_url || createFoto.isPending || updateFoto.isPending}
              >
                {(createFoto.isPending || updateFoto.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {fotoEdit ? "Salvar Alterações" : "Adicionar Foto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Confirmação Delete */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A foto "{fotoDelete?.titulo}" será permanentemente excluída.
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
