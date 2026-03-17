/**
 * Step de Modalidades - permite adicionar múltiplas modalidades
 * Cada modalidade tem sua categoria e documentos específicos
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Trophy, Upload, X, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MODALIDADES_ESPORTIVAS } from '../modalidadesEsportivas';
import type { ArbitroFormData, ModalidadeEntry } from '../CadastroArbitroPage';

interface Props {
  data: ArbitroFormData;
  update: (field: keyof ArbitroFormData, value: any) => void;
}

export function StepModalidades({ data, update }: Props) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const modalidades = data.modalidades;
  const usedModalidades = modalidades.map(m => m.modalidade);

  function addModalidade() {
    update('modalidades', [...modalidades, { modalidade: '', categoria: '', documentos_urls: [] }]);
  }

  function removeModalidade(index: number) {
    update('modalidades', modalidades.filter((_, i) => i !== index));
  }

  function updateModalidade(index: number, field: keyof ModalidadeEntry, value: any) {
    const updated = [...modalidades];
    updated[index] = { ...updated[index], [field]: value };
    update('modalidades', updated);
  }

  async function handleDocUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploadingIndex(index);
    
    const newUrls = [...modalidades[index].documentos_urls];
    for (const file of Array.from(files)) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 2MB.');
        continue;
      }
      const ext = file.name.split('.').pop();
      const path = `modalidades/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('arbitros-docs').upload(path, file);
      if (error) {
        toast.error('Erro no upload: ' + error.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from('arbitros-docs').getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }
    
    updateModalidade(index, 'documentos_urls', newUrls);
    setUploadingIndex(null);
  }

  function removeDoc(modIndex: number, docIndex: number) {
    const updated = [...modalidades[modIndex].documentos_urls];
    updated.splice(docIndex, 1);
    updateModalidade(modIndex, 'documentos_urls', updated);
  }

  const availableModalidades = MODALIDADES_ESPORTIVAS.filter(
    m => !usedModalidades.includes(m)
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Modalidades Esportivas
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione uma ou mais modalidades. Cada modalidade terá sua categoria e aprovação independente.
        </p>
      </div>

      {modalidades.length === 0 && (
        <div className="border-2 border-dashed rounded-xl p-8 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-3">Nenhuma modalidade adicionada</p>
          <Button onClick={addModalidade} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Modalidade
          </Button>
        </div>
      )}

      {modalidades.map((mod, index) => (
        <Card key={index} className="border-2 border-primary/20">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                Modalidade {index + 1}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-destructive hover:text-destructive gap-1"
                onClick={() => removeModalidade(index)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Modalidade */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Modalidade *</Label>
                <Select
                  value={mod.modalidade}
                  onValueChange={v => updateModalidade(index, 'modalidade', v)}
                >
                  <SelectTrigger className="border-primary/30">
                    <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {/* Show current value even if used */}
                    {mod.modalidade && (
                      <SelectItem value={mod.modalidade}>{mod.modalidade}</SelectItem>
                    )}
                    {availableModalidades
                      .filter(m => m !== mod.modalidade)
                      .map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Categoria *</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'estadual', label: '🏅 Estadual' },
                    { value: 'nacional', label: '🏆 Nacional' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateModalidade(index, 'categoria', opt.value)}
                      className={`flex-1 py-2.5 px-3 rounded-lg border-2 text-sm font-semibold transition-all
                        ${mod.categoria === opt.value
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Documentos específicos da modalidade */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Documentos da modalidade (certificações, comprovantes — até 2MB cada)
              </Label>
              <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm">
                {uploadingIndex === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">Enviar documentos desta modalidade</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleDocUpload(index, e)}
                  disabled={uploadingIndex === index}
                />
              </label>

              {mod.documentos_urls.length > 0 && (
                <div className="space-y-1">
                  {mod.documentos_urls.map((url, di) => (
                    <div key={di} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">Documento {di + 1}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeDoc(index, di)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {modalidades.length > 0 && availableModalidades.length > 0 && (
        <Button onClick={addModalidade} variant="outline" className="w-full gap-2 border-dashed">
          <Plus className="h-4 w-4" /> Adicionar Outra Modalidade
        </Button>
      )}

      {modalidades.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {modalidades.length} modalidade(s) selecionada(s) • Cada modalidade será avaliada individualmente
        </p>
      )}
    </div>
  );
}