/**
 * Dialog para Impressão em Lote de Folhas de Frequência por Unidade Administrativa
 * 
 * REGRA DE OURO: 1 PÁGINA POR SERVIDOR (NUNCA AGRUPAR)
 * O lote é apenas para organização, ordenação e encadernação
 */
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Users,
  Loader2,
  Printer,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  Info,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { useUnidadesAdministrativas, useServidoresUnidadeFrequencia, type ServidorComSituacao } from "@/hooks/useServidoresPorUnidade";
import { useDiasNaoUteis, useAssinaturaPadrao } from "@/hooks/useParametrizacoesFrequencia";
import { useAuth } from "@/contexts/AuthContext";
import { generateFrequenciaLotePDF, type LoteFrequenciaPDFConfig } from "@/lib/pdfFrequenciaLote";
import { MESES } from "@/types/folha";

interface ImprimirLoteFrequenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ano?: number;
  mes?: number;
}

export function ImprimirLoteFrequenciaDialog({
  open,
  onOpenChange,
  ano: anoInicial,
  mes: mesInicial,
}: ImprimirLoteFrequenciaDialogProps) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [unidadeId, setUnidadeId] = useState<string>("");
  const [ano, setAno] = useState(anoInicial || anoAtual);
  const [mes, setMes] = useState(mesInicial || mesAtual);
  const [ordenacao, setOrdenacao] = useState<'alfabetica' | 'matricula'>('alfabetica');
  const [incluirCapa, setIncluirCapa] = useState(true);
  const [incluirDispensados, setIncluirDispensados] = useState(true);
  const [gerando, setGerando] = useState(false);

  const { user } = useAuth();
  const { data: unidades, isLoading: loadingUnidades } = useUnidadesAdministrativas();
  const { data: dadosUnidade, isLoading: loadingServidores } = useServidoresUnidadeFrequencia(
    unidadeId || undefined,
    ano,
    mes
  );
  const { data: diasNaoUteis } = useDiasNaoUteis(ano);
  const { data: configAssinatura } = useAssinaturaPadrao();

  const anos = useMemo(() => Array.from({ length: 5 }, (_, i) => anoAtual - i), [anoAtual]);

  // Filtrar servidores conforme opções
  const servidoresParaImprimir = useMemo(() => {
    if (!dadosUnidade?.servidores) return [];

    let lista = [...dadosUnidade.servidores];

    // Excluir dispensados totais se não marcado
    if (!incluirDispensados) {
      lista = lista.filter(s => !s.dispensa_total);
    }

    // Ordenar
    if (ordenacao === 'alfabetica') {
      lista.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'));
    } else {
      lista.sort((a, b) => (a.matricula || '').localeCompare(b.matricula || '', 'pt-BR'));
    }

    return lista;
  }, [dadosUnidade?.servidores, incluirDispensados, ordenacao]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!dadosUnidade) return null;
    return {
      total: dadosUnidade.total_servidores,
      normais: dadosUnidade.servidores_normais,
      parciais: dadosUnidade.servidores_parciais,
      dispensados: dadosUnidade.servidores_dispensados,
      aImprimir: servidoresParaImprimir.length,
    };
  }, [dadosUnidade, servidoresParaImprimir]);

  const handleImprimir = async () => {
    if (!unidadeId || !dadosUnidade || servidoresParaImprimir.length === 0) {
      toast.error("Selecione uma unidade com servidores para imprimir.");
      return;
    }

    setGerando(true);

    try {
      const config: LoteFrequenciaPDFConfig = {
        unidade: {
          id: dadosUnidade.id,
          nome: dadosUnidade.nome,
          sigla: dadosUnidade.sigla,
        },
        competencia: { mes, ano },
        servidores: servidoresParaImprimir,
        diasNaoUteis: diasNaoUteis || [],
        configAssinatura: {
          servidor_obrigatoria: configAssinatura?.assinatura_servidor_obrigatoria ?? true,
          chefia_obrigatoria: configAssinatura?.assinatura_chefia_obrigatoria ?? true,
          rh_obrigatoria: configAssinatura?.assinatura_rh_obrigatoria ?? false,
          texto_declaracao: configAssinatura?.texto_declaracao || 
            'Declaro que as informações acima refletem fielmente a jornada de trabalho exercida no período.',
        },
        opcoes: {
          incluirCapa,
          ordenacao,
        },
        dataGeracao: format(new Date(), "dd/MM/yyyy 'às' HH:mm"),
        usuarioGeracao: user?.email || 'Sistema',
      };

      await generateFrequenciaLotePDF(config);

      toast.success(`PDF gerado com ${servidoresParaImprimir.length} folhas de frequência!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao gerar PDF em lote:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Impressão em Lote por Unidade
          </DialogTitle>
          <DialogDescription>
            Gerar PDF com folhas de frequência de todos os servidores da unidade
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Seleção de Período e Unidade */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mês</Label>
                <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Ano</Label>
                <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((a) => (
                      <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-1">
                <Label className="text-sm font-medium">Unidade Administrativa</Label>
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingUnidades ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      unidades?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Carregando servidores */}
            {unidadeId && loadingServidores && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregando servidores...
              </div>
            )}

            {/* Estatísticas da Unidade */}
            {stats && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">{dadosUnidade?.sigla || ''} - {dadosUnidade?.nome}</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total Servidores</div>
                    </div>
                    <div className="rounded-lg border bg-success/10 p-3 text-center">
                      <div className="text-2xl font-bold text-success">{stats.normais}</div>
                      <div className="text-xs text-muted-foreground">Frequência Normal</div>
                    </div>
                    <div className="rounded-lg border bg-warning/10 p-3 text-center">
                      <div className="text-2xl font-bold text-warning">{stats.parciais}</div>
                      <div className="text-xs text-muted-foreground">Mês Parcial</div>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-3 text-center">
                      <div className="text-2xl font-bold text-muted-foreground">{stats.dispensados}</div>
                      <div className="text-xs text-muted-foreground">Dispensados</div>
                    </div>
                  </div>

                  {/* Lista de situações especiais */}
                  {(stats.parciais > 0 || stats.dispensados > 0) && (
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        Situações Administrativas Identificadas:
                      </div>
                      <div className="space-y-1 text-xs">
                        {dadosUnidade?.servidores
                          .filter(s => s.situacoes_mes.length > 0)
                          .slice(0, 5)
                          .map((s, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <span className="font-medium text-foreground">{s.nome_completo}:</span>
                              <span>{s.situacoes_mes.map(sit => sit.subtipo || sit.tipo).join(', ')}</span>
                              {s.dispensa_total && <Badge variant="secondary" className="text-[10px]">Mês integral</Badge>}
                            </div>
                          ))}
                        {(stats.parciais + stats.dispensados) > 5 && (
                          <div className="text-muted-foreground italic">
                            ... e mais {(stats.parciais + stats.dispensados) - 5} servidor(es) com situação especial
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Opções de Impressão */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Opções de Impressão</Label>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluirCapa"
                        checked={incluirCapa}
                        onCheckedChange={(v) => setIncluirCapa(!!v)}
                      />
                      <Label htmlFor="incluirCapa" className="text-sm cursor-pointer">
                        Incluir capa do lote com informações da unidade e período
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluirDispensados"
                        checked={incluirDispensados}
                        onCheckedChange={(v) => setIncluirDispensados(!!v)}
                      />
                      <Label htmlFor="incluirDispensados" className="text-sm cursor-pointer">
                        Incluir servidores com dispensa total (licença, cessão, etc.)
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ordenação dos Servidores</Label>
                    <RadioGroup
                      value={ordenacao}
                      onValueChange={(v) => setOrdenacao(v as 'alfabetica' | 'matricula')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="alfabetica" id="ord-alfa" />
                        <Label htmlFor="ord-alfa" className="text-sm cursor-pointer">Alfabética (A-Z)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="matricula" id="ord-mat" />
                        <Label htmlFor="ord-mat" className="text-sm cursor-pointer">Por Matrícula</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Resumo Final */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-semibold text-primary">
                        {stats.aImprimir} folha{stats.aImprimir !== 1 ? 's' : ''} de frequência
                        {incluirCapa ? ' + 1 capa' : ''}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total de {stats.aImprimir + (incluirCapa ? 1 : 0)} página{(stats.aImprimir + (incluirCapa ? 1 : 0)) !== 1 ? 's' : ''} no documento final
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerta importante */}
                <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-warning">
                    <span className="font-medium">Importante:</span> Cada servidor ocupa exatamente 1 página. 
                    Servidores com situação administrativa terão observação automática na folha.
                  </div>
                </div>
              </>
            )}

            {/* Estado vazio */}
            {unidadeId && !loadingServidores && (!dadosUnidade || dadosUnidade.total_servidores === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum servidor ativo encontrado nesta unidade.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={gerando}>
            Cancelar
          </Button>
          <Button
            onClick={handleImprimir}
            disabled={gerando || !unidadeId || !stats || stats.aImprimir === 0}
          >
            {gerando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Gerar PDF do Lote
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
