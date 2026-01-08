import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, CheckCircle, Loader2, User, Building2, Briefcase, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { downloadMemorandoLotacao, MemorandoLotacaoData } from "@/lib/pdfMemorandoLotacao";

interface LotacaoData {
  id: string;
  servidor_id: string;
  unidade_id: string;
  cargo_id: string | null;
  data_inicio: string;
  tipo_movimentacao: string | null;
  servidor?: {
    id: string;
    nome_completo: string;
    matricula: string | null;
  } | null;
  unidade?: {
    id: string;
    nome: string;
    sigla: string | null;
  } | null;
  cargo?: {
    id: string;
    nome: string;
    sigla: string | null;
  } | null;
}

interface MemorandoLotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotacao: LotacaoData | null;
}

const TIPO_MOVIMENTACAO_LABELS: Record<string, string> = {
  nomeacao: 'Nomeação',
  designacao: 'Designação',
  transferencia: 'Transferência',
  redistribuicao: 'Redistribuição',
  cessao: 'Cessão',
  remocao: 'Remoção',
};

export function MemorandoLotacaoDialog({ open, onOpenChange, lotacao }: MemorandoLotacaoDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState("");
  const [matriculaServidor, setMatriculaServidor] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const createMemorandoMutation = useMutation({
    mutationFn: async () => {
      if (!lotacao) throw new Error("Lotação não selecionada");

      // Gerar protocolo
      const { data: protocolo, error: protocoloError } = await supabase
        .rpc('gerar_protocolo_memorando_lotacao');
      
      if (protocoloError) throw protocoloError;

      // Criar registro do memorando
      const memorandoData = {
        numero_protocolo: protocolo,
        lotacao_id: lotacao.id,
        servidor_id: lotacao.servidor_id,
        servidor_nome: lotacao.servidor?.nome_completo || '',
        servidor_matricula: matriculaServidor || lotacao.servidor?.matricula || null,
        unidade_destino_id: lotacao.unidade_id,
        unidade_destino_nome: lotacao.unidade?.nome || '',
        cargo_id: lotacao.cargo_id,
        cargo_nome: lotacao.cargo?.nome || null,
        tipo_movimentacao: lotacao.tipo_movimentacao || 'designacao',
        data_inicio_exercicio: lotacao.data_inicio,
        data_emissao: new Date().toISOString().split('T')[0],
        emitido_por: user?.id,
        emitido_por_nome: user?.fullName || null,
        observacoes: observacoes || null,
        status: 'gerado',
      };

      const { data, error } = await supabase
        .from('memorandos_lotacao')
        .insert(memorandoData)
        .select()
        .single();

      if (error) throw error;
      
      return { memorando: data, protocolo };
    },
    onSuccess: ({ memorando, protocolo }) => {
      // Gerar e baixar PDF
      const pdfData: MemorandoLotacaoData = {
        numeroProtocolo: protocolo,
        dataEmissao: format(new Date(), 'dd/MM/yyyy'),
        servidor: {
          nome: lotacao?.servidor?.nome_completo || '',
          matricula: matriculaServidor || lotacao?.servidor?.matricula || undefined,
        },
        unidadeDestino: {
          nome: lotacao?.unidade?.nome || '',
          sigla: lotacao?.unidade?.sigla || undefined,
        },
        cargo: lotacao?.cargo ? {
          nome: lotacao.cargo.nome,
          sigla: lotacao.cargo.sigla || undefined,
        } : undefined,
        tipoMovimentacao: lotacao?.tipo_movimentacao || 'designacao',
        dataInicioExercicio: format(new Date(lotacao?.data_inicio || new Date()), 'dd/MM/yyyy'),
        observacoes: observacoes || undefined,
        emitidoPor: user?.fullName || undefined,
      };

      downloadMemorandoLotacao(pdfData);

      queryClient.invalidateQueries({ queryKey: ["memorandos-lotacao"] });
      toast.success(`Memorando ${protocolo} gerado com sucesso!`);
      handleClose();
    },
    onError: (error: any) => {
      console.error('Erro ao gerar memorando:', error);
      toast.error(`Erro ao gerar memorando: ${error.message}`);
    },
  });

  const handleClose = () => {
    setObservacoes("");
    setMatriculaServidor("");
    setIsGenerating(false);
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await createMemorandoMutation.mutateAsync();
    setIsGenerating(false);
  };

  if (!lotacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerar Memorando de Lotação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados do Servidor */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Servidor
            </div>
            <p className="font-semibold">{lotacao.servidor?.nome_completo}</p>
            {lotacao.servidor?.matricula && (
              <p className="text-sm text-muted-foreground">Matrícula: {lotacao.servidor.matricula}</p>
            )}
          </div>

          {/* Dados da Lotação */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Building2 className="h-3 w-3" />
                Unidade
              </div>
              <p className="text-sm font-medium">{lotacao.unidade?.sigla || lotacao.unidade?.nome}</p>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Briefcase className="h-3 w-3" />
                Cargo
              </div>
              <p className="text-sm font-medium">{lotacao.cargo?.nome || 'Não especificado'}</p>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                Início Exercício
              </div>
              <p className="text-sm font-medium">
                {format(new Date(lotacao.data_inicio), 'dd/MM/yyyy')}
              </p>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Movimentação</div>
              <Badge variant="outline">
                {TIPO_MOVIMENTACAO_LABELS[lotacao.tipo_movimentacao || ''] || lotacao.tipo_movimentacao || 'Não especificado'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Campos adicionais */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="matricula">Matrícula do Servidor (opcional)</Label>
              <Input
                id="matricula"
                value={matriculaServidor}
                onChange={(e) => setMatriculaServidor(e.target.value)}
                placeholder="Ex: 123456"
              />
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais para o memorando..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || createMemorandoMutation.isPending}
          >
            {isGenerating || createMemorandoMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar e Baixar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
