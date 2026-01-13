import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, X, Building2, Users, Info, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

type ComposicaoItem = {
  id?: string;
  unidade_id: string;
  quantidade_vagas: number;
  unidade_nome?: string;
  unidade_sigla?: string;
};

type ComposicaoCargosEditorProps = {
  cargoId?: string;
  value: ComposicaoItem[];
  onChange: (items: ComposicaoItem[]) => void;
  initialValue?: ComposicaoItem[];
};

export function ComposicaoCargosEditor({ cargoId, value, onChange, initialValue = [] }: ComposicaoCargosEditorProps) {
  const [selectedUnidade, setSelectedUnidade] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);

  // Detectar mudanças comparando com valor inicial
  useEffect(() => {
    const currentStr = JSON.stringify(value.map(v => ({ u: v.unidade_id, q: v.quantidade_vagas })).sort((a, b) => a.u.localeCompare(b.u)));
    const initialStr = JSON.stringify(initialValue.map(v => ({ u: v.unidade_id, q: v.quantidade_vagas })).sort((a, b) => a.u.localeCompare(b.u)));
    setHasChanges(currentStr !== initialStr);
  }, [value, initialValue]);

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-ativas"],
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

  // Fetch lotações existentes para mostrar ocupação por unidade
  const { data: lotacoesPorUnidade = {} } = useQuery({
    queryKey: ["lotacoes-por-unidade", cargoId],
    queryFn: async () => {
      if (!cargoId) return {};
      const { data, error } = await supabase
        .from("lotacoes")
        .select("unidade_id")
        .eq("cargo_id", cargoId)
        .eq("ativo", true);
      if (error) throw error;
      
      return data.reduce((acc, lot) => {
        acc[lot.unidade_id] = (acc[lot.unidade_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
    enabled: !!cargoId,
  });

  // Unidades já selecionadas
  const unidadesSelecionadas = value.map(v => v.unidade_id);
  const unidadesDisponiveis = unidades.filter(u => !unidadesSelecionadas.includes(u.id));

  const handleAdd = () => {
    if (!selectedUnidade || quantidade < 1) return;
    
    const unidade = unidades.find(u => u.id === selectedUnidade);
    if (!unidade) return;

    console.log("[ComposicaoCargosEditor] Adicionando unidade:", unidade.nome, "Quantidade:", quantidade);

    onChange([
      ...value,
      {
        unidade_id: selectedUnidade,
        quantidade_vagas: quantidade,
        unidade_nome: unidade.nome,
        unidade_sigla: unidade.sigla || undefined,
      },
    ]);
    
    toast.info(`${unidade.nome} adicionada. Clique em "Atualizar" ou "Criar Cargo" para salvar.`, {
      duration: 4000,
    });
    
    setSelectedUnidade("");
    setQuantidade(1);
  };

  const handleRemove = (unidadeId: string) => {
    const unidade = value.find(v => v.unidade_id === unidadeId);
    console.log("[ComposicaoCargosEditor] Removendo unidade:", unidade?.unidade_nome);
    onChange(value.filter(v => v.unidade_id !== unidadeId));
  };

  const handleUpdateQuantidade = (unidadeId: string, novaQuantidade: number) => {
    console.log("[ComposicaoCargosEditor] Atualizando quantidade da unidade:", unidadeId, "para:", novaQuantidade);
    onChange(
      value.map(v =>
        v.unidade_id === unidadeId ? { ...v, quantidade_vagas: novaQuantidade } : v
      )
    );
  };

  const totalVagas = value.reduce((sum, v) => sum + v.quantidade_vagas, 0);
  const totalOcupadas = Object.values(lotacoesPorUnidade).reduce((sum: number, v: number) => sum + v, 0);

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 flex-wrap">
          <Building2 className="h-4 w-4" />
          Distribuição por Unidade
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Defina a distribuição de vagas por unidade. As alterações serão salvas ao clicar em "Criar Cargo" ou "Atualizar".
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Badge de alterações pendentes */}
          {hasChanges && (
            <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 ml-auto flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alterações pendentes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta informativo quando vazio */}
        {value.length === 0 && (
          <Alert className="bg-info/10 border-info/30">
            <Info className="h-4 w-4 text-info" />
            <AlertDescription className="text-sm">
              Nenhuma unidade vinculada ainda. Defina a distribuição de vagas por unidade conforme previsto na lei de criação do cargo.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Resumo */}
        <div className="flex gap-4 p-3 bg-muted/50 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total distribuído:</span>
            <Badge variant="outline">{totalVagas}</Badge>
          </div>
          {cargoId && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Ocupadas:</span>
              <Badge variant="outline" className="bg-info/20 text-info border-info/30">
                {totalOcupadas}
              </Badge>
            </div>
          )}
        </div>

        {/* Adicionar nova unidade */}
        <div className="flex gap-2">
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              {unidadesDisponiveis.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Todas as unidades já foram adicionadas
                </div>
              ) : (
                unidadesDisponiveis.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.nome} {unidade.sigla && `(${unidade.sigla})`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="w-24"
            placeholder="Qtd"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            onClick={handleAdd}
            disabled={!selectedUnidade || quantidade < 1}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de unidades vinculadas */}
        {value.length > 0 ? (
          <ul className="space-y-2">
            {value.map((item) => {
              const ocupadas = lotacoesPorUnidade[item.unidade_id] || 0;
              const vacancia = item.quantidade_vagas - ocupadas;
              
              return (
                <li
                  key={item.unidade_id}
                  className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {item.unidade_nome}
                      {item.unidade_sigla && (
                        <span className="text-muted-foreground ml-1">({item.unidade_sigla})</span>
                      )}
                    </p>
                    {cargoId && (
                      <div className="flex gap-3 mt-1 text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Ocupadas: {ocupadas}
                        </span>
                        <span className={vacancia < 0 ? "text-destructive" : vacancia === 0 ? "text-warning" : "text-success"}>
                          Vacância: {vacancia}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantidade_vagas}
                      onChange={(e) => handleUpdateQuantidade(item.unidade_id, Number(e.target.value))}
                      className="w-20 h-8 text-center"
                    />
                    <span className="text-xs text-muted-foreground">vagas</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemove(item.unidade_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma unidade vinculada. Adicione unidades para definir a distribuição de vagas.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
