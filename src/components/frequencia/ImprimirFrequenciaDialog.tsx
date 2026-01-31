/**
 * Dialog para impressão da Frequência Mensal Individual
 * Permite escolher entre versão em branco ou preenchida
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  FileSpreadsheet, 
  Loader2, 
  Printer,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { 
  generateFrequenciaMensalPDF, 
  generateFrequenciaMensalBlob,
  gerarRegistrosDiariosBranco,
  calcularResumoMensal,
  type FrequenciaMensalPDFData,
  type RegistroDiario,
} from "@/lib/pdfFrequenciaMensal";
import { useDiasNaoUteis, useAssinaturaPadrao } from "@/hooks/useParametrizacoesFrequencia";
import { useRegistrosPonto, useFrequenciaMensal, calcularDiasUteis } from "@/hooks/useFrequencia";
import { useUploadFrequencia } from "@/hooks/useFrequenciaPacotes";
import type { FrequenciaServidorResumo } from "@/hooks/useFrequencia";
import { useAuth } from "@/contexts/AuthContext";

interface ImprimirFrequenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidor: FrequenciaServidorResumo | null;
  ano: number;
  mes: number;
}

export function ImprimirFrequenciaDialog({
  open,
  onOpenChange,
  servidor,
  ano,
  mes,
}: ImprimirFrequenciaDialogProps) {
  const [tipo, setTipo] = useState<'em_branco' | 'preenchida'>('em_branco');
  const [gerando, setGerando] = useState(false);
  const [salvarStorage, setSalvarStorage] = useState(true);

  const { user } = useAuth();
  const { data: diasNaoUteis } = useDiasNaoUteis(ano);
  const { data: configAssinatura } = useAssinaturaPadrao();
  const { data: registrosPonto } = useRegistrosPonto(servidor?.servidor_id, ano, mes);
  const { data: frequenciaMensal } = useFrequenciaMensal(servidor?.servidor_id, ano, mes);
  const uploadFrequencia = useUploadFrequencia();

  if (!servidor) return null;

  const periodo = `${ano}-${String(mes).padStart(2, '0')}`;

  const handleImprimir = async () => {
    setGerando(true);

    try {
      // Preparar registros diários
      let registros: RegistroDiario[] = [];
      
      if (tipo === 'em_branco') {
        registros = gerarRegistrosDiariosBranco(ano, mes, diasNaoUteis || []);
      } else {
        // Montar registros a partir dos dados do banco
        registros = gerarRegistrosDiariosBranco(ano, mes, diasNaoUteis || []).map(regBase => {
          const regPonto = registrosPonto?.find(r => r.data === regBase.data);
          
          if (regPonto) {
            return {
              ...regBase,
              entrada_manha: regPonto.entrada1 || undefined,
              saida_manha: regPonto.saida1 || undefined,
              entrada_tarde: regPonto.entrada2 || undefined,
              saida_tarde: regPonto.saida2 || undefined,
              total_horas: regPonto.horas_trabalhadas || undefined,
              observacao: regPonto.observacao || regBase.observacao,
              tipo_registro: regPonto.tipo,
            };
          }
          
          return regBase;
        });
      }

      // Calcular resumo
      const resumo = tipo === 'preenchida' 
        ? calcularResumoMensal(registros, servidor.dias_uteis ? 8 : 8)
        : undefined;

      // Dados para o PDF
      const pdfData: FrequenciaMensalPDFData = {
        tipo,
        competencia: { mes, ano },
        servidor: {
          id: servidor.servidor_id,
          nome_completo: servidor.servidor_nome,
          matricula: servidor.servidor_matricula,
          cpf: servidor.servidor_cpf,
          cargo: servidor.servidor_cargo,
          unidade: servidor.servidor_unidade,
          regime: 'Presencial',
          carga_horaria_diaria: 8,
          carga_horaria_semanal: 40,
        },
        registros: tipo === 'preenchida' ? registros : undefined,
        resumo,
        diasNaoUteis: diasNaoUteis || [],
        configAssinatura: {
          servidor_obrigatoria: configAssinatura?.assinatura_servidor_obrigatoria ?? true,
          chefia_obrigatoria: configAssinatura?.assinatura_chefia_obrigatoria ?? true,
          rh_obrigatoria: configAssinatura?.assinatura_rh_obrigatoria ?? false,
          texto_declaracao: configAssinatura?.texto_declaracao || 
            'Declaro que as informações acima refletem fielmente a jornada de trabalho exercida no período.',
        },
        statusPeriodo: tipo === 'preenchida' ? {
          status: 'aberto',
        } : undefined,
        dataGeracao: format(new Date(), "dd/MM/yyyy 'às' HH:mm"),
        usuarioGeracao: user?.email || 'Sistema',
      };

      // Gerar PDF
      const { doc, nomeArquivo } = await generateFrequenciaMensalPDF(pdfData);
      
      // Salvar localmente
      doc.save(nomeArquivo);

      // Salvar no storage se habilitado
      if (salvarStorage && tipo === 'preenchida') {
        try {
          const blob = doc.output('blob');
          await uploadFrequencia.mutateAsync({
            pdfBlob: blob,
            periodo,
            ano,
            mes,
            servidor: {
              id: servidor.servidor_id,
              nome: servidor.servidor_nome,
              matricula: servidor.servidor_matricula,
            },
            unidade: {
              id: '', // Unidade ID não disponível no resumo
              nome: servidor.servidor_unidade || 'Sem Unidade',
              sigla: undefined,
            },
            tipo: 'individual',
          });
          toast.success('PDF gerado e salvo no storage!');
        } catch (uploadError) {
          console.warn('Erro ao salvar no storage:', uploadError);
          toast.success('PDF gerado! (Erro ao salvar no storage)');
        }
      } else {
        toast.success('PDF gerado com sucesso!');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  const mesesNome = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Imprimir Frequência Mensal
          </DialogTitle>
          <DialogDescription>
            Gerar PDF da folha de frequência para {servidor.servidor_nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do período */}
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Competência: </span>
              <span className="font-medium">{mesesNome[mes - 1]}/{ano}</span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-muted-foreground">Servidor: </span>
              <span className="font-medium">{servidor.servidor_nome}</span>
            </div>
          </div>

          <Separator />

          {/* Seleção do tipo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Documento</Label>
            
            <RadioGroup 
              value={tipo} 
              onValueChange={(v) => setTipo(v as 'em_branco' | 'preenchida')}
              className="space-y-3"
            >
              <div 
                className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  tipo === 'em_branco' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setTipo('em_branco')}
              >
                <RadioGroupItem value="em_branco" id="em_branco" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="em_branco" className="font-medium cursor-pointer">
                      Frequência em Branco
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Para preenchimento manual. Campos de horário vazios, apenas com marcação de feriados e fins de semana.
                  </p>
                </div>
              </div>

              <div 
                className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  tipo === 'preenchida' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setTipo('preenchida')}
              >
                <RadioGroupItem value="preenchida" id="preenchida" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="preenchida" className="font-medium cursor-pointer">
                      Frequência Preenchida
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Com todos os registros já lançados, totais e resumo mensal. Documento oficial.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Aviso para preenchida sem dados */}
          {tipo === 'preenchida' && (!registrosPonto || registrosPonto.length === 0) && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs text-warning">
                <span className="font-medium">Atenção:</span> Não há registros de ponto para este período. 
                O documento será gerado com campos em branco nos dias úteis.
              </div>
            </div>
          )}

          {/* Aviso de sucesso para preenchida com dados */}
          {tipo === 'preenchida' && registrosPonto && registrosPonto.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-success/50 bg-success/10 p-3">
              <CheckCircle className="h-4 w-4 text-success mt-0.5" />
              <div className="text-xs text-success">
                <span className="font-medium">{registrosPonto.length}</span> registros encontrados para o período.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={gerando}>
            Cancelar
          </Button>
          <Button onClick={handleImprimir} disabled={gerando}>
            {gerando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Gerar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
