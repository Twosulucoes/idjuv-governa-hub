import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Network } from 'lucide-react';
import { OrganogramaConfig } from '@/lib/pdfOrganograma';

interface ExportOrganogramaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (tipo: 'grafico' | 'lista', config: OrganogramaConfig) => Promise<void>;
  isExporting: boolean;
}

export function ExportOrganogramaDialog({
  open,
  onOpenChange,
  onExport,
  isExporting
}: ExportOrganogramaDialogProps) {
  const [tipoExport, setTipoExport] = useState<'grafico' | 'lista'>('grafico');
  const [config, setConfig] = useState<OrganogramaConfig>({
    exibirNomesServidores: true,
    exibirQuantidadeServidores: true,
    exibirLegenda: true,
  });

  const handleExport = async () => {
    await onExport(tipoExport, config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Organograma</DialogTitle>
          <DialogDescription>
            Configure as opções de exportação do relatório
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de Exportação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato do Relatório</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={tipoExport === 'grafico' ? 'default' : 'outline'}
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => setTipoExport('grafico')}
              >
                <Network className="h-6 w-6" />
                <span className="text-xs">Organograma Visual</span>
                <span className="text-[10px] text-muted-foreground">(A3 Paisagem)</span>
              </Button>
              <Button
                variant={tipoExport === 'lista' ? 'default' : 'outline'}
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => setTipoExport('lista')}
              >
                <FileText className="h-6 w-6" />
                <span className="text-xs">Lista Hierárquica</span>
                <span className="text-[10px] text-muted-foreground">(A4 Retrato)</span>
              </Button>
            </div>
          </div>

          {/* Opções de Conteúdo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Opções de Conteúdo</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exibirNomesServidores"
                  checked={config.exibirNomesServidores}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, exibirNomesServidores: !!checked }))
                  }
                />
                <Label
                  htmlFor="exibirNomesServidores"
                  className="text-sm font-normal cursor-pointer"
                >
                  Exibir nomes dos servidores responsáveis
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exibirQuantidadeServidores"
                  checked={config.exibirQuantidadeServidores}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, exibirQuantidadeServidores: !!checked }))
                  }
                />
                <Label
                  htmlFor="exibirQuantidadeServidores"
                  className="text-sm font-normal cursor-pointer"
                >
                  Exibir quantidade de servidores por unidade
                </Label>
              </div>

              {tipoExport === 'grafico' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exibirLegenda"
                    checked={config.exibirLegenda}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, exibirLegenda: !!checked }))
                    }
                  />
                  <Label
                    htmlFor="exibirLegenda"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Exibir legenda de tipos de unidade
                  </Label>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                Exportar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
