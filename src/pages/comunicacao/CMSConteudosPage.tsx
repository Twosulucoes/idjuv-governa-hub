/**
 * CMS CONTEÚDOS - MÓDULO COMUNICAÇÃO
 * Página administrativa centralizada para gerenciar conteúdos de todo o portal
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from "@/components/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Situação do conteúdo → rótulo (caixa de frase) e tom do StatusBadge
const STATUS_CONTEUDO: Record<CMSStatus, { label: string; tom: TomStatus }> = {
  rascunho: { label: "Rascunho", tom: "neutro" },
  revisao: { label: "Em revisão", tom: "pendente" },
  aprovado: { label: "Aprovado", tom: "andamento" },
  publicado: { label: "Publicado", tom: "sucesso" },
  arquivado: { label: "Arquivado", tom: "neutro" },
};

const statusConteudo = (s: string | null | undefined) =>
  STATUS_CONTEUDO[s as CMSStatus] ?? { label: s ?? "Sem situação", tom: "neutro" as TomStatus };

const TIPO_ICONS: Record<CMSTipoConteudo, React.ReactNode> = {
  noticia: <Newspaper className="h-4 w-4" aria-hidden="true" />,
  comunicado: <FileText className="h-4 w-4" aria-hidden="true" />,
  banner: <ImageIcon className="h-4 w-4" aria-hidden="true" />,
  destaque: <Star className="h-4 w-4" aria-hidden="true" />,
  evento: <Calendar className="h-4 w-4" aria-hidden="true" />,
  galeria: <ImageIcon className="h-4 w-4" aria-hidden="true" />,
  video: <Video className="h-4 w-4" aria-hidden="true" />,
  documento: <FileText className="h-4 w-4" aria-hidden="true" />,
};

export default function CMSConteudosPage() {
  const [filtroDestino, setFiltroDestino] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  
  const { conteudos, isLoading, error, createConteudo, updateConteudo, deleteConteudo, publicarConteudo, despublicarConteudo } = useCMSConteudos();
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
    const matchDestino = filtroDestino === "todos" || c.destino === filtroDestino;
    const matchTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    return matchDestino && matchTipo && matchStatus;
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

  const colunas: ColunaTabela<CMSConteudo>[] = [
    {
      id: "destaque",
      cabecalho: <span className="sr-only">Destaque</span>,
      className: "w-[40px]",
      celula: (conteudo) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-pressed={!!conteudo.destaque}
          aria-label={`${conteudo.destaque ? "Remover destaque de" : "Destacar"} ${conteudo.titulo}`}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleDestaque(conteudo);
          }}
        >
          {conteudo.destaque ? (
            <Star className="h-4 w-4 text-warning fill-warning" aria-hidden="true" />
          ) : (
            <StarOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      ),
      ordenarPor: (c) => (c.destaque ? 1 : 0),
    },
    {
      id: "titulo",
      cabecalho: "Título",
      mobile: "titulo",
      celula: (conteudo) => (
        <div>
          <p className="font-medium">{conteudo.titulo}</p>
          {conteudo.subtitulo && (
            <p className="text-body text-muted-foreground truncate max-w-[300px]">{conteudo.subtitulo}</p>
          )}
        </div>
      ),
      ordenarPor: (c) => c.titulo,
      buscarPor: (c) => c.titulo,
    },
    {
      id: "destino",
      cabecalho: "Destino",
      celula: (conteudo) => <Badge variant="outline">{DESTINO_LABELS[conteudo.destino]}</Badge>,
      ordenarPor: (c) => DESTINO_LABELS[c.destino],
    },
    {
      id: "tipo",
      cabecalho: "Tipo",
      celula: (conteudo) => (
        <div className="flex items-center gap-2">
          {TIPO_ICONS[conteudo.tipo]}
          <span className="text-body">{TIPO_LABELS[conteudo.tipo]}</span>
        </div>
      ),
      ordenarPor: (c) => TIPO_LABELS[c.tipo],
    },
    {
      id: "status",
      cabecalho: "Situação",
      celula: (conteudo) => {
        const st = statusConteudo(conteudo.status);
        return <StatusBadge tom={st.tom}>{st.label}</StatusBadge>;
      },
      ordenarPor: (c) => statusConteudo(c.status).label,
    },
    {
      id: "data",
      cabecalho: "Data",
      className: "text-muted-foreground",
      celula: (conteudo) => format(new Date(conteudo.created_at), "dd/MM/yyyy", { locale: ptBR }),
      ordenarPor: (c) => new Date(c.created_at),
    },
  ];

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Comunicação", href: "/comunicacao" }, { rotulo: "Conteúdos" }]}
          titulo="CMS de conteúdos"
          descricao="Gerenciamento centralizado de conteúdo do portal"
          acoes={
            <Button onClick={handleOpenNew} className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo conteúdo
            </Button>
          }
        />

        {/* Indicadores */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <KpiCard rotulo="Total" valor={conteudos.length} icone={Globe} carregando={isLoading} />
          <KpiCard
            rotulo="Publicados"
            valor={conteudos.filter(c => c.status === "publicado").length}
            icone={Send}
            carregando={isLoading}
          />
          <KpiCard
            rotulo="Rascunhos"
            valor={conteudos.filter(c => c.status === "rascunho").length}
            icone={FileText}
            carregando={isLoading}
          />
          <KpiCard
            rotulo="Em revisão"
            valor={conteudos.filter(c => c.status === "revisao").length}
            icone={Eye}
            carregando={isLoading}
          />
          <KpiCard
            rotulo="Destaques"
            valor={conteudos.filter(c => c.destaque).length}
            icone={Star}
            carregando={isLoading}
          />
        </div>

        {/* Tabela */}
        <DataTable
          rotulo="Conteúdos do portal"
          dados={conteudosFiltrados}
          colunas={colunas}
          chaveLinha={(c) => c.id}
          carregando={isLoading}
          erro={error ? "Não foi possível carregar os conteúdos." : null}
          busca={{ placeholder: "Buscar por título..." }}
          filtros={
            <>
              <Select value={filtroDestino} onValueChange={setFiltroDestino}>
                <SelectTrigger className="w-[180px]" aria-label="Filtrar por destino">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os destinos</SelectItem>
                  {Object.entries(DESTINO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[150px]" aria-label="Filtrar por tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {Object.entries(TIPO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[150px]" aria-label="Filtrar por situação">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as situações</SelectItem>
                  {Object.entries(STATUS_CONTEUDO).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          vazio={{
            icone: FileText,
            titulo: "Nenhum conteúdo encontrado",
            descricao: conteudos.length > 0 ? "Ajuste os filtros." : undefined,
            acao:
              conteudos.length === 0 ? (
                <Button variant="outline" onClick={handleOpenNew}>
                  Criar primeiro conteúdo
                </Button>
              ) : undefined,
          }}
          acoesLinha={(conteudo) => (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleTogglePublish(conteudo)}
                aria-label={`${conteudo.status === "publicado" ? "Despublicar" : "Publicar"} ${conteudo.titulo}`}
                title={conteudo.status === "publicado" ? "Despublicar" : "Publicar"}
              >
                {conteudo.status === "publicado" ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Editar ${conteudo.titulo}`}
                onClick={() => handleEdit(conteudo)}
              >
                <Edit className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                aria-label={`Excluir ${conteudo.titulo}`}
                onClick={() => {
                  setConteudoDelete(conteudo);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        />

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
                    <SelectTrigger aria-label="Destino">
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
                    <SelectTrigger aria-label="Tipo">
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
                    <SelectTrigger aria-label="Categoria">
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
                    <SelectTrigger aria-label="Situação">
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
                    id="conteudo_destaque"
                    checked={form.destaque}
                    onCheckedChange={(checked) => setForm({ ...form, destaque: checked })}
                  />
                  <Label htmlFor="conteudo_destaque">Marcar como destaque</Label>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                )}
                {conteudoEdit ? "Salvar alterações" : "Criar conteúdo"}
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
