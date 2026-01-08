import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Link2 } from "lucide-react";
import { useCreateVinculo } from "@/hooks/useServidorCompleto";
import {
  type TipoVinculoFuncional,
  TIPO_VINCULO_LABELS,
  TIPOS_ATO,
  TIPOS_ONUS,
} from "@/types/servidor";

interface Props {
  servidorId: string;
  servidorNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VinculoFuncionalForm({ servidorId, servidorNome, open, onOpenChange }: Props) {
  const createVinculo = useCreateVinculo();
  
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculoFuncional | ''>('');
  const [dataInicio, setDataInicio] = useState('');
  const [atoTipo, setAtoTipo] = useState('');
  const [atoNumero, setAtoNumero] = useState('');
  const [atoData, setAtoData] = useState('');
  const [atoDoeNumero, setAtoDoeNumero] = useState('');
  const [atoDoeData, setAtoDoeData] = useState('');
  const [orgaoOrigem, setOrgaoOrigem] = useState('');
  const [orgaoDestino, setOrgaoDestino] = useState('');
  const [onus, setOnus] = useState('');
  const [fundamentacaoLegal, setFundamentacaoLegal] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const isCedidoEntrada = tipoVinculo === 'cedido_entrada';
  const isCedidoSaida = tipoVinculo === 'cedido_saida';

  const resetForm = () => {
    setTipoVinculo('');
    setDataInicio('');
    setAtoTipo('');
    setAtoNumero('');
    setAtoData('');
    setAtoDoeNumero('');
    setAtoDoeData('');
    setOrgaoOrigem('');
    setOrgaoDestino('');
    setOnus('');
    setFundamentacaoLegal('');
    setObservacoes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tipoVinculo || !dataInicio) return;

    await createVinculo.mutateAsync({
      servidor_id: servidorId,
      tipo_vinculo: tipoVinculo,
      data_inicio: dataInicio,
      ativo: true,
      ato_tipo: atoTipo || undefined,
      ato_numero: atoNumero || undefined,
      ato_data: atoData || undefined,
      ato_doe_numero: atoDoeNumero || undefined,
      ato_doe_data: atoDoeData || undefined,
      orgao_origem: isCedidoEntrada ? orgaoOrigem : undefined,
      orgao_destino: isCedidoSaida ? orgaoDestino : undefined,
      onus_origem: isCedidoEntrada && onus === 'origem',
      fundamentacao_legal: fundamentacaoLegal || undefined,
      observacoes: observacoes || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Novo Vínculo Funcional
          </DialogTitle>
          <DialogDescription>
            Registrar vínculo para {servidorNome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Vínculo */}
          <div className="space-y-4">
            <div>
              <Label>Tipo de Vínculo *</Label>
              <Select value={tipoVinculo} onValueChange={(v) => setTipoVinculo(v as TipoVinculoFuncional)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de vínculo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_VINCULO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Campos para Cedido de Entrada */}
          {isCedidoEntrada && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Dados da Cessão (Entrada)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Órgão de Origem *</Label>
                    <Input
                      value={orgaoOrigem}
                      onChange={(e) => setOrgaoOrigem(e.target.value)}
                      placeholder="Nome do órgão cedente"
                      required={isCedidoEntrada}
                    />
                  </div>
                  <div>
                    <Label>Ônus</Label>
                    <Select value={onus} onValueChange={setOnus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_ONUS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Campos para Cedido de Saída */}
          {isCedidoSaida && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Dados da Cessão (Saída)</h4>
                <div>
                  <Label>Órgão de Destino *</Label>
                  <Input
                    value={orgaoDestino}
                    onChange={(e) => setOrgaoDestino(e.target.value)}
                    placeholder="Nome do órgão cessionário"
                    required={isCedidoSaida}
                  />
                </div>
              </div>
            </>
          )}

          {/* Ato */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Ato Administrativo</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tipo do Ato</Label>
                <Select value={atoTipo} onValueChange={setAtoTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ATO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número do Ato</Label>
                <Input
                  value={atoNumero}
                  onChange={(e) => setAtoNumero(e.target.value)}
                  placeholder="Ex: 001/2024"
                />
              </div>
              <div>
                <Label>Data do Ato</Label>
                <Input
                  type="date"
                  value={atoData}
                  onChange={(e) => setAtoData(e.target.value)}
                />
              </div>
              <div>
                <Label>Nº DOE</Label>
                <Input
                  value={atoDoeNumero}
                  onChange={(e) => setAtoDoeNumero(e.target.value)}
                  placeholder="Número do Diário Oficial"
                />
              </div>
              <div>
                <Label>Data DOE</Label>
                <Input
                  type="date"
                  value={atoDoeData}
                  onChange={(e) => setAtoDoeData(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <div>
              <Label>Fundamentação Legal</Label>
              <Input
                value={fundamentacaoLegal}
                onChange={(e) => setFundamentacaoLegal(e.target.value)}
                placeholder="Ex: Lei nº 1234/2020, Art. 5º"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!tipoVinculo || !dataInicio || createVinculo.isPending}>
              {createVinculo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Vínculo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
