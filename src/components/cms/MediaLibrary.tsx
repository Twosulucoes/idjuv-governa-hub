/**
 * BIBLIOTECA DE MÍDIA - CMS
 * Modal para gerenciar arquivos de mídia (imagens, vídeos)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Image,
  Upload,
  Search,
  Grid,
  List,
  Loader2,
  Check,
  Trash2,
  ExternalLink,
  Copy,
  ImagePlus,
  Video,
  File
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  alt_text?: string;
  tipo: "imagem" | "video" | "documento";
  tamanho_bytes?: number;
  created_at: string;
  created_by?: string;
}

interface MediaLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (item: MediaItem) => void;
  multiSelect?: boolean;
  filterType?: "imagem" | "video" | "documento" | "all";
}

export function MediaLibrary({
  open,
  onOpenChange,
  onSelect,
  multiSelect = false,
  filterType = "all"
}: MediaLibraryProps) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [activeTab, setActiveTab] = useState<"biblioteca" | "upload">("biblioteca");
  const [tipoFiltro, setTipoFiltro] = useState<string>("all");

  // Buscar mídias do banco usando raw query para evitar problemas de tipos
  const { data: medias = [], isLoading } = useQuery({
    queryKey: ["cms-media", tipoFiltro],
    queryFn: async () => {
      let query = supabase
        .from("cms_media" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (tipoFiltro !== "all") {
        query = query.eq("tipo", tipoFiltro);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as MediaItem[];
    },
    enabled: open
  });

  // Adicionar mídia via URL
  const addMedia = useMutation({
    mutationFn: async (input: { url: string; alt_text?: string; filename?: string }) => {
      // Detectar tipo baseado na extensão
      const url = input.url.toLowerCase();
      let tipo: "imagem" | "video" | "documento" = "imagem";
      if (url.match(/\.(mp4|webm|mov|avi)(\?.*)?$/)) {
        tipo = "video";
      } else if (url.match(/\.(pdf|doc|docx|xls|xlsx)(\?.*)?$/)) {
        tipo = "documento";
      }

      const filename = input.filename || input.url.split("/").pop()?.split("?")[0] || "arquivo";

      const { data, error } = await supabase
        .from("cms_media" as any)
        .insert({
          url: input.url,
          filename,
          alt_text: input.alt_text,
          tipo
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as MediaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-media"] });
      toast.success("Mídia adicionada com sucesso!");
      setUploadUrl("");
      setUploadAlt("");
      setActiveTab("biblioteca");
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar mídia: " + error.message);
    }
  });

  // Deletar mídia
  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cms_media" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-media"] });
      toast.success("Mídia removida!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover: " + error.message);
    }
  });

  const handleAddUrl = () => {
    if (!uploadUrl) {
      toast.error("Informe a URL da mídia");
      return;
    }
    addMedia.mutate({ url: uploadUrl, alt_text: uploadAlt });
  };

  const handleSelect = (item: MediaItem) => {
    if (multiSelect) {
      const isSelected = selectedItems.some(i => i.id === item.id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter(i => i.id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item]);
      }
    } else {
      if (onSelect) {
        onSelect(item);
        onOpenChange(false);
      }
    }
  };

  const handleConfirmSelection = () => {
    if (selectedItems.length > 0 && onSelect) {
      selectedItems.forEach(item => onSelect(item));
      onOpenChange(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const mediasFiltradas = medias.filter(m => {
    const matchBusca = m.filename.toLowerCase().includes(busca.toLowerCase()) ||
      m.alt_text?.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filterType === "all" || m.tipo === filterType;
    return matchBusca && matchTipo;
  });

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "video": return <Video className="h-4 w-4" />;
      case "documento": return <File className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Biblioteca de Mídia
          </DialogTitle>
          <DialogDescription>
            Gerencie e selecione arquivos de mídia para seu conteúdo
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "biblioteca" | "upload")} className="flex-1 flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="biblioteca" className="gap-2">
              <Grid className="h-4 w-4" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Adicionar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="biblioteca" className="flex-1 flex flex-col mt-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filterType === "all" && (
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="imagem">Imagens</SelectItem>
                    <SelectItem value="video">Vídeos</SelectItem>
                    <SelectItem value="documento">Documentos</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lista de mídias */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : mediasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma mídia encontrada</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("upload")}
                  >
                    Adicionar primeira mídia
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {mediasFiltradas.map((item) => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group relative aspect-square rounded-lg overflow-hidden bg-muted border-2 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                          isSelected && "ring-2 ring-primary border-primary"
                        )}
                        onClick={() => handleSelect(item)}
                      >
                        {item.tipo === "imagem" ? (
                          <img
                            src={item.url}
                            alt={item.alt_text || item.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getTipoIcon(item.tipo)}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-8 w-8 text-primary" />
                          </div>
                        )}
                        {/* Overlay com ações */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyUrl(item.url);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.url, "_blank");
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMedia.mutate(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {mediasFiltradas.map((item) => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                          isSelected && "bg-primary/5 border-primary"
                        )}
                        onClick={() => handleSelect(item)}
                      >
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {item.tipo === "imagem" ? (
                            <img
                              src={item.url}
                              alt={item.alt_text || item.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getTipoIcon(item.tipo)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.filename}</p>
                          {item.alt_text && (
                            <p className="text-sm text-muted-foreground truncate">{item.alt_text}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs gap-1">
                              {getTipoIcon(item.tipo)}
                              {item.tipo}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyUrl(item.url);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMedia.mutate(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer com seleção */}
            {multiSelect && selectedItems.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length} item(s) selecionado(s)
                </span>
                <Button onClick={handleConfirmSelection}>
                  Confirmar Seleção
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="flex-1 mt-4">
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  Adicione uma mídia via URL externa
                </p>
                <p className="text-xs text-muted-foreground">
                  Suporta imagens, vídeos e documentos
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL da mídia *</Label>
                  <Input
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto alternativo (alt)</Label>
                  <Input
                    value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    placeholder="Descrição da imagem para acessibilidade"
                  />
                </div>

                {/* Preview */}
                {uploadUrl && (
                  <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                    <img
                      src={uploadUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <Button
                  onClick={handleAddUrl}
                  disabled={!uploadUrl || addMedia.isPending}
                  className="w-full"
                >
                  {addMedia.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Adicionar Mídia
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
