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
import { Loader2, Building2 } from "lucide-react";
import { useCreateLotacao } from "@/hooks/useServidorCompleto";
import {
  type TipoLotacao,
  type TipoServidor,
  TIPO_LOTACAO_LABELS,
  REGRAS_TIPO_SERVIDOR,
} from "@/types/servidor";

interface Props {
  servidorId: string;
  servidorNome: string;
  tipoServidor?: TipoServidor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LotacaoForm({ servidorId, servidorNome, tipoServidor, open, onOpenChange }: Props) {
  const createLotacao = useCreateLotacao();
  
  const [unidadeId, setUnidadeId] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [tipoLotacao, setTipoLotacao] = useState<TipoLotacao>('lotacao_interna');
  const [dataInicio, setDataInicio] = useState('');
  const [funcaoExercida, setFuncaoExercida] = useState('');
  const [orgaoExterno, setOrgaoExterno] = useState('');
  const [atoNumero, setAtoNumero] = useState('');
  const [atoData, setAtoData] = useState('');
  const [tipoMovimentacao, setTipoMovimentacao] = useState('');
  const [observacao, setObservacao] = useState('');

  // Regras baseadas no tipo de servidor
  const regras = tipoServidor ? REGRAS_TIPO_SERVIDOR[tipoServidor] : null;

  // Filtrar tipos de lotação permitidos
  const tiposLotacaoPermitidos = Object.entries(TIPO_LOTACAO_LABELS).filter(([key]) => {
    if (!regras) return true;
    if (key === 'lotacao_externa' && !regras.permiteLotacaoExterna) return false;
    if (key !== 'lotacao_externa' && !regras.permiteLotacaoInterna) return false;
    return true;
  });

  // Buscar unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-lotacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Buscar cargos (opcional, para informar o cargo da lotação)
  const { data: cargos = [] } = useQuery({
    queryKey: ["cargos-lotacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const isLotacaoExterna = tipoLotacao === 'lotacao_externa';

  const resetForm = () => {
    setUnidadeId('');
    setCargoId('');
    setTipoLotacao('lotacao_interna');
    setDataInicio('');
    setFuncaoExercida('');
    setOrgaoExterno('');
    setAtoNumero('');
    setAtoData('');
    setTipoMovimentacao('');
    setObservacao('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unidadeId || !dataInicio) return;

    await createLotacao.mutateAsync({
      servidor_id: servidorId,
      unidade_id: unidadeId,
      cargo_id: cargoId || undefined,
      tipo_lotacao: tipoLotacao,
      data_inicio: dataInicio,
      funcao_exercida: funcaoExercida || undefined,
      orgao_externo: isLotacaoExterna ? orgaoExterno : undefined,
      ato_numero: atoNumero || undefined,
      ato_data: atoData || undefined,
      tipo_movimentacao: tipoMovimentacao || undefined,
      observacao: observacao || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Nova Lotação
          </DialogTitle>
          <DialogDescription>
            Registrar lotação para {servidorNome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Lotação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Lotação *</Label>
              <Select value={tipoLotacao} onValueChange={(v) => setTipoLotacao(v as TipoLotacao)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposLotacaoPermitidos.map(([key, label]) => (
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

          {/* Unidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Unidade de Lotação *</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId}>
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
              <Label>Cargo (Opcional)</Label>
              <Select value={cargoId} onValueChange={setCargoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.sigla && `${c.sigla} - `}{c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lotação Externa */}
          {isLotacaoExterna && (
            <div>
              <Label>Órgão Externo (Cessão de Saída)</Label>
              <Input
                value={orgaoExterno}
                onChange={(e) => setOrgaoExterno(e.target.value)}
                placeholder="Nome do órgão de destino"
              />
            </div>
          )}

          {/* Função */}
          <div>
            <Label>Função Exercida</Label>
            <Input
              value={funcaoExercida}
              onChange={(e) => setFuncaoExercida(e.target.value)}
              placeholder="Descrição da função exercida"
            />
          </div>

          <Separator />

          {/* Ato */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Ato Administrativo</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tipo de Movimentação</Label>
                <Select value={tipoMovimentacao} onValueChange={setTipoMovimentacao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lotacao_inicial">Lotação Inicial</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="remocao">Remoção</SelectItem>
                    <SelectItem value="designacao">Designação</SelectItem>
                    <SelectItem value="redistribuicao">Redistribuição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nº do Ato</Label>
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
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!unidadeId || !dataInicio || createLotacao.isPending}>
              {createLotacao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Lotação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
