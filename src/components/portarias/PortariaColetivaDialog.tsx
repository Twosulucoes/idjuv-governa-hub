import { useState } from 'react';
import { FileText, Download, Users, CalendarDays, FileType } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGerarNumeroPortaria, useCreatePortaria } from '@/hooks/usePortarias';
import { SelecionarServidoresTable } from './SelecionarServidoresTable';
import { generatePortariaColetivaComTabela } from '@/lib/pdfPortarias';
import { generatePortariaColetivaWord } from '@/lib/wordPortarias';

type CategoriaColetiva = 'nomeacao_coletiva' | 'exoneracao_coletiva' | 'designacao_coletiva';

const CATEGORIAS_COLETIVAS: Record<CategoriaColetiva, string> = {
  nomeacao_coletiva: 'Nomeação Coletiva',
  exoneracao_coletiva: 'Exoneração Coletiva',
  designacao_coletiva: 'Designação Coletiva',
};

// Mapeamento de categoria coletiva para tipo de movimentação funcional
type TipoMovimentacao = 'nomeacao' | 'exoneracao' | 'designacao';
const CATEGORIA_TO_TIPO_MOVIMENTACAO: Record<CategoriaColetiva, TipoMovimentacao> = {
  nomeacao_coletiva: 'nomeacao',
  exoneracao_coletiva: 'exoneracao',
  designacao_coletiva: 'designacao',
};

const TEXTO_PADRAO_CABECALHO = `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

CONSIDERANDO o disposto no art. 7º, §3º, da Lei nº 2.301/2025, que estabelece que a investidura nos cargos em comissão do IDJuv dar-se-á por ato do Diretor Presidente;

RESOLVE:`;

interface PortariaColetivaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PortariaColetivaDialog({
  open,
  onOpenChange,
  onSuccess,
}: PortariaColetivaDialogProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'servidores'>('config');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dados do formulário
  const [numero, setNumero] = useState('');
  const [dataDocumento, setDataDocumento] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [categoria, setCategoria] = useState<CategoriaColetiva>('nomeacao_coletiva');
  const [cabecalho, setCabecalho] = useState(TEXTO_PADRAO_CABECALHO);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const gerarNumero = useGerarNumeroPortaria();
  const createPortaria = useCreatePortaria();

  const handleGerarNumero = async () => {
    try {
      const ano = new Date(dataDocumento).getFullYear();
      const novoNumero = await gerarNumero.mutateAsync(ano);
      setNumero(novoNumero);
      toast.success('Número gerado com sucesso!');
    } catch {
      toast.error('Erro ao gerar número da portaria');
    }
  };

  const handleReset = () => {
    setNumero('');
    setDataDocumento(new Date().toISOString().split('T')[0]);
    setCategoria('nomeacao_coletiva');
    setCabecalho(TEXTO_PADRAO_CABECALHO);
    setSelectedIds([]);
    setActiveTab('config');
  };

  const fetchServidoresData = async () => {
    const { data: servidoresData, error } = await supabase
      .from('v_servidores_situacao')
      .select('id, nome_completo, cpf, cargo_nome, cargo_sigla, cargo_id, unidade_id, unidade_nome')
      .in('id', selectedIds);

    if (error) throw error;

    return (servidoresData || []).map((s) => ({
      id: s.id,
      nome_completo: s.nome_completo || '',
      cpf: s.cpf || '',
      cargo: s.cargo_nome || '',
      codigo: s.cargo_sigla || '',
      cargo_id: s.cargo_id,
      unidade_id: s.unidade_id,
      unidade_nome: s.unidade_nome || '',
    }));
  };

  const registrarHistoricoFuncional = async (
    servidores: Array<{
      id: string;
      nome_completo: string;
      cargo_id: string | null;
      unidade_id: string | null;
      unidade_nome: string;
      cargo: string;
    }>,
    portariaNumero: string,
    portariaData: string
  ) => {
    const tipoMovimentacao = CATEGORIA_TO_TIPO_MOVIMENTACAO[categoria];
    const categoriaLabel = CATEGORIAS_COLETIVAS[categoria];
    
    const registros = servidores.map((servidor) => {
      const descricaoBase = `${categoriaLabel} via Portaria nº ${portariaNumero}`;
      
      return {
        servidor_id: servidor.id,
        tipo: tipoMovimentacao,
        data_evento: portariaData,
        data_vigencia_inicio: portariaData,
        portaria_numero: portariaNumero,
        portaria_data: portariaData,
        cargo_novo_id: categoria === 'nomeacao_coletiva' || categoria === 'designacao_coletiva' 
          ? servidor.cargo_id 
          : null,
        cargo_anterior_id: categoria === 'exoneracao_coletiva' 
          ? servidor.cargo_id 
          : null,
        unidade_nova_id: categoria === 'nomeacao_coletiva' || categoria === 'designacao_coletiva'
          ? servidor.unidade_id
          : null,
        unidade_anterior_id: categoria === 'exoneracao_coletiva'
          ? servidor.unidade_id
          : null,
        descricao: `${descricaoBase}. Cargo: ${servidor.cargo || 'N/A'}. Unidade: ${servidor.unidade_nome || 'N/A'}.`,
        ato_tipo: 'portaria',
        ato_numero: portariaNumero,
        ato_data: portariaData,
      };
    });

    const { error } = await supabase
      .from('historico_funcional')
      .insert(registros);

    if (error) {
      console.error('Erro ao registrar histórico funcional:', error);
      throw error;
    }

    return registros.length;
  };

  const handleGeneratePdf = async () => {
    if (!numero) {
      toast.error('Informe o número da portaria');
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um servidor');
      return;
    }

    setIsGenerating(true);
    try {
      const servidoresParaPdf = await fetchServidoresData();
      const tipoAcao = categoria === 'exoneracao_coletiva' ? 'exoneracao' : 'nomeacao';

      const doc = generatePortariaColetivaComTabela(
        { numero, data_documento: dataDocumento },
        cabecalho,
        servidoresParaPdf,
        tipoAcao
      );

      const nomeArquivo = `Portaria_Coletiva_${numero.replace(/\//g, '-')}.pdf`;
      doc.save(nomeArquivo);

      // Criar registro da portaria na tabela documentos
      await createPortaria.mutateAsync({
        titulo: `Portaria Coletiva - ${CATEGORIAS_COLETIVAS[categoria]}`,
        numero,
        tipo: 'portaria',
        categoria: categoria as any,
        status: 'minuta',
        data_documento: dataDocumento,
        ementa: `${CATEGORIAS_COLETIVAS[categoria]} de ${servidoresParaPdf.length} servidor(es).`,
        servidores_ids: selectedIds,
        conteudo_html: cabecalho,
      });

      // Registrar no histórico funcional de cada servidor
      const qtdRegistros = await registrarHistoricoFuncional(
        servidoresParaPdf,
        numero,
        dataDocumento
      );

      toast.success(`PDF gerado e ${qtdRegistros} registro(s) adicionado(s) ao histórico funcional!`);
      onSuccess?.();
      onOpenChange(false);
      handleReset();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF da portaria coletiva');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWord = async () => {
    if (!numero) {
      toast.error('Informe o número da portaria');
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um servidor');
      return;
    }

    setIsGenerating(true);
    try {
      const servidoresParaWord = await fetchServidoresData();
      const tipoAcao = categoria === 'exoneracao_coletiva' ? 'exoneracao' : 'nomeacao';

      await generatePortariaColetivaWord(
        { numero, data_documento: dataDocumento },
        cabecalho,
        servidoresParaWord,
        tipoAcao
      );

      toast.success('Documento Word gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar documento Word');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = numero && selectedIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Portaria Coletiva
          </DialogTitle>
          <DialogDescription>
            Crie uma portaria para múltiplos servidores com tabela formatada
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="servidores" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Servidores
              {selectedIds.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedIds.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="config" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número da Portaria</Label>
                  <div className="flex gap-2">
                    <Input
                      id="numero"
                      placeholder="Ex: 001/2026"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGerarNumero}
                      disabled={gerarNumero.isPending}
                    >
                      Gerar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data do Documento</Label>
                  <Input
                    id="data"
                    type="date"
                    value={dataDocumento}
                    onChange={(e) => setDataDocumento(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={categoria}
                  onValueChange={(v) => setCategoria(v as CategoriaColetiva)}
                >
                  <SelectTrigger id="categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIAS_COLETIVAS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cabecalho">Cabeçalho / Preâmbulo</Label>
                <Textarea
                  id="cabecalho"
                  className="min-h-[350px] font-mono text-sm"
                  value={cabecalho}
                  onChange={(e) => setCabecalho(e.target.value)}
                  placeholder="Digite o texto de abertura da portaria..."
                />
              </div>
            </TabsContent>

            <TabsContent value="servidores" className="m-0">
              <SelecionarServidoresTable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                maxHeight="500px"
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateWord}
            disabled={!canGenerate || isGenerating}
          >
            <FileType className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Word'}
          </Button>
          <Button
            onClick={handleGeneratePdf}
            disabled={!canGenerate || isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
