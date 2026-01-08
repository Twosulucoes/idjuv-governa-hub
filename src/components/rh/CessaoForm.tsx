import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, ArrowLeftRight } from "lucide-react";
import { useCreateCessao } from "@/hooks/useServidorCompleto";
import { TIPOS_ATO, TIPOS_ONUS } from "@/types/servidor";

interface Props {
  servidorId: string;
  servidorNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CessaoForm({ servidorId, servidorNome, open, onOpenChange }: Props) {
  const createCessao = useCreateCessao();
  
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Entrada
  const [orgaoOrigem, setOrgaoOrigem] = useState('');
  const [cargoOrigem, setCargoOrigem] = useState('');
  const [vinculoOrigem, setVinculoOrigem] = useState('');
  const [funcaoExercidaIdjuv, setFuncaoExercidaIdjuv] = useState('');
  const [unidadeIdjuvId, setUnidadeIdjuvId] = useState('');
  
  // Saída
  const [orgaoDestino, setOrgaoDestino] = useState('');
  const [cargoDestino, setCargoDestino] = useState('');
  
  // Comum
  const [onus, setOnus] = useState('');
  const [atoTipo, setAtoTipo] = useState('');
  const [atoNumero, setAtoNumero] = useState('');
  const [atoData, setAtoData] = useState('');
  const [atoDoeNumero, setAtoDoeNumero] = useState('');
  const [atoDoeData, setAtoDoeData] = useState('');
  const [fundamentacaoLegal, setFundamentacaoLegal] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Buscar unidades do IDJuv
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-idjuv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const isEntrada = tipo === 'entrada';

  const resetForm = () => {
    setTipo('entrada');
    setDataInicio('');
    setDataFim('');
    setOrgaoOrigem('');
    setCargoOrigem('');
    setVinculoOrigem('');
    setFuncaoExercidaIdjuv('');
    setUnidadeIdjuvId('');
    setOrgaoDestino('');
    setCargoDestino('');
    setOnus('');
    setAtoTipo('');
    setAtoNumero('');
    setAtoData('');
    setAtoDoeNumero('');
    setAtoDoeData('');
    setFundamentacaoLegal('');
    setObservacoes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataInicio) return;
    if (isEntrada && !orgaoOrigem) return;
    if (!isEntrada && !orgaoDestino) return;

    await createCessao.mutateAsync({
      servidor_id: servidorId,
      tipo,
      data_inicio: dataInicio,
      data_fim: dataFim || undefined,
      ativa: true,
      
      // Entrada
      orgao_origem: isEntrada ? orgaoOrigem : undefined,
      cargo_origem: isEntrada ? cargoOrigem : undefined,
      vinculo_origem: isEntrada ? vinculoOrigem : undefined,
      funcao_exercida_idjuv: isEntrada ? funcaoExercidaIdjuv : undefined,
      unidade_idjuv_id: isEntrada ? (unidadeIdjuvId || undefined) : undefined,
      
      // Saída
      orgao_destino: !isEntrada ? orgaoDestino : undefined,
      cargo_destino: !isEntrada ? cargoDestino : undefined,
      
      // Comum
      onus: onus as 'origem' | 'destino' | 'compartilhado' | undefined,
      ato_tipo: atoTipo || undefined,
      ato_numero: atoNumero || undefined,
      ato_data: atoData || undefined,
      ato_doe_numero: atoDoeNumero || undefined,
      ato_doe_data: atoDoeData || undefined,
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
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Registrar Cessão
          </DialogTitle>
          <DialogDescription>
            Registrar cessão para {servidorNome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Cessão */}
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setTipo('entrada')}
              className={`p-4 border rounded-lg cursor-pointer transition-all text-center ${
                tipo === 'entrada' 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                  : 'hover:border-primary/50'
              }`}
            >
              <p className="font-medium">Cessão de Entrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Servidor vindo de outro órgão
              </p>
            </div>
            <div
              onClick={() => setTipo('saida')}
              className={`p-4 border rounded-lg cursor-pointer transition-all text-center ${
                tipo === 'saida' 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                  : 'hover:border-primary/50'
              }`}
            >
              <p className="font-medium">Cessão de Saída</p>
              <p className="text-sm text-muted-foreground mt-1">
                Servidor indo para outro órgão
              </p>
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Data de Término (Previsão)</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Campos de Entrada */}
          {isEntrada && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Dados do Órgão de Origem</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Órgão de Origem *</Label>
                  <Input
                    value={orgaoOrigem}
                    onChange={(e) => setOrgaoOrigem(e.target.value)}
                    placeholder="Nome do órgão cedente"
                    required
                  />
                </div>
                <div>
                  <Label>Cargo no Órgão de Origem</Label>
                  <Input
                    value={cargoOrigem}
                    onChange={(e) => setCargoOrigem(e.target.value)}
                    placeholder="Cargo ocupado no órgão cedente"
                  />
                </div>
                <div>
                  <Label>Vínculo de Origem</Label>
                  <Select value={vinculoOrigem} onValueChange={setVinculoOrigem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de vínculo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efetivo">Efetivo</SelectItem>
                      <SelectItem value="comissionado">Comissionado</SelectItem>
                      <SelectItem value="temporario">Temporário</SelectItem>
                      <SelectItem value="clt">CLT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h4 className="font-medium text-sm text-muted-foreground pt-4">Lotação no IDJuv</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Unidade de Lotação no IDJuv</Label>
                  <Select value={unidadeIdjuvId} onValueChange={setUnidadeIdjuvId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.sigla && `${u.sigla} - `}{u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Função Exercida no IDJuv</Label>
                  <Input
                    value={funcaoExercidaIdjuv}
                    onChange={(e) => setFuncaoExercidaIdjuv(e.target.value)}
                    placeholder="Função que exercerá"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos de Saída */}
          {!isEntrada && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Dados do Órgão de Destino</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Órgão de Destino *</Label>
                  <Input
                    value={orgaoDestino}
                    onChange={(e) => setOrgaoDestino(e.target.value)}
                    placeholder="Nome do órgão cessionário"
                    required
                  />
                </div>
                <div>
                  <Label>Cargo no Órgão de Destino</Label>
                  <Input
                    value={cargoDestino}
                    onChange={(e) => setCargoDestino(e.target.value)}
                    placeholder="Cargo que ocupará"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ônus */}
          <div>
            <Label>Ônus da Cessão</Label>
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

          <Separator />

          {/* Ato */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Ato de Cessão</h4>
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
                <Label>Número</Label>
                <Input
                  value={atoNumero}
                  onChange={(e) => setAtoNumero(e.target.value)}
                  placeholder="Ex: 001/2024"
                />
              </div>
              <div>
                <Label>Data</Label>
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

          {/* Fundamentação e Observações */}
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
            <Button 
              type="submit" 
              disabled={
                !dataInicio || 
                (isEntrada && !orgaoOrigem) || 
                (!isEntrada && !orgaoDestino) || 
                createCessao.isPending
              }
            >
              {createCessao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Cessão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
