import { useState, useEffect } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, Building2, Info } from "lucide-react";
import { useCreateDesignacao } from "@/hooks/useDesignacoes";
import { buscarLotacaoAtiva } from "@/lib/matriculaUtils";

interface Props {
  servidorId?: string;
  servidorNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignacaoForm({ servidorId, servidorNome, open, onOpenChange }: Props) {
  const createDesignacao = useCreateDesignacao();
  
  const [selectedServidorId, setSelectedServidorId] = useState(servidorId || "");
  const [unidadeDestinoId, setUnidadeDestinoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [atoTipo, setAtoTipo] = useState("");
  const [atoNumero, setAtoNumero] = useState("");
  const [atoData, setAtoData] = useState("");
  const [atoDoeNumero, setAtoDoeNumero] = useState("");
  const [atoDoeData, setAtoDoeData] = useState("");
  const [observacao, setObservacao] = useState("");
  
  const [lotacaoAtiva, setLotacaoAtiva] = useState<any>(null);
  const [isLoadingLotacao, setIsLoadingLotacao] = useState(false);

  // Buscar servidores ativos
  const { data: servidores = [] } = useQuery({
    queryKey: ["servidores-designacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo, matricula")
        .eq("ativo", true)
        .eq("situacao", "ativo")
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
    enabled: open && !servidorId,
  });

  // Buscar unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-designacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Buscar lotação ativa do servidor selecionado
  useEffect(() => {
    const fetchLotacao = async () => {
      if (!selectedServidorId) {
        setLotacaoAtiva(null);
        return;
      }
      
      setIsLoadingLotacao(true);
      try {
        const lotacao = await buscarLotacaoAtiva(selectedServidorId);
        setLotacaoAtiva(lotacao);
      } catch (error) {
        console.error("Erro ao buscar lotação:", error);
        setLotacaoAtiva(null);
      } finally {
        setIsLoadingLotacao(false);
      }
    };
    
    fetchLotacao();
  }, [selectedServidorId]);

  // Reset form quando abre
  useEffect(() => {
    if (open) {
      setSelectedServidorId(servidorId || "");
      setUnidadeDestinoId("");
      setDataInicio("");
      setDataFim("");
      setJustificativa("");
      setAtoTipo("");
      setAtoNumero("");
      setAtoData("");
      setAtoDoeNumero("");
      setAtoDoeData("");
      setObservacao("");
    }
  }, [open, servidorId]);

  // Filtrar unidades (excluir a unidade de origem)
  const unidadesDisponiveis = unidades.filter(u => u.id !== lotacaoAtiva?.unidade_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedServidorId || !unidadeDestinoId || !dataInicio) {
      return;
    }

    if (!lotacaoAtiva) {
      return;
    }

    if (dataFim && dataFim < dataInicio) return;

    await createDesignacao.mutateAsync({
      servidor_id: selectedServidorId,
      lotacao_id: lotacaoAtiva.id,
      unidade_origem_id: lotacaoAtiva.unidade_id,
      unidade_destino_id: unidadeDestinoId,
      data_inicio: dataInicio,
      data_fim: dataFim || undefined,
      justificativa: justificativa.trim() || undefined,
      ato_tipo: atoTipo || undefined,
      ato_numero: atoNumero.trim() || undefined,
      ato_data: atoData || undefined,
      ato_doe_numero: atoDoeNumero.trim() || undefined,
      ato_doe_data: atoDoeData || undefined,
      observacao: observacao.trim() || undefined,
    });

    onOpenChange(false);
  };

  const servidorSelecionado = servidorNome || servidores.find(s => s.id === selectedServidorId)?.nome_completo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Nova Designação
          </DialogTitle>
          <DialogDescription>
            Designar servidor para trabalhar temporariamente em outra unidade
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              A designação permite que o servidor trabalhe temporariamente em outra unidade 
              <strong> sem alterar sua lotação oficial</strong>. A lotação permanece vinculada 
              ao cargo e unidade de origem.
            </AlertDescription>
          </Alert>

          {/* Servidor */}
          {servidorId ? (
            <div className="p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm text-muted-foreground">Servidor</Label>
              <p className="font-medium text-lg">{servidorNome}</p>
            </div>
          ) : (
            <div>
              <Label>Servidor *</Label>
              <Select value={selectedServidorId} onValueChange={setSelectedServidorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o servidor" />
                </SelectTrigger>
                <SelectContent>
                  {servidores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome_completo} {s.matricula && `(${s.matricula})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lotação de Origem */}
          {selectedServidorId && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <Label className="text-sm text-muted-foreground">Lotação de Origem</Label>
              {isLoadingLotacao ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : lotacaoAtiva ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {lotacaoAtiva.unidade?.sigla || lotacaoAtiva.unidade?.nome}
                  </span>
                  {lotacaoAtiva.cargo && (
                    <span className="text-muted-foreground">
                      - {lotacaoAtiva.cargo?.sigla || lotacaoAtiva.cargo?.nome}
                    </span>
                  )}
                </div>
              ) : (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>
                    Este servidor não possui lotação ativa. É necessário ter uma lotação para criar uma designação.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Unidade de Destino e Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Unidade de Destino *</Label>
              <Select 
                value={unidadeDestinoId} 
                onValueChange={setUnidadeDestinoId}
                disabled={!lotacaoAtiva}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidadesDisponiveis.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.sigla && `${u.sigla} - `}{u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                  disabled={!lotacaoAtiva}
                />
              </div>
              <div>
                <Label>Data Fim (prevista)</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  disabled={!lotacaoAtiva}
                />
              </div>
            </div>
          </div>

          {/* Justificativa */}
          <div>
            <Label>Justificativa</Label>
            <Textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Motivo da designação temporária..."
              rows={3}
              disabled={!lotacaoAtiva}
              maxLength={1000}
            />
          </div>

          <Separator />

          {/* Ato Administrativo */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Ato Administrativo (Opcional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tipo do Ato</Label>
                <Select value={atoTipo} onValueChange={setAtoTipo} disabled={!lotacaoAtiva}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portaria">Portaria</SelectItem>
                    <SelectItem value="memorando">Memorando</SelectItem>
                    <SelectItem value="oficio">Ofício</SelectItem>
                    <SelectItem value="ordem_servico">Ordem de Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nº do Ato</Label>
                <Input
                  value={atoNumero}
                  onChange={(e) => setAtoNumero(e.target.value)}
                  placeholder="Ex: 001/2025"
                  disabled={!lotacaoAtiva}
                  maxLength={30}
                />
              </div>
              <div>
                <Label>Data do Ato</Label>
                <Input
                  type="date"
                  value={atoData}
                  onChange={(e) => setAtoData(e.target.value)}
                  disabled={!lotacaoAtiva}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nº DOE</Label>
                <Input
                  value={atoDoeNumero}
                  onChange={(e) => setAtoDoeNumero(e.target.value)}
                  placeholder="Ex: 4567"
                  disabled={!lotacaoAtiva}
                  maxLength={20}
                />
              </div>
              <div>
                <Label>Data Publicação DOE</Label>
                <Input
                  type="date"
                  value={atoDoeData}
                  onChange={(e) => setAtoDoeData(e.target.value)}
                  disabled={!lotacaoAtiva}
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
              rows={2}
              disabled={!lotacaoAtiva}
              maxLength={1000}
            />
          </div>

          {/* Ações */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedServidorId || !unidadeDestinoId || !dataInicio || !lotacaoAtiva || createDesignacao.isPending}
            >
              {createDesignacao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Solicitar Designação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
