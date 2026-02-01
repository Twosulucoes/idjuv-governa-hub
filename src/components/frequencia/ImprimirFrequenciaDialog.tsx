/**
 * Dialog para impressão da Frequência Mensal Individual
 * Permite escolher entre versão em branco ou preenchida
 */
import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  FileSpreadsheet, 
  Loader2, 
  Printer,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Eye,
  Download,
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
import { useGerarFrequenciaPDF } from "@/hooks/useGerarFrequenciaPDF";

interface ImprimirFrequenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidor: FrequenciaServidorResumo | null;
  ano: number;
  mes: number;
}

// Hook customizado para validação
const useValidacaoFrequencia = (servidor: FrequenciaServidorResumo | null, tipo: string) => {
  const validarDados = (): { valido: boolean; mensagem?: string } => {
    if (!servidor) {
      return { valido: false, mensagem: 'Nenhum servidor selecionado' };
    }

    if (!servidor.servidor_nome || !servidor.servidor_matricula) {
      return { valido: false, mensagem: 'Dados incompletos do servidor' };
    }

    return { valido: true };
  };

  return { validarDados };
};

export function ImprimirFrequenciaDialog({
  open,
  onOpenChange,
  servidor,
  ano,
  mes,
}: ImprimirFrequenciaDialogProps) {
  const [tipo, setTipo] = useState<'em_branco' | 'preenchida'>('em_branco');
  const [estadoGeracao, setEstadoGeracao] = useState<'ocioso' | 'preparando' | 'gerando' | 'salvando'>('ocioso');
  const [progresso, setProgresso] = useState(0);
  const [salvarStorage, setSalvarStorage] = useState(true);
  const [incluirMetadados, setIncluirMetadados] = useState(true);
  const [altaQualidade, setAltaQualidade] = useState(false);
  const [opcoesAvancadas, setOpcoesAvancadas] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const { user } = useAuth();
  const { data: diasNaoUteis } = useDiasNaoUteis(ano);
  const { data: configAssinatura } = useAssinaturaPadrao();
  const { data: registrosPonto } = useRegistrosPonto(servidor?.servidor_id, ano, mes);
  const { data: frequenciaMensal } = useFrequenciaMensal(servidor?.servidor_id, ano, mes);
  const uploadFrequencia = useUploadFrequencia();
  const { gerarPDF } = useGerarFrequenciaPDF();
  const { validarDados } = useValidacaoFrequencia(servidor, tipo);

  // Limpar preview URL ao fechar dialog
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [previewUrl]);

  const periodo = useMemo(() => `${ano}-${String(mes).padStart(2, '0')}`, [ano, mes]);

  const temRegistros = useMemo(
    () => registrosPonto && registrosPonto.length > 0,
    [registrosPonto]
  );

  const atualizarProgresso = (etapa: number, totalEtapas: number) => {
    setProgresso(Math.round((etapa / totalEtapas) * 100));
  };

  const handleGerarPrevisualizacao = async () => {
    if (!servidor) return;

    setEstadoGeracao('preparando');
    setProgresso(0);

    try {
      const validacao = validarDados();
      if (!validacao.valido) {
        toast.error(validacao.mensagem);
        return;
      }

      // Preparar registros diários
      atualizarProgresso(1, 5);
      let registros: RegistroDiario[] = [];
      
      if (tipo === 'em_branco') {
        registros = gerarRegistrosDiariosBranco(ano, mes, diasNaoUteis || []);
      } else {
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
      atualizarProgresso(2, 5);

      // Calcular resumo
      atualizarProgresso(3, 5);
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

      atualizarProgresso(4, 5);
      
      // Gerar PDF para preview
      setEstadoGeracao('gerando');
      const { doc } = await generateFrequenciaMensalPDF(pdfData);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      atualizarProgresso(5, 5);
      
      toast.success('Pré-visualização gerada!');
      setEstadoGeracao('ocioso');
      
    } catch (error) {
      console.error('Erro ao gerar pré-visualização:', error);
      tratarErro(error);
      setEstadoGeracao('ocioso');
    }
  };

  const handleImprimir = async () => {
    if (!servidor) return;

    setGerando(true);
    setEstadoGeracao('preparando');
    setProgresso(0);

    try {
      const validacao = validarDados();
      if (!validacao.valido) {
        toast.error(validacao.mensagem);
        return;
      }

      // Preparar registros diários
      atualizarProgresso(1, 6);
      let registros: RegistroDiario[] = [];
      
      if (tipo === 'em_branco') {
        registros = gerarRegistrosDiariosBranco(ano, mes, diasNaoUteis || []);
      } else {
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
      atualizarProgresso(2, 6);

      // Calcular resumo
      atualizarProgresso(3, 6);
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

      atualizarProgresso(4, 6);
      
      // Gerar PDF
      setEstadoGeracao('gerando');
      const { doc, nomeArquivo } = await generateFrequenciaMensalPDF(pdfData);
      atualizarProgresso(5, 6);
      
      // Salvar localmente
      doc.save(nomeArquivo);

      // Salvar no storage se habilitado
      if (salvarStorage && tipo === 'preenchida') {
        try {
          setEstadoGeracao('salvando');
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
      
      atualizarProgresso(6, 6);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      tratarErro(error);
    } finally {
      setGerando(false);
      setEstadoGeracao('ocioso');
      setProgresso(0);
    }
  };

  const tratarErro = (error: unknown) => {
    let mensagem = 'Erro ao gerar o PDF. Tente novamente.';
    
    if (error instanceof Error) {
      if (error.message.includes('servidor')) {
        mensagem = 'Erro nos dados do servidor. Verifique as informações.';
      } else if (error.message.includes('periodo')) {
        mensagem = 'Período inválido selecionado.';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        mensagem = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
    }
    
    toast.error(mensagem);
  };

  const handleVisualizarPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadPreview = () => {
    if (previewUrl && servidor) {
      const mesesNome = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const nomeArquivo = `Frequencia_${servidor.servidor_nome.replace(/\s+/g, '_')}_${mesesNome[mes - 1]}_${ano}_${tipo}.pdf`;
      
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!servidor) return null;

  const mesesNome = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
            <div className="text-sm mt-1">
              <span className="text-muted-foreground">Matrícula: </span>
              <span className="font-medium">{servidor.servidor_matricula}</span>
            </div>
          </div>

          <Separator />

          {/* Seleção do tipo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Documento</Label>
            
            <RadioGroup 
              value={tipo} 
              onValueChange={(v) => {
                setTipo(v as 'em_branco' | 'preenchida');
                setPreviewUrl(null);
              }}
              className="space-y-3"
            >
              <div 
                className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  tipo === 'em_branco' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setTipo('em_branco');
                  setPreviewUrl(null);
                }}
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
                onClick={() => {
                  setTipo('preenchida');
                  setPreviewUrl(null);
                }}
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

          {/* Avisos */}
          {tipo === 'preenchida' && !temRegistros && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs text-warning">
                <span className="font-medium">Atenção:</span> Não há registros de ponto para este período. 
                O documento será gerado com campos em branco nos dias úteis.
              </div>
            </div>
          )}

          {tipo === 'preenchida' && temRegistros && (
            <div className="flex items-start gap-2 rounded-lg border border-success/50 bg-success/10 p-3">
              <CheckCircle className="h-4 w-4 text-success mt-0.5" />
              <div className="text-xs text-success">
                <span className="font-medium">{registrosPonto?.length}</span> registros encontrados para o período.
              </div>
            </div>
          )}

          {/* Opções avançadas */}
          <Collapsible open={opcoesAvancadas} onOpenChange={setOpcoesAvancadas}>
            <CollapsibleTrigger className="flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${opcoesAvancadas ? 'rotate-180' : ''}`} />
              Opções avançadas
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir-metadados"
                  checked={incluirMetadados}
                  onCheckedChange={(checked) => setIncluirMetadados(checked as boolean)}
                />
                <Label htmlFor="incluir-metadados" className="text-sm font-normal">
                  Incluir metadados no PDF
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alta-qualidade"
                  checked={altaQualidade}
                  onCheckedChange={(checked) => setAltaQualidade(checked as boolean)}
                />
                <Label htmlFor="alta-qualidade" className="text-sm font-normal">
                  Alta qualidade (arquivo maior)
                </Label>
              </div>
              
              {tipo === 'preenchida' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="salvar-storage"
                    checked={salvarStorage}
                    onCheckedChange={(checked) => setSalvarStorage(checked as boolean)}
                  />
                  <Label htmlFor="salvar-storage" className="text-sm font-normal">
                    Salvar no sistema após gerar
                  </Label>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Progresso da geração */}
          {(estadoGeracao !== 'ocioso' || gerando) && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>
                  {estadoGeracao === 'preparando' && 'Preparando dados...'}
                  {estadoGeracao === 'gerando' && 'Gerando PDF...'}
                  {estadoGeracao === 'salvando' && 'Salvando no sistema...'}
                  {gerando && !estadoGeracao && 'Gerando...'}
                </span>
                <span>{progresso}%</span>
              </div>
              <Progress value={progresso} className="h-1" />
            </div>
          )}

          {/* Pré-visualização */}
          {previewUrl && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Pré-visualização disponível</Label>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleVisualizarPreview}
                    className="h-8"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Visualizar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDownloadPreview}
                    className="h-8"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Baixar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Gere uma nova versão para atualizar a pré-visualização.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleGerarPrevisualizacao} 
              disabled={gerando || estadoGeracao !== 'ocioso'}
              size="sm"
            >
              {estadoGeracao === 'preparando' ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-3 w-3" />
                  Pré-visualizar
                </>
              )}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={gerando}>
              Cancelar
            </Button>
            <Button onClick={handleImprimir} disabled={gerando || estadoGeracao !== 'ocioso'}>
              {gerando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {estadoGeracao === 'salvando' ? 'Salvando...' : 'Gerando...'}
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Gerar e Baixar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
