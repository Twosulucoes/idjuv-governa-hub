/**
 * GERENCIADOR DE GALERIAS - CMS
 * Componente para criar e gerenciar galerias de fotos com drag-and-drop
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Image,
  Plus,
  Trash2,
  GripVertical,
  Edit,
  X,
  ImagePlus,
  Save,
  ArrowUp,
  ArrowDown,
  Loader2,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MediaLibrary, type MediaItem } from "./MediaLibrary";

export interface GalleryPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  titulo?: string;
  legenda?: string;
  ordem: number;
}

interface GalleryManagerProps {
  photos: GalleryPhoto[];
  onPhotosChange: (photos: GalleryPhoto[]) => void;
  maxPhotos?: number;
  className?: string;
}

export function GalleryManager({
  photos,
  onPhotosChange,
  maxPhotos = 50,
  className
}: GalleryManagerProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [editPhotoDialogOpen, setEditPhotoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhoto | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form state para edição
  const [editForm, setEditForm] = useState({
    titulo: "",
    legenda: ""
  });

  // Adicionar foto da biblioteca
  const handleAddFromLibrary = (item: MediaItem) => {
    if (photos.length >= maxPhotos) {
      toast.error(`Máximo de ${maxPhotos} fotos atingido`);
      return;
    }

    const newPhoto: GalleryPhoto = {
      id: item.id,
      url: item.url,
      thumbnail_url: item.url,
      titulo: item.alt_text || item.filename,
      legenda: "",
      ordem: photos.length
    };

    onPhotosChange([...photos, newPhoto]);
    setMediaLibraryOpen(false);
  };

  // Adicionar múltiplas fotos via URL
  const [addUrlDialogOpen, setAddUrlDialogOpen] = useState(false);
  const [urlsText, setUrlsText] = useState("");

  const handleAddFromUrls = () => {
    const urls = urlsText
      .split("\n")
      .map(u => u.trim())
      .filter(u => u && u.startsWith("http"));

    if (urls.length === 0) {
      toast.error("Nenhuma URL válida encontrada");
      return;
    }

    const remainingSlots = maxPhotos - photos.length;
    if (urls.length > remainingSlots) {
      toast.warning(`Apenas ${remainingSlots} fotos podem ser adicionadas`);
    }

    const newPhotos: GalleryPhoto[] = urls.slice(0, remainingSlots).map((url, i) => ({
      id: `temp-${Date.now()}-${i}`,
      url,
      thumbnail_url: url,
      titulo: "",
      legenda: "",
      ordem: photos.length + i
    }));

    onPhotosChange([...photos, ...newPhotos]);
    setUrlsText("");
    setAddUrlDialogOpen(false);
    toast.success(`${newPhotos.length} foto(s) adicionada(s)`);
  };

  // Editar foto
  const handleEditPhoto = (photo: GalleryPhoto) => {
    setEditingPhoto(photo);
    setEditForm({
      titulo: photo.titulo || "",
      legenda: photo.legenda || ""
    });
    setEditPhotoDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingPhoto) return;

    const updatedPhotos = photos.map(p =>
      p.id === editingPhoto.id
        ? { ...p, titulo: editForm.titulo, legenda: editForm.legenda }
        : p
    );
    onPhotosChange(updatedPhotos);
    setEditPhotoDialogOpen(false);
    setEditingPhoto(null);
  };

  // Deletar foto
  const handleDeletePhoto = () => {
    if (!photoToDelete) return;
    const updatedPhotos = photos
      .filter(p => p.id !== photoToDelete.id)
      .map((p, i) => ({ ...p, ordem: i }));
    onPhotosChange(updatedPhotos);
    setDeleteDialogOpen(false);
    setPhotoToDelete(null);
  };

  // Mover foto para cima/baixo
  const movePhoto = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const newPhotos = [...photos];
    [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
    
    // Atualizar ordem
    newPhotos.forEach((p, i) => {
      p.ordem = i;
    });

    onPhotosChange(newPhotos);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [draggedItem] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dragOverIndex, 0, draggedItem);

    // Atualizar ordem
    newPhotos.forEach((p, i) => {
      p.ordem = i;
    });

    onPhotosChange(newPhotos);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Fotos da Galeria</span>
          <Badge variant="outline">
            {photos.length}/{maxPhotos}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddUrlDialogOpen(true)}
            disabled={photos.length >= maxPhotos}
          >
            <Plus className="h-4 w-4 mr-1" />
            Via URL
          </Button>
          <Button
            size="sm"
            onClick={() => setMediaLibraryOpen(true)}
            disabled={photos.length >= maxPhotos}
          >
            <ImagePlus className="h-4 w-4 mr-1" />
            Da Biblioteca
          </Button>
        </div>
      </div>

      {/* Grid de fotos */}
      {photos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma foto adicionada ainda
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setAddUrlDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar via URL
              </Button>
              <Button onClick={() => setMediaLibraryOpen(true)}>
                <ImagePlus className="h-4 w-4 mr-1" />
                Abrir Biblioteca
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative aspect-square rounded-lg overflow-hidden bg-muted border-2 cursor-move transition-all",
                draggedIndex === index && "opacity-50 scale-95",
                dragOverIndex === index && "border-primary ring-2 ring-primary/50"
              )}
            >
              <img
                src={photo.thumbnail_url || photo.url}
                alt={photo.titulo || `Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Indicador de ordem */}
              <div className="absolute top-2 left-2">
                <Badge className="bg-black/60 text-white hover:bg-black/60">
                  {index + 1}
                </Badge>
              </div>

              {/* Grip para arrastar */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
              </div>

              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
                <div className="flex-1 flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => handleEditPhoto(photo)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => {
                      setPhotoToDelete(photo);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Botões de mover */}
                <div className="flex justify-center gap-1 pb-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 p-0"
                    onClick={() => movePhoto(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 p-0"
                    onClick={() => movePhoto(index, "down")}
                    disabled={index === photos.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              {photo.titulo && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                  <p className="text-white text-xs truncate">{photo.titulo}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog para adicionar via URLs */}
      <Dialog open={addUrlDialogOpen} onOpenChange={setAddUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Fotos via URL</DialogTitle>
            <DialogDescription>
              Cole uma ou mais URLs de imagem (uma por linha)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URLs das imagens</Label>
              <Textarea
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg&#10;..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Cole cada URL em uma linha separada
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUrlDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddFromUrls}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar foto */}
      <Dialog open={editPhotoDialogOpen} onOpenChange={setEditPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Foto</DialogTitle>
            <DialogDescription>
              Atualize as informações da foto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingPhoto && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={editingPhoto.url}
                  alt={editingPhoto.titulo || "Foto"}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={editForm.titulo}
                onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                placeholder="Título da foto"
              />
            </div>
            <div className="space-y-2">
              <Label>Legenda</Label>
              <Textarea
                value={editForm.legenda}
                onChange={(e) => setEditForm({ ...editForm, legenda: e.target.value })}
                placeholder="Descrição ou créditos da foto"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPhotoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Foto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta foto da galeria?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePhoto}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Library Modal */}
      <MediaLibrary
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={handleAddFromLibrary}
        filterType="imagem"
      />
    </div>
  );
}
