import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Upload,
  Loader2,
  Building2,
  Users,
  Briefcase,
} from "lucide-react";

type StatusDocumento = 'rascunho' | 'aguardando_publicacao' | 'publicado' | 'vigente' | 'revogado';
type TipoDocumento = 'portaria' | 'resolucao' | 'instrucao_normativa' | 'ordem_servico' | 'comunicado' | 'decreto' | 'lei' | 'outro';
type CategoriaPortaria = 'estruturante' | 'normativa' | 'pessoal' | 'delegacao';

interface Documento {
  id: string;
  numero: string;
  titulo: string;
  ementa: string | null;
  tipo: TipoDocumento;
  status: StatusDocumento;
  categoria: CategoriaPortaria;
  data_documento: string;
  data_publicacao: string | null;
  data_vigencia_inicio: string | null;
  data_vigencia_fim: string | null;
  arquivo_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<StatusDocumento, { label: string; tom: TomStatus; icone: LucideIcon }> = {
  rascunho: { label: "Rascunho", tom: "neutro", icone: FileText },
  aguardando_publicacao: { label: "Aguardando publicação", tom: "pendente", icone: Clock },
  publicado: { label: "Publicado", tom: "andamento", icone: Send },
  vigente: { label: "Vigente", tom: "sucesso", icone: CheckCircle },
  revogado: { label: "Revogado", tom: "erro", icone: XCircle },
};

const tipoConfig: Record<TipoDocumento, string> = {
  portaria: "Portaria",
  resolucao: "Resolução",
  instrucao_normativa: "Instrução normativa",
  ordem_servico: "Ordem de serviço",
  comunicado: "Comunicado",
  decreto: "Decreto",
  lei: "Lei",
  outro: "Outro",
};

const categoriaConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  estruturante: { label: "Estruturante", icon: <Building2 className="h-3 w-3" aria-hidden="true" /> },
  normativa: { label: "Normativa", icon: <FileText className="h-3 w-3" aria-hidden="true" /> },
  pessoal: { label: "Pessoal", icon: <Users className="h-3 w-3" aria-hidden="true" /> },
  delegacao: { label: "Delegação", icon: <Briefcase className="h-3 w-3" aria-hidden="true" /> },
};

const initialFormData = {
  numero: "",
  titulo: "",
  ementa: "",
  tipo: "portaria" as TipoDocumento,
  status: "rascunho" as StatusDocumento,
  categoria: "" as string,
  data_documento: format(new Date(), "yyyy-MM-dd"),
  data_publicacao: "",
  data_vigencia_inicio: "",
  data_vigencia_fim: "",
  arquivo_url: "",
  observacoes: "",
};

export default function GestaoDocumentosPage() {
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();

  const { data: documentos, isLoading, isError, refetch } = useQuery({
    queryKey: ["documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Documento[];
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("documentos")
        .getPublicUrl(data.path);

      setFormData({ ...formData, arquivo_url: urlData.publicUrl });
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const insertData: any = {
        numero: data.numero,
        titulo: data.titulo,
        ementa: data.ementa || null,
        tipo: data.tipo,
        status: data.status,
        data_documento: data.data_documento,
        data_publicacao: data.data_publicacao || null,
        data_vigencia_inicio: data.data_vigencia_inicio || null,
        data_vigencia_fim: data.data_vigencia_fim || null,
        arquivo_url: data.arquivo_url || null,
        observacoes: data.observacoes || null,
      };
      if (data.categoria) {
        insertData.categoria = data.categoria as CategoriaPortaria;
      }
      const { error } = await supabase.from("documentos").insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      toast.success("Documento criado com sucesso!");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao criar documento: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const updateData: any = {
        numero: data.numero,
        titulo: data.titulo,
        ementa: data.ementa || null,
        tipo: data.tipo,
        status: data.status,
        categoria: data.categoria ? (data.categoria as CategoriaPortaria) : null,
        data_documento: data.data_documento,
        data_publicacao: data.data_publicacao || null,
        data_vigencia_inicio: data.data_vigencia_inicio || null,
        data_vigencia_fim: data.data_vigencia_fim || null,
        arquivo_url: data.arquivo_url || null,
        observacoes: data.observacoes || null,
      };
      const { error } = await supabase
        .from("documentos")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      toast.success("Documento atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar documento: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      toast.success("Documento excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir documento: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDoc(null);
    setFormData(initialFormData);
  };

  const handleEdit = (doc: Documento) => {
    setEditingDoc(doc);
    setFormData({
      numero: doc.numero,
      titulo: doc.titulo,
      ementa: doc.ementa || "",
      tipo: doc.tipo,
      status: doc.status,
      categoria: doc.categoria || "",
      data_documento: doc.data_documento,
      data_publicacao: doc.data_publicacao || "",
      data_vigencia_inicio: doc.data_vigencia_inicio || "",
      data_vigencia_fim: doc.data_vigencia_fim || "",
      arquivo_url: doc.arquivo_url || "",
      observacoes: doc.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePublicar = async (doc: Documento) => {
    const { error } = await supabase
      .from("documentos")
      .update({ 
        status: "publicado" as StatusDocumento,
        data_publicacao: format(new Date(), "yyyy-MM-dd")
      })
      .eq("id", doc.id);
    
    if (error) {
      toast.error("Erro ao publicar documento");
    } else {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      toast.success("Documento publicado com sucesso!");
    }
  };

  // A busca textual (número, título, ementa) fica no DataTable.
  const filteredDocs = documentos?.filter((doc) => {
    const matchesStatus = filterStatus === "todos" || doc.status === filterStatus;
    const matchesTipo = filterTipo === "todos" || doc.tipo === filterTipo;
    
    return matchesStatus && matchesTipo;
  });

  const statusCounts = documentos?.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const colunas: ColunaTabela<Documento>[] = [
    {
      id: "numero",
      cabecalho: "Número",
      celula: (doc) => <span className="font-medium">{doc.numero}</span>,
      ordenarPor: (doc) => doc.numero,
      buscarPor: (doc) => doc.numero,
    },
    {
      id: "tipo",
      cabecalho: "Tipo",
      celula: (doc) => tipoConfig[doc.tipo],
      ordenarPor: (doc) => tipoConfig[doc.tipo],
    },
    {
      id: "categoria",
      cabecalho: "Categoria",
      celula: (doc) =>
        doc.categoria && categoriaConfig[doc.categoria] ? (
          <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
            {categoriaConfig[doc.categoria].icon}
            {categoriaConfig[doc.categoria].label}
          </span>
        ) : null,
      ordenarPor: (doc) => doc.categoria,
    },
    {
      id: "titulo",
      cabecalho: "Título",
      celula: (doc) => <span className="block max-w-xs truncate" title={doc.titulo}>{doc.titulo}</span>,
      ordenarPor: (doc) => doc.titulo,
      buscarPor: (doc) => `${doc.titulo} ${doc.ementa ?? ""}`,
      mobile: "titulo",
    },
    {
      id: "data",
      cabecalho: "Data",
      celula: (doc) => format(new Date(doc.data_documento), "dd/MM/yyyy", { locale: ptBR }),
      ordenarPor: (doc) => doc.data_documento,
    },
    {
      id: "status",
      cabecalho: "Situação",
      celula: (doc) => (
        <StatusBadge tom={statusConfig[doc.status]?.tom ?? "neutro"}>
          {statusConfig[doc.status]?.label ?? doc.status}
        </StatusBadge>
      ),
      ordenarPor: (doc) => doc.status,
    },
  ];

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Gestão de documentos" }]}
          titulo="Gestão de documentos"
          descricao="Gerencie portarias, resoluções, instruções normativas e demais documentos oficiais"
          acoes={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingDoc(null); setFormData(initialFormData); }}>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Novo documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDoc ? "Editar documento" : "Novo documento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Ex: 001/2024"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v) => setFormData({ ...formData, tipo: v as TipoDocumento })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tipoConfig).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.tipo === "portaria" && (
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria da Portaria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estruturante">Estruturante</SelectItem>
                        <SelectItem value="normativa">Normativa</SelectItem>
                        <SelectItem value="pessoal">Pessoal</SelectItem>
                        <SelectItem value="delegacao">Delegação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título do documento"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ementa">Ementa</Label>
                  <Textarea
                    id="ementa"
                    value={formData.ementa}
                    onChange={(e) => setFormData({ ...formData, ementa: e.target.value })}
                    placeholder="Resumo do conteúdo do documento"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as StatusDocumento })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_documento">Data do Documento *</Label>
                    <Input
                      id="data_documento"
                      type="date"
                      value={formData.data_documento}
                      onChange={(e) => setFormData({ ...formData, data_documento: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_publicacao">Data de Publicação</Label>
                    <Input
                      id="data_publicacao"
                      type="date"
                      value={formData.data_publicacao}
                      onChange={(e) => setFormData({ ...formData, data_publicacao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_vigencia_inicio">Início da Vigência</Label>
                    <Input
                      id="data_vigencia_inicio"
                      type="date"
                      value={formData.data_vigencia_inicio}
                      onChange={(e) => setFormData({ ...formData, data_vigencia_inicio: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_vigencia_fim">Fim da Vigência</Label>
                  <Input
                    id="data_vigencia_fim"
                    type="date"
                    value={formData.data_vigencia_fim}
                    onChange={(e) => setFormData({ ...formData, data_vigencia_fim: e.target.value })}
                  />
                </div>

                {/* Upload de Arquivo */}
                <div className="space-y-2">
                  <Label>Arquivo PDF</Label>
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                          Fazer upload
                        </>
                      )}
                    </Button>
                    {formData.arquivo_url && (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        <a 
                          href={formData.arquivo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Ver arquivo
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, arquivo_url: "" })}
                          className="h-6 px-2 text-destructive"
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Apenas arquivos PDF, máximo 10MB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações internas"
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingDoc ? "Salvar alterações" : "Criar documento"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          }
        />

        {/* Indicadores por situação (clique filtra a lista) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(Object.entries(statusConfig) as [StatusDocumento, (typeof statusConfig)[StatusDocumento]][]).map(([status, config]) => (
            // Botão cobrindo o cartão: evita <div> dentro de <button> e mantém o cartão inteiro clicável.
            <div
              key={status}
              className={`relative rounded-lg transition-all ${filterStatus === status ? 'ring-2 ring-primary' : ''}`}
            >
              <KpiCard rotulo={config.label} valor={statusCounts[status] || 0} icone={config.icone} carregando={isLoading} className="h-full" />
              <button
                type="button"
                aria-pressed={filterStatus === status}
                aria-label={`Filtrar por ${config.label}: ${statusCounts[status] || 0} documentos`}
                className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setFilterStatus(filterStatus === status ? "todos" : status)}
              />
            </div>
          ))}
        </div>

        <DataTable
          rotulo="Documentos"
          dados={filteredDocs ?? []}
          colunas={colunas}
          chaveLinha={(doc) => doc.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar os documentos." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por número, título ou ementa..." }}
          vazio={{ icone: FileText, titulo: "Nenhum documento encontrado" }}
          filtros={
            <>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full md:w-48" aria-label="Filtrar por tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {Object.entries(tipoConfig).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48" aria-label="Filtrar por situação">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as situações</SelectItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          acoesLinha={(doc) => (
            <div className="flex justify-end gap-1">
              {doc.arquivo_url && (
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={doc.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver arquivo do documento ${doc.numero}`}
                    title="Ver arquivo"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              )}
              {doc.status === "aguardando_publicacao" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePublicar(doc)}
                  title="Publicar"
                  aria-label={`Publicar documento ${doc.numero}`}
                >
                  <Send className="h-4 w-4 text-info" aria-hidden="true" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(doc)}
                title="Editar"
                aria-label={`Editar documento ${doc.numero}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Excluir"
                aria-label={`Excluir documento ${doc.numero}`}
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir este documento?")) {
                    deleteMutation.mutate(doc.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              </Button>
            </div>
          )}
        />
      </div>
    </ModuleLayout>
  );
}
