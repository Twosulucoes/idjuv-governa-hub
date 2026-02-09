/**
 * FORMULÁRIO SIMPLIFICADO DE PORTARIA
 * 
 * Central de cadastro de portarias genéricas.
 * Campos: Tipo, Número, Data, DOE, PDF, Ementa, Servidores
 * 
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { FileText, Wand2, Upload, X, Users, Save, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGerarNumeroPortaria, useCreatePortaria, useUpdatePortaria, usePortaria } from '@/hooks/usePortarias';
import { CategoriaPortaria, Portaria } from '@/types/portaria';
import { SelecionarServidoresTable } from './SelecionarServidoresTable';

interface NovaPortariaSimplificadaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
  portariaId?: string;
  initialPortaria?: Portaria | null;
}

const CATEGORIAS: { value: CategoriaPortaria; label: string }[] = [
  { value: 'pessoal', label: 'Pessoal (Genérica)' },
  { value: 'nomeacao', label: 'Nomeação' },
  { value: 'exoneracao', label: 'Exoneração' },
  { value: 'designacao', label: 'Designação' },
  { value: 'dispensa', label: 'Dispensa' },
  { value: 'ferias', label: 'Férias' },
  { value: 'licenca', label: 'Licença' },
  { value: 'cessao', label: 'Cessão' },
  { value: 'delegacao', label: 'Delegação' },
  { value: 'estruturante', label: 'Estruturante' },
  { value: 'normativa', label: 'Normativa' },
];

export function NovaPortariaSimplificada({
  open,
  onOpenChange,
  onSuccess,
  mode = 'create',
  portariaId,
  initialPortaria,
}: NovaPortariaSimplificadaProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showServidores, setShowServidores] = useState(false);

  // Dados básicos
  const [categoria, setCategoria] = useState<CategoriaPortaria>('pessoal');
  const [numero, setNumero] = useState('');
  const [dataDocumento, setDataDocumento] = useState(new Date().toISOString().split('T')[0]);
  const [ementa, setEmenta] = useState('');

  // Publicação DOE
  const [doeNumero, setDoeNumero] = useState('');
  const [doeData, setDoeData] = useState('');
  const [doePagina, setDoePagina] = useState('');

  // Anexo
  const [arquivoUrl, setArquivoUrl] = useState('');
  const [arquivoNome, setArquivoNome] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Servidores
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const gerarNumero = useGerarNumeroPortaria();
  const createPortaria = useCreatePortaria();
  const updatePortaria = useUpdatePortaria();

  // Carregar portaria para edição
  const { data: portariaData } = usePortaria(mode === 'edit' ? portariaId : undefined);

  // Carregar dados da portaria em modo edição
  useEffect(() => {
    if (mode === 'edit' && open && !isLoaded) {
      const portaria = initialPortaria || portariaData;
      if (portaria) {
        setCategoria((portaria.categoria as CategoriaPortaria) || 'pessoal');
        setNumero(portaria.numero || '');
        setDataDocumento(portaria.data_documento || new Date().toISOString().split('T')[0]);
        setEmenta(portaria.ementa || '');
        setDoeNumero(portaria.doe_numero || '');
        setDoeData(portaria.doe_data || '');
        setDoePagina((portaria as any).doe_pagina || '');
        setArquivoUrl(portaria.arquivo_url || '');
        setSelectedIds(portaria.servidores_ids || []);
        setIsLoaded(true);
      }
    }
  }, [mode, open, portariaData, initialPortaria, isLoaded]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  const handleReset = () => {
    setCategoria('pessoal');
    setNumero('');
    setDataDocumento(new Date().toISOString().split('T')[0]);
    setEmenta('');
    setDoeNumero('');
    setDoeData('');
    setDoePagina('');
    setArquivoUrl('');
    setArquivoNome('');
    setSelectedIds([]);
    setShowServidores(false);
    setIsLoaded(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máximo 10MB)');
      return;
    }

    setIsUploading(true);
    try {
      // Sanitize filename to avoid special characters
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `portarias/${Date.now()}_${safeName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error details:', JSON.stringify(uploadError));
        throw new Error(uploadError.message || 'Falha no upload');
      }

      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      setArquivoUrl(urlData.publicUrl);
      setArquivoNome(file.name);
      toast.success('Arquivo anexado!');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setArquivoUrl('');
    setArquivoNome('');
  };

  const handleSalvar = async () => {
    if (!numero.trim()) {
      toast.error('Informe o número da portaria');
      return;
    }

    setIsSaving(true);
    try {
      // Determinar status baseado nos dados preenchidos
      let status: 'minuta' | 'aguardando_assinatura' | 'publicado' | 'vigente' = 'minuta';
      if (doeNumero && doeData) {
        status = 'vigente';
      } else if (arquivoUrl) {
        status = 'publicado';
      }

      const portariaPayload = {
        tipo: 'portaria' as const,
        categoria,
        numero,
        data_documento: dataDocumento,
        ementa: ementa || `Portaria de ${CATEGORIAS.find(c => c.value === categoria)?.label || categoria}`,
        titulo: ementa || `Portaria nº ${numero}`,
        status,
        doe_numero: doeNumero || undefined,
        doe_data: doeData || undefined,
        doe_pagina: doePagina || undefined,
        arquivo_url: arquivoUrl || undefined,
        servidores_ids: selectedIds.length > 0 ? selectedIds : undefined,
      };

      if (mode === 'edit' && portariaId) {
        await updatePortaria.mutateAsync({ id: portariaId, dados: portariaPayload });
        toast.success('Portaria atualizada!');
      } else {
        await createPortaria.mutateAsync(portariaPayload);
        toast.success(`Portaria ${numero} cadastrada com sucesso!`);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar portaria');
    } finally {
      setIsSaving(false);
    }
  };

  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditMode ? 'Editar Portaria' : 'Cadastrar Portaria'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Editando portaria nº ${numero}`
              : 'Registre uma portaria existente ou nova'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dados Básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Tipo de Portaria</Label>
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
            <Label htmlFor="numero">Número da Portaria *</Label>
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
            <Label htmlFor="ementa">Ementa / Resumo</Label>
            <Textarea
              id="ementa"
              placeholder="Breve descrição do conteúdo da portaria..."
              value={ementa}
              onChange={(e) => setEmenta(e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          {/* Publicação DOE */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Publicação no DOE (opcional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doe-numero">Nº DOE</Label>
                <Input
                  id="doe-numero"
                  placeholder="Ex: 12.345"
                  value={doeNumero}
                  onChange={(e) => setDoeNumero(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doe-data">Data Publicação</Label>
                <Input
                  id="doe-data"
                  type="date"
                  value={doeData}
                  onChange={(e) => setDoeData(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doe-pagina">Página</Label>
                <Input
                  id="doe-pagina"
                  placeholder="Ex: 15"
                  value={doePagina}
                  onChange={(e) => setDoePagina(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Anexo PDF */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Arquivo da Portaria (PDF)</h4>
            {arquivoUrl ? (
              <Card>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm truncate max-w-[200px]">
                      {arquivoNome || 'Arquivo anexado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open(arquivoUrl, '_blank')}
                    >
                      Visualizar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Clique para anexar PDF (máx. 10MB)
                      </span>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          <Separator />

          {/* Servidores (Collapsible) */}
          <Collapsible open={showServidores} onOpenChange={setShowServidores}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                type="button"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Vincular Servidores
                </span>
                <div className="flex items-center gap-2">
                  {selectedIds.length > 0 && (
                    <Badge variant="secondary">{selectedIds.length} selecionado(s)</Badge>
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <SelecionarServidoresTable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                maxHeight="350px"
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isSaving || !numero.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Salvar Alterações' : 'Cadastrar Portaria'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
