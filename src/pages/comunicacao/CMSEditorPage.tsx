/**
 * EDITOR DE NOTÍCIAS RICO - CMS
 * Página completa para criar/editar notícias com editor formatado e preview
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save,
  Send,
  Eye,
  Settings,
  Image as ImageIcon,
  FileText,
  Loader2,
  Tag,
  Globe,
  Calendar,
  Star
} from "lucide-react";
import { useCMSConteudos, type CMSConteudo, type CMSDestino, type CMSTipoConteudo, type CMSStatus, DESTINO_LABELS, TIPO_LABELS } from "@/hooks/cms/useCMSConteudos";
import { RichTextEditor, MediaLibrary, type MediaItem } from "@/components/cms";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CMSEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "novo";
  
  const { conteudos, createConteudo, updateConteudo, publicarConteudo } = useCMSConteudos();
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"conteudo" | "seo" | "preview">("conteudo");
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    resumo: "",
    conteudo: "",
    conteudo_html: "",
    tipo: "noticia" as CMSTipoConteudo,
    destino: "portal_noticias" as CMSDestino,
    categoria: "",
    tags: [] as string[],
    imagem_destaque_url: "",
    imagem_destaque_alt: "",
    video_url: "",
    meta_title: "",
    meta_description: "",
    status: "rascunho" as CMSStatus,
    destaque: false,
    data_publicacao: "",
    autor_nome: "",
  });

  const [tagInput, setTagInput] = useState("");

  // Carregar conteúdo existente
  useEffect(() => {
    if (!isNew && id) {
      const conteudo = conteudos.find(c => c.id === id);
      if (conteudo) {
        setForm({
          titulo: conteudo.titulo,
          subtitulo: conteudo.subtitulo || "",
          resumo: conteudo.resumo || "",
          conteudo: conteudo.conteudo || "",
          conteudo_html: conteudo.conteudo_html || "",
          tipo: conteudo.tipo,
          destino: conteudo.destino,
          categoria: conteudo.categoria || "",
          tags: conteudo.tags || [],
          imagem_destaque_url: conteudo.imagem_destaque_url || "",
          imagem_destaque_alt: conteudo.imagem_destaque_alt || "",
          video_url: conteudo.video_url || "",
          meta_title: conteudo.meta_title || "",
          meta_description: conteudo.meta_description || "",
          status: conteudo.status,
          destaque: conteudo.destaque || false,
          data_publicacao: conteudo.data_publicacao || "",
          autor_nome: conteudo.autor_nome || "",
        });
      }
    }
  }, [id, isNew, conteudos]);

  // Gerar slug
  const gerarSlug = (titulo: string) => {
    return titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);
  };

  // Salvar
  const handleSave = async (publicar = false) => {
    if (!form.titulo) {
      toast.error("Título é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const data = {
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        resumo: form.resumo || null,
        conteudo: form.conteudo || null,
        conteudo_html: form.conteudo_html || null,
        tipo: form.tipo,
        destino: form.destino,
        categoria: form.categoria || null,
        tags: form.tags,
        imagem_destaque_url: form.imagem_destaque_url || null,
        imagem_destaque_alt: form.imagem_destaque_alt || null,
        video_url: form.video_url || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        status: publicar ? "publicado" : form.status,
        destaque: form.destaque,
        autor_nome: form.autor_nome || null,
        data_publicacao: publicar ? new Date().toISOString() : form.data_publicacao || null,
      };

      if (isNew) {
        await createConteudo.mutateAsync(data);
        toast.success(publicar ? "Conteúdo publicado!" : "Conteúdo salvo!");
        navigate("/comunicacao/cms/conteudos");
      } else {
        await updateConteudo.mutateAsync({ id: id!, ...data });
        toast.success(publicar ? "Conteúdo publicado!" : "Conteúdo atualizado!");
      }
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Inserir imagem no conteúdo
  const handleInsertImage = () => {
    setMediaLibraryOpen(true);
  };

  const handleSelectMedia = (item: MediaItem) => {
    // Inserir markdown da imagem no conteúdo
    const markdown = `\n![${item.alt_text || item.filename}](${item.url})\n`;
    setForm(prev => ({
      ...prev,
      conteudo: prev.conteudo + markdown
    }));
    setMediaLibraryOpen(false);
  };

  // Adicionar tag
  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Converter markdown para HTML simples para preview
  const convertToHtml = (markdown: string): string => {
    return markdown
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary/30 pl-4 italic my-4">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/comunicacao/cms/conteudos")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isNew ? "Novo Conteúdo" : "Editar Conteúdo"}
              </h1>
              <p className="text-muted-foreground">
                {TIPO_LABELS[form.tipo]} • {DESTINO_LABELS[form.destino]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button 
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          {/* Área principal */}
          <div className="space-y-6">
            {/* Título e Subtítulo */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Digite o título da notícia"
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitulo">Subtítulo</Label>
                  <Input
                    id="subtitulo"
                    value={form.subtitulo}
                    onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                    placeholder="Linha fina ou subtítulo"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabs: Conteúdo, SEO, Preview */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="conteudo" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Conteúdo
                </TabsTrigger>
                <TabsTrigger value="seo" className="gap-2">
                  <Globe className="h-4 w-4" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conteudo" className="mt-4 space-y-4">
                {/* Resumo */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Resumo</CardTitle>
                    <CardDescription>Texto curto exibido nos cards e listagens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={form.resumo}
                      onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                      placeholder="Escreva um resumo atrativo..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {form.resumo.length}/300 caracteres
                    </p>
                  </CardContent>
                </Card>

                {/* Editor Rico */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Conteúdo</CardTitle>
                    <CardDescription>Use markdown para formatar o texto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      value={form.conteudo}
                      onChange={(v) => setForm({ ...form, conteudo: v })}
                      onInsertImage={handleInsertImage}
                      minHeight="400px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Meta Tags SEO</CardTitle>
                    <CardDescription>Otimize para mecanismos de busca</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Meta Título</Label>
                      <Input
                        value={form.meta_title}
                        onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                        placeholder={form.titulo || "Título para SEO"}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(form.meta_title || form.titulo).length}/60 caracteres
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Descrição</Label>
                      <Textarea
                        value={form.meta_description}
                        onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                        placeholder={form.resumo || "Descrição para SEO"}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(form.meta_description || form.resumo).length}/160 caracteres
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview do Google */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Preview no Google</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg space-y-1">
                      <p className="text-primary text-lg hover:underline cursor-pointer">
                        {form.meta_title || form.titulo || "Título da página"}
                      </p>
                      <p className="text-xs text-green-600">
                        https://selelj.rr.gov.br/noticias/{gerarSlug(form.titulo || "exemplo")}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {form.meta_description || form.resumo || "Descrição da página que aparecerá nos resultados de busca..."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <article className="prose prose-lg dark:prose-invert max-w-none">
                      {form.imagem_destaque_url && (
                        <img
                          src={form.imagem_destaque_url}
                          alt={form.imagem_destaque_alt || form.titulo}
                          className="w-full rounded-lg mb-6 aspect-video object-cover"
                        />
                      )}
                      <h1 className="text-3xl font-bold mb-2">{form.titulo || "Título"}</h1>
                      {form.subtitulo && (
                        <p className="text-xl text-muted-foreground mb-4">{form.subtitulo}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        {form.autor_nome && <span>Por {form.autor_nome}</span>}
                        <span>{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                      </div>
                      <Separator className="mb-6" />
                      <div
                        dangerouslySetInnerHTML={{ __html: convertToHtml(form.conteudo) }}
                      />
                    </article>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="flex items-center justify-between">
                  <Label htmlFor="destaque" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Destaque
                  </Label>
                  <Switch
                    id="destaque"
                    checked={form.destaque}
                    onCheckedChange={(checked) => setForm({ ...form, destaque: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autor">Autor</Label>
                  <Input
                    id="autor"
                    value={form.autor_nome}
                    onChange={(e) => setForm({ ...form, autor_nome: e.target.value })}
                    placeholder="Nome do autor"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Imagem de Destaque */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Imagem de Destaque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.imagem_destaque_url ? (
                  <div className="space-y-2">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={form.imagem_destaque_url}
                        alt={form.imagem_destaque_alt || "Preview"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setForm({ ...form, imagem_destaque_url: "", imagem_destaque_alt: "" })}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg border-2 border-dashed flex items-center justify-center">
                    <Button variant="ghost" onClick={() => setMediaLibraryOpen(true)}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Selecionar
                    </Button>
                  </div>
                )}
                <Input
                  value={form.imagem_destaque_url}
                  onChange={(e) => setForm({ ...form, imagem_destaque_url: e.target.value })}
                  placeholder="URL da imagem"
                  className="text-xs"
                />
                <Input
                  value={form.imagem_destaque_alt}
                  onChange={(e) => setForm({ ...form, imagem_destaque_alt: e.target.value })}
                  placeholder="Texto alternativo (alt)"
                  className="text-xs"
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Nova tag"
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button variant="outline" size="icon" onClick={handleAddTag}>
                    +
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categoria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ex: Esportes, Cultura"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibrary
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={(item) => {
          // Se estiver no modo de seleção de imagem de destaque
          setForm(prev => ({
            ...prev,
            imagem_destaque_url: item.url,
            imagem_destaque_alt: item.alt_text || item.filename
          }));
          setMediaLibraryOpen(false);
        }}
        filterType="imagem"
      />
    </ModuleLayout>
  );
}
