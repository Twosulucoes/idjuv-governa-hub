import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Building2, Briefcase, Calendar, ArrowRight } from "lucide-react";
import { useHistoricoLotacoes, type ServidorGestao } from "@/hooks/useGestaoLotacao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  servidor: ServidorGestao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoricoServidorModal({ servidor, open, onOpenChange }: Props) {
  const { data: historico = [], isLoading } = useHistoricoLotacoes(servidor?.id || null);

  if (!servidor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Lotações
          </DialogTitle>
          <DialogDescription>
            Linha do tempo de <strong>{servidor.nome_completo}</strong>
            {servidor.matricula && ` (Matrícula: ${servidor.matricula})`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando histórico...
            </div>
          ) : historico.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum registro de lotação encontrado.
            </div>
          ) : (
            <div className="relative">
              {/* Linha vertical do timeline */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6">
                {historico.map((item: any, index: number) => (
                  <div key={item.id} className="relative pl-10">
                    {/* Marcador do timeline */}
                    <div 
                      className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                        item.ativo 
                          ? 'bg-success border-success' 
                          : 'bg-muted border-muted-foreground/30'
                      }`}
                    />

                    <div 
                      className={`rounded-lg border p-4 ${
                        item.ativo 
                          ? 'bg-success/5 border-success/30' 
                          : 'bg-muted/30'
                      }`}
                    >
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant={item.ativo ? "default" : "secondary"}
                          className={item.ativo ? "bg-success" : ""}
                        >
                          {item.ativo ? "LOTAÇÃO ATIVA" : "ENCERRADA"}
                        </Badge>
                        {item.tipo_movimentacao && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {item.tipo_movimentacao.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="space-y-2">
                        {/* Cargo */}
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {item.cargo?.sigla && `${item.cargo.sigla} - `}
                            {item.cargo?.nome || "Cargo não especificado"}
                          </span>
                        </div>

                        {/* Unidade */}
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {item.unidade?.sigla && `${item.unidade.sigla} - `}
                            {item.unidade?.nome || "Unidade não especificada"}
                          </span>
                        </div>

                        {/* Período */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(item.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          {item.data_fim ? (
                            <>
                              <ArrowRight className="h-3 w-3" />
                              <span>
                                {format(new Date(item.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </>
                          ) : (
                            <span className="text-success font-medium">— Atual</span>
                          )}
                        </div>

                        {/* Observação */}
                        {item.observacao && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            "{item.observacao}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
