/**
 * EDITAIS - MÓDULO TRANSPARÊNCIA
 * Página para gerenciar os editais exibidos no portal público de transparência
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
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  EyeOff,
  Loader2,
  Download,
  FolderOpen,
} from "lucide-react";
import {
  useTransparenciaPublicacoes,
  uploadArquivoPublicacao,
  type PublicacaoOficial,
} from "@/hooks/useTransparenciaPublicacoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EditaisPage() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const {
    publicacoes,
    isLoading,
    createPublicacao,
    updatePublicacao,
    deletePublicacao,
    publicarPublicacao,
    despublicarPublicacao,
  } = useTransparenciaPublicacoes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editalEdit, setEditalEdit] = useState<PublicacaoOficial | null>(null);
  const [editalDelete, setEditalDelete] = useState<PublicacaoOficial | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    arquivo_url: "",
    arquivo_nome: "",
  });

  const editaisFiltrados = publicacoes.filter((p) => {
    const matchBusca = p.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "publicado" && p.publicado) ||
      (filtroStatus === "rascunho" && !p.publicado);
    return matchBusca && matchStatus;
  });

  const handleOpenNew = () => {
    setEditalEdit(null);
    setForm({
      titulo: "",
      descricao: "",
      arquivo_url: "",
      arquivo_nome: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (edital: PublicacaoOficial) => {
    setEditalEdit(edital);
    setForm({
      titulo: edital.titulo,
      descricao: edital.descricao || "",
      arquivo_url: edital.arquivo_url || "",
      arquivo_nome: edital.arquivo_nome || "",
    });
    setDialogOpen(true);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    setUploading(true);
    try {
      const { arquivo_url, arquivo_nome } = await uploadArquivoPublicacao(file);
      setForm((prev) => ({ ...prev, arquivo_url, arquivo_nome }));
    } catch (error: any) {
      console.error("Erro ao enviar arquivo:", error);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async (publicar: boolean) => {
    const payload = {
      titulo: form.titulo,
      categoria: "Edital",
      descricao: form.descricao || null,
      arquivo_url: form.arquivo_url || null,
      arquivo_nome: form.arquivo_nome || null,
      publicado: editalEdit ? editalEdit.publicado : publicar,
    };

    if (editalEdit) {
      await updatePublicacao.mutateAsync({ id: editalEdit.id, ...payload });
      if (publicar && !editalEdit.publicado) {
        await publicarPublicacao.mutateAsync(editalEdit.id);
      }
    } else {
      await createPublicacao.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (editalDelete) {
      await deletePublicacao.mutateAsync(editalDelete);
      setDeleteDialogOpen(false);
      setEditalDelete(null);
    }
  };

  const salvando = createPublicacao.isPending || updatePublicacao.isPending;

  return (
    <ModuleLayout module="transparencia">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Editais
            </h1>
            <p className="text-muted-foreground">
              Gerencie os editais exibidos no Portal de Transparência
            </p>
          </div>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Edital
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{publicacoes.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Publicados (no ar)</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {publicacoes.filter((p) => p.publicado).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rascunhos</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">
                {publicacoes.filter((p) => !p.publicado).length}
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
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : editaisFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum edital encontrado</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenNew}>
                Criar primeiro edital
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {editaisFiltrados.map((edital) => (
              <Card key={edital.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          className={
                            edital.publicado
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {edital.publicado ? "Publicado" : "Rascunho"}
                        </Badge>
                        {edital.data_publicacao && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(edital.data_publicacao), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold truncate">{edital.titulo}</h3>
                      {edital.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {edital.descricao}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {edital.arquivo_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(edital.arquivo_url!, "_blank")}
                          title="Baixar arquivo"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {edital.publicado ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => despublicarPublicacao.mutate(edital.id)}
                          title="Retirar do ar"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => publicarPublicacao.mutate(edital.id)}
                          title="Publicar (colocar no ar)"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(edital)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setEditalDelete(edital);
                          setDeleteDialogOpen(true);
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Criar/Editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editalEdit ? "Editar Edital" : "Novo Edital"}</DialogTitle>
              <DialogDescription>
                {editalEdit
                  ? "Atualize as informações do edital"
                  : "Preencha os dados e anexe o arquivo para publicar no portal de transparência"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Edital *</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Edital nº 001/2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição/Número do processo</Label>
                <Textarea
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição breve do edital"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Arquivo (PDF, DOC, DOCX - máx. 10MB)</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando arquivo...
                  </div>
                )}
                {form.arquivo_nome && !uploading && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {form.arquivo_nome}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                disabled={!form.titulo || salvando || uploading}
              >
                {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar como rascunho
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={!form.titulo || salvando || uploading}
              >
                {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Send className="h-4 w-4 mr-2" />
                Publicar (colocar no ar)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog confirmar exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Edital</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{editalDelete?.titulo}"? Esta ação não pode
                ser desfeita e o arquivo anexado também será removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ModuleLayout>
  );
}
