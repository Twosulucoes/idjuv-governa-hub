import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Artigo } from '@/types/portariaUnificada';

interface EditorArtigosProps {
  artigos: Artigo[];
  onChange: (artigos: Artigo[]) => void;
}

export function EditorArtigos({ artigos, onChange }: EditorArtigosProps) {
  const handleAddArtigo = () => {
    const novoNumero = artigos.length + 1;
    const novoArtigo: Artigo = {
      id: crypto.randomUUID(),
      numero: `${novoNumero}º`,
      conteudo: '',
    };
    onChange([...artigos, novoArtigo]);
  };

  const handleRemoveArtigo = (id: string) => {
    const novosArtigos = artigos.filter((a) => a.id !== id);
    // Renumerar artigos
    const artigosRenumerados = novosArtigos.map((a, index) => ({
      ...a,
      numero: `${index + 1}º`,
    }));
    onChange(artigosRenumerados);
  };

  const handleUpdateArtigo = (id: string, field: 'numero' | 'conteudo', value: string) => {
    const novosArtigos = artigos.map((a) =>
      a.id === id ? { ...a, [field]: value } : a
    );
    onChange(novosArtigos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Artigos da Portaria</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddArtigo}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Artigo
        </Button>
      </div>

      <div className="space-y-3">
        {artigos.map((artigo, index) => (
          <Card key={artigo.id} className="relative">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 pt-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Art.</span>
                    <Input
                      value={artigo.numero}
                      onChange={(e) => handleUpdateArtigo(artigo.id, 'numero', e.target.value)}
                      className="w-14 h-8 text-center font-medium"
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <Textarea
                    value={artigo.conteudo}
                    onChange={(e) => handleUpdateArtigo(artigo.id, 'conteudo', e.target.value)}
                    placeholder={`Conteúdo do Art. ${artigo.numero}...`}
                    className="min-h-[80px] resize-y"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveArtigo(artigo.id)}
                  disabled={artigos.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {artigos.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-2">Nenhum artigo adicionado</p>
          <Button type="button" variant="outline" size="sm" onClick={handleAddArtigo}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Primeiro Artigo
          </Button>
        </div>
      )}
    </div>
  );
}
