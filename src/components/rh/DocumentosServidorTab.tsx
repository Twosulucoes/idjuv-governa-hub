import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  Download,
  Plus,
  Eye,
  Loader2,
  FilePlus,
  FileCheck,
  Clock,
  Archive,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  generateFichaCadastralModelo,
  generateDeclaracaoAcumulacaoModelo,
  generateDeclaracaoBensModelo,
} from "@/lib/pdfModelos";

// Tipos de documento disponíveis para requerimento
const TIPOS_REQUERIMENTO = [
  { value: "ficha_cadastral", label: "Ficha Cadastral", gerador: generateFichaCadastralModelo },
  { value: "declaracao_acumulacao", label: "Declaração de Não Acumulação de Cargos", gerador: generateDeclaracaoAcumulacaoModelo },
  { value: "declaracao_bens", label: "Declaração de Bens e Valores", gerador: generateDeclaracaoBensModelo },
  { value: "requerimento_ferias", label: "Requerimento de Férias", gerador: null },
  { value: "requerimento_licenca", label: "Requerimento de Licença", gerador: null },
  { value: "requerimento_geral", label: "Requerimento Geral", gerador: null },
  { value: "termo_posse", label: "Termo de Posse", gerador: null },
  { value: "outro", label: "Outro", gerador: null },
] as const;

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  pendente: { label: "Pendente", variant: "outline", icon: Clock },
  recebido: { label: "Recebido", variant: "default", icon: FileCheck },
  analisado: { label: "Analisado", variant: "secondary", icon: CheckCircle },
  arquivado: { label: "Arquivado", variant: "secondary", icon: Archive },
};

interface Props {
  servidorId: string;
  servidorNome: string;
  isAdmin: boolean;
}

export function DocumentosServidorTab({ servidorId, servidorNome, isAdmin }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Form state - Novo Requerimento
  const [tipoDoc, setTipoDoc] = useState("");
  const [tituloDoc, setTituloDoc] = useState("");
  const [descricaoDoc, setDescricaoDoc] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Buscar documentos expedidos (da tabela documentos onde o servidor aparece em servidores_ids)
  const { data: expedidos = [], isLoading: loadingExpedidos } = useQuery({
    queryKey: ["docs-expedidos-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, numero, titulo, tipo, status, data_documento, arquivo_url, arquivo_assinado_url, doe_numero, doe_data")
        .contains("servidores_ids", [servidorId])
        .order("data_documento", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar requerimentos do servidor
  const { data: requerimentos = [], isLoading: loadingReq } = useQuery({
    queryKey: ["docs-requerimento-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_requerimento_servidor")
        .select("*")
        .eq("servidor_id", servidorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Criar novo requerimento
  const criarRequerimento = useMutation({
    mutationFn: async () => {
      const tipo = TIPOS_REQUERIMENTO.find(t => t.value === tipoDoc);
      const { error } = await supabase
        .from("documentos_requerimento_servidor")
        .insert({
          servidor_id: servidorId,
          tipo_documento: tipoDoc,
          titulo: tituloDoc || tipo?.label || tipoDoc,
          descricao: descricaoDoc || null,
          created_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs-requerimento-servidor", servidorId] });
      toast.success("Requerimento criado com sucesso");
      setShowNovoDialog(false);
      resetForm();
    },
    onError: (err: any) => toast.error("Erro ao criar: " + err.message),
  });

  // Upload de documento assinado
  const uploadAssinado = useMutation({
    mutationFn: async ({ docId, file }: { docId: string; file: File }) => {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const path = `${servidorId}/${docId}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documentos-requerimento")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documentos-requerimento")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("documentos_requerimento_servidor")
        .update({
          arquivo_assinado_url: urlData.publicUrl,
          data_upload_assinado: new Date().toISOString(),
          status: "recebido",
        })
        .eq("id", docId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs-requerimento-servidor", servidorId] });
      toast.success("Documento assinado enviado com sucesso");
      setShowUploadDialog(false);
      setSelectedDoc(null);
      setUploadFile(null);
      setUploading(false);
    },
    onError: (err: any) => {
      setUploading(false);
      toast.error("Erro no upload: " + err.message);
    },
  });

  // Atualizar status
  const atualizarStatus = useMutation({
    mutationFn: async ({ docId, status }: { docId: string; status: string }) => {
      const { error } = await supabase
        .from("documentos_requerimento_servidor")
        .update({ status })
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs-requerimento-servidor", servidorId] });
      toast.success("Status atualizado");
    },
  });

  const resetForm = () => {
    setTipoDoc("");
    setTituloDoc("");
    setDescricaoDoc("");
  };

  const handleBaixarModelo = (tipo: string) => {
    const tipoConfig = TIPOS_REQUERIMENTO.find(t => t.value === tipo);
    if (tipoConfig?.gerador) {
      tipoConfig.gerador();
      toast.success("Modelo baixado");
    } else {
      toast.info("Modelo não disponível para geração automática. Faça upload manual.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Documentos Expedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos Expedidos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Portarias, decretos e atos administrativos vinculados a este servidor
          </p>
        </CardHeader>
        <CardContent>
          {loadingExpedidos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : expedidos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum documento expedido vinculado.
            </p>
          ) : (
            <div className="space-y-3">
              {expedidos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">
                        {doc.tipo?.charAt(0).toUpperCase() + doc.tipo?.slice(1)} {doc.numero && `nº ${doc.numero}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{doc.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {doc.data_documento && format(new Date(doc.data_documento), "dd/MM/yyyy")}
                        {doc.doe_numero && ` • DOE nº ${doc.doe_numero}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {doc.status}
                    </Badge>
                    {(doc.arquivo_url || doc.arquivo_assinado_url) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(doc.arquivo_assinado_url || doc.arquivo_url, "_blank")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos de Requerimento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-primary" />
              Documentos de Requerimento
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Modelos para download e upload do documento assinado pelo servidor
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowNovoDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Requerimento
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingReq ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requerimentos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum requerimento registrado.
            </p>
          ) : (
            <div className="space-y-3">
              {requerimentos.map((doc) => {
                const statusConf = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pendente;
                const StatusIcon = statusConf.icon;
                const tipoConfig = TIPOS_REQUERIMENTO.find(t => t.value === doc.tipo_documento);

                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <StatusIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{doc.titulo}</p>
                        {doc.descricao && (
                          <p className="text-sm text-muted-foreground">{doc.descricao}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Solicitado em {format(new Date(doc.data_solicitacao), "dd/MM/yyyy")}
                          {doc.data_upload_assinado && (
                            <> • Assinado recebido em {format(new Date(doc.data_upload_assinado), "dd/MM/yyyy")}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConf.variant} className="text-xs">
                        {statusConf.label}
                      </Badge>
                      
                      {/* Baixar modelo */}
                      {tipoConfig?.gerador && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Baixar modelo em branco"
                          onClick={() => handleBaixarModelo(doc.tipo_documento)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Ver documento assinado */}
                      {doc.arquivo_assinado_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Ver documento assinado"
                          onClick={() => window.open(doc.arquivo_assinado_url, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Upload do assinado */}
                      {isAdmin && doc.status === "pendente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowUploadDialog(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Anexar
                        </Button>
                      )}

                      {/* Mudar status */}
                      {isAdmin && doc.status !== "arquivado" && doc.arquivo_assinado_url && (
                        <Select
                          value={doc.status}
                          onValueChange={(val) => atualizarStatus.mutate({ docId: doc.id, status: val })}
                        >
                          <SelectTrigger className="h-8 w-[120px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                {conf.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Novo Requerimento */}
      <Dialog open={showNovoDialog} onOpenChange={setShowNovoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Requerimento - {servidorNome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Documento *</Label>
              <Select value={tipoDoc} onValueChange={(v) => {
                setTipoDoc(v);
                const tipo = TIPOS_REQUERIMENTO.find(t => t.value === v);
                if (tipo && !tituloDoc) setTituloDoc(tipo.label);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_REQUERIMENTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={tituloDoc} onChange={(e) => setTituloDoc(e.target.value)} placeholder="Título do documento" />
            </div>
            <div>
              <Label>Descrição / Observações</Label>
              <Textarea value={descricaoDoc} onChange={(e) => setDescricaoDoc(e.target.value)} placeholder="Detalhes adicionais..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNovoDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => criarRequerimento.mutate()}
              disabled={!tipoDoc || !tituloDoc || criarRequerimento.isPending}
            >
              {criarRequerimento.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Requerimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Upload Documento Assinado */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar Documento Assinado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Anexe o documento <strong>{selectedDoc?.titulo}</strong> assinado pelo servidor como prova de solicitação.
            </p>
            <div>
              <Label>Arquivo (PDF, imagem) *</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUploadDialog(false); setUploadFile(null); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedDoc && uploadFile) {
                  uploadAssinado.mutate({ docId: selectedDoc.id, file: uploadFile });
                }
              }}
              disabled={!uploadFile || uploading}
            >
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
