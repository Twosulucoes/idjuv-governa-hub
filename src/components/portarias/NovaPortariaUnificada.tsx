import { useState, useEffect } from 'react';
import { FileText, Wand2, Download, FileType, ClipboardList, Users, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGerarNumeroPortaria, useCreatePortaria, useRegistrarPortariaNoHistorico } from '@/hooks/usePortarias';
import { CategoriaPortaria } from '@/types/portaria';
import {
  Artigo,
  ConfiguracaoTabela as ConfigTabela,
  ConfiguracaoAssinatura,
  PREAMBULO_TEMPLATES,
  ARTIGOS_TEMPLATES,
  ASSINATURA_PADRAO,
  COLUNAS_PADRAO,
} from '@/types/portariaUnificada';
import { SelecionarServidoresTable } from './SelecionarServidoresTable';
import { CamposDinamicos } from './CamposDinamicos';
import { EditorArtigos } from './EditorArtigos';
import { ConfiguracaoTabela } from './ConfiguracaoTabela';
import { generatePortariaUnificadaPdf } from '@/lib/pdfPortarias';
import { generatePortariaColetivaWord } from '@/lib/wordPortarias';

interface NovaPortariaUnificadaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIAS: { value: CategoriaPortaria; label: string }[] = [
  { value: 'nomeacao', label: 'Nomeação' },
  { value: 'exoneracao', label: 'Exoneração' },
  { value: 'designacao', label: 'Designação' },
  { value: 'dispensa', label: 'Dispensa' },
  { value: 'ferias', label: 'Férias' },
  { value: 'licenca', label: 'Licença' },
  { value: 'cessao', label: 'Cessão' },
  { value: 'delegacao', label: 'Delegação' },
  { value: 'pessoal', label: 'Pessoal (Genérica)' },
  { value: 'estruturante', label: 'Estruturante' },
  { value: 'normativa', label: 'Normativa' },
];

export function NovaPortariaUnificada({
  open,
  onOpenChange,
  onSuccess,
}: NovaPortariaUnificadaProps) {
  const [activeTab, setActiveTab] = useState<'dados' | 'conteudo' | 'servidores' | 'assinatura'>('dados');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dados básicos
  const [numero, setNumero] = useState('');
  const [dataDocumento, setDataDocumento] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState<CategoriaPortaria>('nomeacao');
  const [titulo, setTitulo] = useState('');
  const [ementa, setEmenta] = useState('');

  // Campos específicos por categoria (gerenciados pelo CamposDinamicos)
  const [camposEspecificos, setCamposEspecificos] = useState<Record<string, any>>({});

  // Conteúdo
  const [preambulo, setPreambulo] = useState(PREAMBULO_TEMPLATES.nomeacao);
  const [artigos, setArtigos] = useState<Artigo[]>(ARTIGOS_TEMPLATES.nomeacao);
  const [configTabela, setConfigTabela] = useState<ConfigTabela>({
    habilitada: true,
    colunas: COLUNAS_PADRAO,
    colunasPersonalizadas: [],
  });

  // Servidores
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [registrarHistorico, setRegistrarHistorico] = useState(true);

  // Assinatura
  const [assinatura, setAssinatura] = useState<ConfiguracaoAssinatura>(ASSINATURA_PADRAO);

  const gerarNumero = useGerarNumeroPortaria();
  const createPortaria = useCreatePortaria();
  const registrarHistoricoMutation = useRegistrarPortariaNoHistorico();

  // Atualizar templates quando categoria muda
  useEffect(() => {
    const novoPreambulo = PREAMBULO_TEMPLATES[categoria] || PREAMBULO_TEMPLATES.pessoal;
    const novosArtigos = ARTIGOS_TEMPLATES[categoria] || ARTIGOS_TEMPLATES.pessoal;
    
    setPreambulo(novoPreambulo);
    setArtigos(novosArtigos.map((a) => ({ ...a, id: crypto.randomUUID() })));
    setCamposEspecificos({});
  }, [categoria]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  const handleReset = () => {
    setActiveTab('dados');
    setNumero('');
    setDataDocumento(new Date().toISOString().split('T')[0]);
    setCategoria('nomeacao');
    setTitulo('');
    setEmenta('');
    setCamposEspecificos({});
    setPreambulo(PREAMBULO_TEMPLATES.nomeacao);
    setArtigos(ARTIGOS_TEMPLATES.nomeacao.map((a) => ({ ...a, id: crypto.randomUUID() })));
    setConfigTabela({
      habilitada: true,
      colunas: COLUNAS_PADRAO,
      colunasPersonalizadas: [],
    });
    setSelectedIds([]);
    setRegistrarHistorico(true);
    setAssinatura(ASSINATURA_PADRAO);
  };

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

  const handleCampoEspecificoChange = (campo: string, valor: any) => {
    setCamposEspecificos((prev) => ({ ...prev, [campo]: valor }));
  };

  const fetchServidoresData = async () => {
    const { data: servidoresData, error } = await supabase
      .from('v_servidores_situacao')
      .select('id, nome_completo, cpf, matricula, cargo_nome, cargo_sigla, cargo_id, unidade_id, unidade_nome')
      .in('id', selectedIds);

    if (error) throw error;

    return (servidoresData || []).map((s) => ({
      id: s.id,
      nome_completo: s.nome_completo || '',
      cpf: s.cpf || '',
      matricula: s.matricula || '',
      cargo: s.cargo_nome || '',
      codigo: s.cargo_sigla || '',
      cargo_id: s.cargo_id,
      unidade_id: s.unidade_id,
      unidade_nome: s.unidade_nome || '',
    }));
  };

  const buildCabecalhoCompleto = () => {
    let cabecalho = preambulo + '\n\n';
    
    if (!configTabela.habilitada) {
      artigos.forEach((artigo) => {
        cabecalho += `Art. ${artigo.numero} ${artigo.conteudo}\n\n`;
      });
    }
    
    return cabecalho.trim();
  };

  const handleSalvar = async () => {
    if (!numero) {
      toast.error('Informe o número da portaria');
      return;
    }
    if (!titulo) {
      toast.error('Informe o título da portaria');
      return;
    }

    setIsGenerating(true);
    try {
      const portariaData = {
        titulo,
        numero,
        tipo: 'portaria' as const,
        categoria,
        status: 'minuta' as const,
        data_documento: dataDocumento,
        ementa: ementa || `${CATEGORIAS.find((c) => c.value === categoria)?.label || 'Portaria'} - ${selectedIds.length} servidor(es)`,
        servidores_ids: selectedIds.length > 0 ? selectedIds : undefined,
        conteudo_html: buildCabecalhoCompleto(),
        cargo_id: camposEspecificos.cargo_id,
        unidade_id: camposEspecificos.unidade_id,
      };

      const portariaCriada = await createPortaria.mutateAsync(portariaData);

      // Registrar no histórico funcional se marcado
      if (registrarHistorico && selectedIds.length > 0 && portariaCriada?.numero) {
        try {
          await registrarHistoricoMutation.mutateAsync({
            servidores_ids: selectedIds,
            portaria_numero: portariaCriada.numero,
            portaria_data: dataDocumento,
            categoria,
            cargo_id: camposEspecificos.cargo_id,
            unidade_id: camposEspecificos.unidade_id,
          });
          toast.success(`Portaria salva e ${selectedIds.length} registro(s) adicionado(s) ao histórico funcional!`);
        } catch (histError) {
          console.error('Erro ao registrar histórico:', histError);
          toast.success('Portaria salva! (erro ao registrar histórico)');
        }
      } else {
        toast.success('Portaria salva com sucesso!');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar portaria');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGerarPdf = async () => {
    if (!numero) {
      toast.error('Informe o número da portaria');
      return;
    }
    if (configTabela.habilitada && selectedIds.length === 0) {
      toast.error('Selecione pelo menos um servidor para gerar PDF com tabela');
      return;
    }

    setIsGenerating(true);
    try {
      const servidoresParaPdf = await fetchServidoresData();

      const doc = await generatePortariaUnificadaPdf(
        { numero, data_documento: dataDocumento },
        preambulo,
        artigos,
        servidoresParaPdf,
        configTabela,
        assinatura
      );

      const nomeArquivo = `Portaria_${numero.replace(/\//g, '-')}.pdf`;
      doc.save(nomeArquivo);

      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGerarWord = async () => {
    if (!numero) {
      toast.error('Informe o número da portaria');
      return;
    }
    if (configTabela.habilitada && selectedIds.length === 0) {
      toast.error('Selecione pelo menos um servidor para gerar Word com tabela');
      return;
    }

    setIsGenerating(true);
    try {
      const servidoresParaWord = await fetchServidoresData();
      const tipoAcao = categoria === 'exoneracao' ? 'exoneracao' : 'nomeacao';

      await generatePortariaColetivaWord(
        { numero, data_documento: dataDocumento },
        preambulo,
        servidoresParaWord,
        tipoAcao
      );

      toast.success('Documento Word gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar Word');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = numero && (configTabela.habilitada ? selectedIds.length > 0 : true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Portaria
          </DialogTitle>
          <DialogDescription>
            Crie portarias de qualquer tipo com modelo padronizado do IDJuv
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Dados Básicos</span>
              <span className="sm:hidden">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="conteudo" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="servidores" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Servidores</span>
              {selectedIds.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedIds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assinatura" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Assinatura</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            {/* ABA: DADOS BÁSICOS */}
            <TabsContent value="dados" className="m-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número da Portaria</Label>
                  <div className="flex gap-2">
                    <Input
                      id="numero"
                      placeholder="Ex: 001/IDJuv/PRESI/GAB/2026"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGerarNumero}
                      disabled={gerarNumero.isPending}
                    >
                      <Wand2 className="h-4 w-4 mr-1" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaPortaria)}>
                    <SelectTrigger id="categoria">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Nomeação de Servidores"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ementa">Ementa (opcional)</Label>
                <Textarea
                  id="ementa"
                  placeholder="Resumo do conteúdo da portaria..."
                  value={ementa}
                  onChange={(e) => setEmenta(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Campos específicos por categoria (renderiza dinamicamente) */}
              <CamposDinamicos
                categoria={categoria}
                valores={camposEspecificos}
                onChange={handleCampoEspecificoChange}
              />
            </TabsContent>

            {/* ABA: CONTEÚDO */}
            <TabsContent value="conteudo" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preambulo">Preâmbulo / Cabeçalho</Label>
                <Textarea
                  id="preambulo"
                  className="min-h-[200px] font-mono text-sm"
                  value={preambulo}
                  onChange={(e) => setPreambulo(e.target.value)}
                  placeholder="Texto de abertura da portaria..."
                />
              </div>

              <Separator />

              {/* Configuração da Tabela */}
              <ConfiguracaoTabela config={configTabela} onChange={setConfigTabela} />

              <Separator />

              {/* Editor de Artigos */}
              <EditorArtigos artigos={artigos} onChange={setArtigos} />
            </TabsContent>

            {/* ABA: SERVIDORES */}
            <TabsContent value="servidores" className="m-0 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  Selecione os servidores que serão incluídos na portaria
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="registrar-historico"
                    checked={registrarHistorico}
                    onCheckedChange={(checked) => setRegistrarHistorico(checked === true)}
                  />
                  <Label htmlFor="registrar-historico" className="text-sm font-normal cursor-pointer">
                    Registrar no histórico funcional
                  </Label>
                </div>
              </div>

              <SelecionarServidoresTable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                maxHeight="450px"
              />
            </TabsContent>

            {/* ABA: ASSINATURA */}
            <TabsContent value="assinatura" className="m-0 space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assinatura-nome">Nome do Signatário</Label>
                    <Input
                      id="assinatura-nome"
                      value={assinatura.nome}
                      onChange={(e) => setAssinatura((prev) => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assinatura-cargo">Cargo</Label>
                    <Textarea
                      id="assinatura-cargo"
                      value={assinatura.cargo}
                      onChange={(e) => setAssinatura((prev) => ({ ...prev, cargo: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assinatura-local">Local</Label>
                    <Input
                      id="assinatura-local"
                      value={assinatura.local}
                      onChange={(e) => setAssinatura((prev) => ({ ...prev, local: e.target.value }))}
                    />
                  </div>

                  {/* Preview da assinatura */}
                  <div className="border-t pt-4 mt-4">
                    <Label className="text-sm font-medium mb-3 block">Prévia da Assinatura</Label>
                    <div className="text-center py-6 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-4">
                        {assinatura.local}, {format(new Date(dataDocumento), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="font-bold">{assinatura.nome}</p>
                      <p className="text-sm whitespace-pre-line">{assinatura.cargo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleSalvar}
            disabled={!numero || !titulo || isGenerating}
          >
            Salvar Minuta
          </Button>
          <Button
            variant="outline"
            onClick={handleGerarWord}
            disabled={!canGenerate || isGenerating}
          >
            <FileType className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Word'}
          </Button>
          <Button
            onClick={handleGerarPdf}
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
