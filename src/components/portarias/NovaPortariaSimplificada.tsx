/**
 * REGISTRO DE PORTARIA FEITA NO SEI
 *
 * O sistema não redige portaria: o texto, a assinatura e a numeração são do SEI.
 * Aqui se registra o ato para acompanhar o ciclo (processo SEI, número oficial,
 * publicação no DOE, PDF e servidores) e levá-lo à ficha funcional.
 * Campos: Tipo, Processo SEI, Número, Data, DOE, PDF, Ementa, Servidores
 */

import { useState, useEffect } from 'react';
import { FileText, Upload, X, Users, Save, Loader2 } from 'lucide-react';
import { z } from 'zod';
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
import { useCreatePortaria, useUpdatePortaria, usePortaria, NUMERO_PORTARIA_PENDENTE } from '@/hooks/usePortarias';
import { CategoriaPortaria, Portaria, StatusPortaria } from '@/types/portaria';
import { SelecionarServidoresTable } from './SelecionarServidoresTable';

interface NovaPortariaSimplificadaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
  portariaId?: string;
  initialPortaria?: Portaria | null;
}

// Número e DOE: o DOE só entra com nº e data juntos, e um ato publicado precisa do número oficial do SEI
// (o banco recusa número provisório além de "aguardando assinatura").
const registroSchema = z
  .object({
    numero: z.string().trim(),
    processoSei: z.string().trim().max(60, 'Processo SEI muito longo'),
    dataDocumento: z.string().min(1, 'Informe a data do documento'),
    doeNumero: z.string().trim(),
    doeData: z.string(),
  })
  .refine((v) => !v.numero || !NUMERO_PORTARIA_PENDENTE.test(v.numero), {
    message: 'Informe o número oficial do SEI ou deixe em branco (fica como pendente)',
    path: ['numero'],
  })
  .refine((v) => !!v.doeNumero === !!v.doeData, {
    message: 'Informe o número e a data do DOE juntos',
    path: ['doeNumero'],
  })
  .refine((v) => !v.doeNumero || !!v.numero, {
    message: 'Para registrar a publicação no DOE, informe o número oficial da portaria',
    path: ['numero'],
  });

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
  const [processoSei, setProcessoSei] = useState('');
  const [statusAtual, setStatusAtual] = useState<StatusPortaria | null>(null);
  const [dataDocumento, setDataDocumento] = useState(new Date().toISOString().split('T')[0]);
  const [ementa, setEmenta] = useState('');

  // Publicação DOE
  const [doeNumero, setDoeNumero] = useState('');
  const [doeData, setDoeData] = useState('');

  // Anexo
  const [arquivoUrl, setArquivoUrl] = useState('');
  const [arquivoNome, setArquivoNome] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Servidores
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        // número provisório aparece em branco: o campo é para o número oficial do SEI
        setNumero(portaria.numero && !NUMERO_PORTARIA_PENDENTE.test(portaria.numero) ? portaria.numero : '');
        setProcessoSei(portaria.processo_sei || '');
        setStatusAtual(portaria.status);
        setDataDocumento(portaria.data_documento || new Date().toISOString().split('T')[0]);
        setEmenta(portaria.ementa || '');
        setDoeNumero(portaria.doe_numero || '');
        setDoeData(portaria.doe_data || '');
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
    setProcessoSei('');
    setStatusAtual(null);
    setDataDocumento(new Date().toISOString().split('T')[0]);
    setEmenta('');
    setDoeNumero('');
    setDoeData('');
    setArquivoUrl('');
    setArquivoNome('');
    setSelectedIds([]);
    setShowServidores(false);
    setIsLoaded(false);
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

  const isEditMode = mode === 'edit';
  // Na edição, DOE só se mexe em ato já publicado; as etapas avançam por "Registrar assinatura/publicação"
  const podeEditarDoe = !isEditMode || statusAtual === 'publicado' || statusAtual === 'vigente';

  const handleSalvar = async () => {
    const validacao = registroSchema.safeParse({
      numero,
      processoSei,
      dataDocumento,
      doeNumero: podeEditarDoe ? doeNumero : '',
      doeData: podeEditarDoe ? doeData : '',
    });
    if (!validacao.success) {
      toast.error(validacao.error.issues[0]?.message || 'Verifique os campos');
      return;
    }
    const v = validacao.data;
    const rotuloCategoria = CATEGORIAS.find(c => c.value === categoria)?.label || categoria;

    setIsSaving(true);
    try {
      const portariaPayload = {
        tipo: 'portaria' as const,
        categoria,
        // sem número oficial, o hook grava o provisório PENDENTE/AAAA (na edição, mantém o atual)
        numero: v.numero || undefined,
        processo_sei: v.processoSei || null,
        data_documento: v.dataDocumento,
        ementa: ementa || `Portaria de ${rotuloCategoria}`,
        titulo: ementa || (v.numero ? `Portaria nº ${v.numero}` : `Portaria de ${rotuloCategoria}`),
        arquivo_url: arquivoUrl || undefined,
        servidores_ids: selectedIds.length > 0 ? selectedIds : undefined,
        ...(podeEditarDoe && {
          doe_numero: v.doeNumero || undefined,
          doe_data: v.doeData || undefined,
          data_publicacao: v.doeData || undefined,
        }),
      };

      if (isEditMode && portariaId) {
        // a edição não muda a etapa do ciclo
        await updatePortaria.mutateAsync({ id: portariaId, dados: portariaPayload });
        toast.success('Portaria atualizada!');
      } else {
        // Etapa conforme o que já aconteceu no SEI: publicado no DOE; com número oficial, aguardando assinatura;
        // sem número, "Aguardando SEI" (minuta)
        const status: StatusPortaria = v.doeNumero && v.doeData
          ? 'publicado'
          : v.numero
            ? 'aguardando_assinatura'
            : 'minuta';
        await createPortaria.mutateAsync({ ...portariaPayload, status });
        toast.success(v.numero ? `Portaria ${v.numero} registrada!` : 'Portaria registrada como pendente do SEI');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditMode ? 'Editar registro da portaria' : 'Registrar portaria do SEI'}
          </DialogTitle>
          <DialogDescription>
            O texto, a assinatura e o número da portaria são feitos no SEI. Aqui fica só o registro do ato
            para acompanhar o ciclo (processo, número, assinatura e publicação no DOE) e levá-lo à ficha do servidor.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="processo-sei">Processo SEI</Label>
              <Input
                id="processo-sei"
                placeholder="Número do processo no SEI"
                value={processoSei}
                onChange={(e) => setProcessoSei(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número da portaria (SEI)</Label>
              <Input
                id="numero"
                placeholder="Em branco se ainda não saiu"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Sem o número oficial, a portaria fica como "Aguardando SEI".
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ementa">Ementa / Resumo (opcional)</Label>
            <Textarea
              id="ementa"
              placeholder="Copie a ementa do ato publicado no SEI"
              value={ementa}
              onChange={(e) => setEmenta(e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          {/* Publicação DOE */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Publicação no DOE (se já saiu)</h4>
            {podeEditarDoe ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Label htmlFor="doe-data">Data do DOE</Label>
                  <Input
                    id="doe-data"
                    type="date"
                    value={doeData}
                    onChange={(e) => setDoeData(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Para registrar assinatura e publicação, use as ações "Registrar assinatura" e
                "Registrar publicação" da portaria.
              </p>
            )}
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
          <Button onClick={handleSalvar} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Salvar Alterações' : 'Registrar Portaria'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
