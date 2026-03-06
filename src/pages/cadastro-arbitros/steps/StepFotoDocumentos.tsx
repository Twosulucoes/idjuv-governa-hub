import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ArbitroFormData } from '../CadastroArbitroPage';

interface Props {
  data: ArbitroFormData;
  update: (field: keyof ArbitroFormData, value: any) => void;
}

export function StepFotoDocumentos({ data, update }: Props) {
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  async function uploadFile(file: File, pasta: string): Promise<string | null> {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2MB.');
      return null;
    }
    const ext = file.name.split('.').pop();
    const path = `${pasta}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('arbitros-docs').upload(path, file);
    if (error) {
      toast.error('Erro no upload: ' + error.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from('arbitros-docs').getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    const url = await uploadFile(file, 'fotos');
    if (url) update('foto_url', url);
    setUploadingFoto(false);
  }

  async function handleDocumento(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploadingDoc(true);
    const newUrls = [...data.documentos_urls];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'documentos');
      if (url) newUrls.push(url);
    }
    update('documentos_urls', newUrls);
    setUploadingDoc(false);
  }

  function removeDoc(index: number) {
    update('documentos_urls', data.documentos_urls.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Foto e Documentos</h3>

      {/* Foto */}
      <div className="space-y-2">
        <Label>Foto do Árbitro (até 2MB)</Label>
        {data.foto_url ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
            <img src={data.foto_url} alt="Foto" className="w-full h-full object-cover" />
            <button onClick={() => update('foto_url', '')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            {uploadingFoto ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (
              <>
                <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Enviar foto</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFoto} disabled={uploadingFoto} />
          </label>
        )}
      </div>

      {/* Documentos */}
      <div className="space-y-2">
        <Label>Documentos Anexos (cópias RG, CPF, etc.)</Label>
        <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm text-muted-foreground">Clique para enviar documentos (até 2MB cada)</span>
          <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleDocumento} disabled={uploadingDoc} />
        </label>

        {data.documentos_urls.length > 0 && (
          <div className="space-y-2 mt-2">
            {data.documentos_urls.map((url, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/50 rounded px-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">Documento {i + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDoc(i)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
