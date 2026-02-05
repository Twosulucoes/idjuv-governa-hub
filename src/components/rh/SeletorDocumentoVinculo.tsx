import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, X, ExternalLink, Loader2 } from "lucide-react";
import { formatDateBR } from "@/lib/formatters";

interface DocumentoSelecionado {
  id: string;
  numero: string | null;
  titulo: string;
  data_documento: string | null;
  categoria: string | null;
  status?: string | null;
}

interface SeletorDocumentoVinculoProps {
  value: string | null;
  onChange: (documentoId: string | null) => void;
  disabled?: boolean;
}

export function SeletorDocumentoVinculo({
  value,
  onChange,
  disabled = false,
}: SeletorDocumentoVinculoProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  // Buscar documento selecionado
  const { data: documentoSelecionado } = useQuery({
    queryKey: ["documento-vinculo", value],
    queryFn: async () => {
      if (!value) return null;
      const { data, error } = await supabase
        .from("documentos")
        .select("id, numero, titulo, data_documento, categoria")
        .eq("id", value)
        .single();
      if (error) return null;
      return data as unknown as DocumentoSelecionado;
    },
    enabled: !!value,
  });

  // Buscar documentos para seleção
  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["documentos-vinculo-busca", busca],
    queryFn: async () => {
      let query = supabase
        .from("documentos")
        .select("id, numero, titulo, data_documento, categoria, status")
        .eq("tipo", "portaria")
        .in("categoria", ["cessao", "nomeacao", "pessoal", "designacao"])
        .order("data_documento", { ascending: false })
        .limit(50);

      if (busca) {
        query = query.or(`numero.ilike.%${busca}%,titulo.ilike.%${busca}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as DocumentoSelecionado[];
    },
    enabled: open,
  });

  const handleSelect = (doc: DocumentoSelecionado) => {
    onChange(doc.id);
    setOpen(false);
    setBusca("");
  };

  const handleRemove = () => {
    onChange(null);
  };

  const formatNumeroPortaria = (doc: DocumentoSelecionado) => {
    if (doc.numero) {
      return `Portaria nº ${doc.numero}`;
    }
    return doc.titulo;
  };

  return (
    <div className="space-y-2">
      {documentoSelecionado ? (
        <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
          <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {formatNumeroPortaria(documentoSelecionado)}
            </p>
            <p className="text-xs text-muted-foreground">
              {documentoSelecionado.data_documento
                ? formatDateBR(documentoSelecionado.data_documento)
                : "Sem data"}
              {documentoSelecionado.categoria && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {documentoSelecionado.categoria}
                </Badge>
              )}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                window.open(`/documentos/${documentoSelecionado.id}`, "_blank")
              }
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              disabled={disabled}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar na Central de Portarias...
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Selecionar Documento</DialogTitle>
              <DialogDescription>
                Busque e selecione a portaria ou ato formal relacionado ao
                vínculo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número ou título..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : documentos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum documento encontrado.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documentos.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleSelect(doc)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {doc.numero
                                ? `Portaria nº ${doc.numero}`
                                : doc.titulo}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.titulo}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {doc.data_documento
                                  ? formatDateBR(doc.data_documento)
                                  : "Sem data"}
                              </span>
                              {doc.categoria && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {doc.categoria}
                                </Badge>
                              )}
                              {doc.status && (
                                <Badge
                                  variant={
                                    doc.status === "vigente"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {doc.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
