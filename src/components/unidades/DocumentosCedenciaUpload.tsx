import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { DocumentoCedencia, TIPOS_DOCUMENTO_CEDENCIA } from "@/types/unidadesLocais";

interface DocumentosCedenciaUploadProps {
  agendaId: string;
  readOnly?: boolean;
  onDocumentChange?: () => void;
}

const DOCUMENTOS_OBRIGATORIOS = [
  "Requerimento de Solicitação",
  "Comprovante de Identidade",
];

export function DocumentosCedenciaUpload({ 
  agendaId, 
  readOnly = false,
  onDocumentChange 
}: DocumentosCedenciaUploadProps) {
  const [documentos, setDocumentos] = useState<DocumentoCedencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState("");

  useEffect(() => {
    loadDocumentos();
  }, [agendaId]);

  async function loadDocumentos() {
    try {
      const { data, error } = await supabase
        .from("documentos_cedencia")
        .select("*")
        .eq("agenda_id", agendaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocumentos(data as DocumentoCedencia[]);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!tipoSelecionado) {
      toast.error("Selecione o tipo de documento");
      return;
    }

    const file = event.target.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Upload para storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${agendaId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("documentos")
        .getPublicUrl(fileName);

      // Salvar metadados
      const { error: dbError } = await supabase
        .from("documentos_cedencia")
        .insert({
          agenda_id: agendaId,
          tipo_documento: tipoSelecionado,
          nome_arquivo: file.name,
          url_arquivo: urlData.publicUrl,
          tamanho_bytes: file.size,
          mime_type: file.type,
          uploaded_by: userData.user?.id,
        });

      if (dbError) throw dbError;

      toast.success("Documento enviado com sucesso!");
      setTipoSelecionado("");
      loadDocumentos();
      onDocumentChange?.();
      
      // Limpar input
      event.target.value = "";
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error.message || "Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(documento: DocumentoCedencia) {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      // Extrair path do arquivo
      const urlParts = documento.url_arquivo.split("/");
      const filePath = urlParts.slice(-2).join("/");

      // Deletar do storage
      await supabase.storage.from("documentos").remove([filePath]);

      // Deletar do banco
      const { error } = await supabase
        .from("documentos_cedencia")
        .delete()
        .eq("id", documento.id);

      if (error) throw error;

      toast.success("Documento excluído!");
      loadDocumentos();
      onDocumentChange?.();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error(error.message || "Erro ao excluir documento");
    }
  }

  function getDocumentosStatus() {
    const tiposEnviados = documentos.map((d) => d.tipo_documento);
    return DOCUMENTOS_OBRIGATORIOS.map((tipo) => ({
      tipo,
      enviado: tiposEnviados.includes(tipo),
    }));
  }

  const statusDocumentos = getDocumentosStatus();
  const todosObrigatoriosEnviados = statusDocumentos.every((s) => s.enviado);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos da Cedência
          </span>
          {todosObrigatoriosEnviados ? (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completo
            </Badge>
          ) : (
            <Badge className="bg-warning text-warning-foreground">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status dos documentos obrigatórios */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Documentos Obrigatórios:</p>
          <div className="flex flex-wrap gap-2">
            {statusDocumentos.map((status) => (
              <Badge 
                key={status.tipo}
                variant={status.enviado ? "default" : "outline"}
                className={status.enviado ? "bg-success/20 text-success border-success" : ""}
              >
                {status.enviado && <CheckCircle className="h-3 w-3 mr-1" />}
                {status.tipo}
              </Badge>
            ))}
          </div>
        </div>

        {/* Upload de novo documento */}
        {!readOnly && (
          <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO_CEDENCIA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Arquivo (PDF, JPG, PNG - máx. 10MB)</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleUpload}
                  disabled={uploading || !tipoSelecionado}
                />
              </div>
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando arquivo...
              </div>
            )}
          </div>
        )}

        {/* Lista de documentos */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documentos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            Nenhum documento enviado
          </div>
        ) : (
          <div className="space-y-2">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.nome_arquivo}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {doc.tipo_documento}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {doc.tamanho_bytes 
                          ? `${(doc.tamanho_bytes / 1024).toFixed(1)} KB`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(doc.url_arquivo, "_blank")}
                    title="Baixar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc)}
                      title="Excluir"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
