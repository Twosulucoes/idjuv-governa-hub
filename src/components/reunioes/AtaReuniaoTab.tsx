import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileText, 
  Save, 
  Edit, 
  CheckCircle, 
  Loader2,
  AlertCircle 
} from "lucide-react";

interface AtaReuniaoTabProps {
  reuniaoId: string;
  ataConteudo: string | null;
  ataAprovada: boolean | null;
  statusReuniao: string;
  pauta: string | null;
}

export function AtaReuniaoTab({ 
  reuniaoId, 
  ataConteudo, 
  ataAprovada,
  statusReuniao,
  pauta
}: AtaReuniaoTabProps) {
  const [editando, setEditando] = useState(false);
  const [conteudo, setConteudo] = useState(ataConteudo || "");
  const queryClient = useQueryClient();

  useEffect(() => {
    setConteudo(ataConteudo || "");
  }, [ataConteudo]);

  const podeEditar = statusReuniao === "realizada" || statusReuniao === "em_andamento";

  const salvarMutation = useMutation({
    mutationFn: async (novoConteudo: string) => {
      const { error } = await supabase
        .from("reunioes")
        .update({ 
          ata_conteudo: novoConteudo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reuniaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reuniao", reuniaoId] });
      setEditando(false);
      toast.success("Ata salva com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar ata: " + error.message);
    },
  });

  const aprovarMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("reunioes")
        .update({ 
          ata_aprovada: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reuniaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reuniao", reuniaoId] });
      toast.success("Ata aprovada!");
    },
    onError: (error: any) => {
      toast.error("Erro ao aprovar ata: " + error.message);
    },
  });

  const handleSalvar = () => {
    salvarMutation.mutate(conteudo);
  };

  // Gerar modelo inicial da ata baseado na pauta
  const gerarModeloAta = () => {
    const dataHoje = new Date().toLocaleDateString("pt-BR");
    let modelo = `ATA DE REUNIÃO\n\nData: ${dataHoje}\n\n`;
    
    if (pauta) {
      modelo += `PAUTA:\n${pauta}\n\n`;
    }
    
    modelo += `PARTICIPANTES:\n[Lista de participantes presentes]\n\n`;
    modelo += `DELIBERAÇÕES:\n[Registrar as decisões tomadas]\n\n`;
    modelo += `ENCAMINHAMENTOS:\n[Listar os próximos passos definidos]\n\n`;
    modelo += `ENCERRAMENTO:\n[Horário de encerramento e observações finais]`;
    
    setConteudo(modelo);
    setEditando(true);
  };

  if (!podeEditar && !ataConteudo) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>A ata só pode ser registrada após a reunião ser realizada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status da ata */}
      {ataConteudo && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status da Ata:</span>
          </div>
          <Badge variant={ataAprovada ? "default" : "secondary"}>
            {ataAprovada ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Aprovada
              </>
            ) : (
              "Rascunho"
            )}
          </Badge>
        </div>
      )}

      {/* Editor ou visualizador */}
      {editando ? (
        <div className="space-y-3">
          <Textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Digite o conteúdo da ata..."
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setConteudo(ataConteudo || "");
                setEditando(false);
              }}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSalvar}
              disabled={salvarMutation.isPending}
            >
              {salvarMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      ) : ataConteudo ? (
        <Card>
          <CardContent className="p-4">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {ataConteudo}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Ações */}
      {!editando && podeEditar && (
        <div className="flex gap-2">
          {ataConteudo ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditando(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Ata
              </Button>
              {!ataAprovada && statusReuniao === "realizada" && (
                <Button 
                  className="flex-1"
                  onClick={() => aprovarMutation.mutate()}
                  disabled={aprovarMutation.isPending}
                >
                  {aprovarMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprovar Ata
                </Button>
              )}
            </>
          ) : (
            <Button 
              className="w-full"
              onClick={gerarModeloAta}
            >
              <FileText className="h-4 w-4 mr-2" />
              Iniciar Ata da Reunião
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
