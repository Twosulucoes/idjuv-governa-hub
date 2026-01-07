import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  UnidadeLocal,
  TipoUnidadeLocal,
  StatusUnidadeLocal,
  NaturezaUso,
  TIPO_UNIDADE_LABELS,
  STATUS_UNIDADE_LABELS,
  NATUREZA_USO_LABELS,
  AREAS_DISPONIVEIS_OPTIONS,
  MUNICIPIOS_RORAIMA,
  DIRETORIAS_IDJUV,
} from "@/types/unidadesLocais";

interface UnidadeLocalFormProps {
  unidade?: UnidadeLocal | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  codigo_unidade: string;
  municipio: string;
  tipo_unidade: TipoUnidadeLocal;
  natureza_uso: string;
  nome_unidade: string;
  endereco_completo: string;
  status: StatusUnidadeLocal;
  capacidade: string;
  horario_funcionamento: string;
  regras_de_uso: string;
  observacoes: string;
  diretoria_vinculada: string;
  unidade_administrativa: string;
  autoridade_autorizadora: string;
  estrutura_disponivel: string;
}

export function UnidadeLocalForm({ unidade, onSuccess, onCancel }: UnidadeLocalFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(unidade?.areas_disponiveis || []);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      codigo_unidade: unidade?.codigo_unidade || "",
      municipio: unidade?.municipio || "",
      tipo_unidade: unidade?.tipo_unidade || "ginasio",
      natureza_uso: unidade?.natureza_uso || "esportivo",
      nome_unidade: unidade?.nome_unidade || "",
      endereco_completo: unidade?.endereco_completo || "",
      status: unidade?.status || "ativa",
      capacidade: unidade?.capacidade?.toString() || "",
      horario_funcionamento: unidade?.horario_funcionamento || "",
      regras_de_uso: unidade?.regras_de_uso || "",
      observacoes: unidade?.observacoes || "",
      diretoria_vinculada: unidade?.diretoria_vinculada || "",
      unidade_administrativa: unidade?.unidade_administrativa || "",
      autoridade_autorizadora: unidade?.autoridade_autorizadora || "",
      estrutura_disponivel: unidade?.estrutura_disponivel || "",
    },
  });

  const watchTipo = watch("tipo_unidade");
  const watchStatus = watch("status");
  const watchMunicipio = watch("municipio");
  const watchNatureza = watch("natureza_uso");
  const watchDiretoria = watch("diretoria_vinculada");

  function toggleArea(area: string) {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        codigo_unidade: data.codigo_unidade || null,
        municipio: data.municipio,
        tipo_unidade: data.tipo_unidade,
        natureza_uso: data.natureza_uso || null,
        nome_unidade: data.nome_unidade,
        endereco_completo: data.endereco_completo || null,
        status: data.status,
        capacidade: data.capacidade ? parseInt(data.capacidade) : null,
        horario_funcionamento: data.horario_funcionamento || null,
        regras_de_uso: data.regras_de_uso || null,
        observacoes: data.observacoes || null,
        areas_disponiveis: selectedAreas,
        diretoria_vinculada: data.diretoria_vinculada || null,
        unidade_administrativa: data.unidade_administrativa || null,
        autoridade_autorizadora: data.autoridade_autorizadora || null,
        estrutura_disponivel: data.estrutura_disponivel || null,
        updated_by: userData.user?.id,
      };

      if (unidade?.id) {
        const { error } = await supabase
          .from("unidades_locais")
          .update(payload as any)
          .eq("id", unidade.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("unidades_locais")
          .insert({ ...payload, created_by: userData.user?.id } as any);
        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar unidade:", error);
      toast.error(error.message || "Erro ao salvar unidade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identificação */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Identificação
        </h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="codigo_unidade">Código da Unidade</Label>
            <Input
              id="codigo_unidade"
              {...register("codigo_unidade")}
              placeholder="Ex: UL-001"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="municipio">Município *</Label>
            <Select value={watchMunicipio} onValueChange={(v) => setValue("municipio", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {MUNICIPIOS_RORAIMA.map((mun) => (
                  <SelectItem key={mun} value={mun}>
                    {mun}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_unidade">Tipo de Espaço *</Label>
            <Select value={watchTipo} onValueChange={(v) => setValue("tipo_unidade", v as TipoUnidadeLocal)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_UNIDADE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome_unidade">Nome Oficial da Unidade *</Label>
            <Input
              id="nome_unidade"
              {...register("nome_unidade", { required: "Nome é obrigatório" })}
              placeholder="Ex: Ginásio Poliesportivo Municipal"
            />
            {errors.nome_unidade && (
              <p className="text-sm text-destructive">{errors.nome_unidade.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="natureza_uso">Natureza do Uso</Label>
            <Select value={watchNatureza} onValueChange={(v) => setValue("natureza_uso", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NATUREZA_USO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Vinculação Administrativa */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Vinculação Administrativa
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="diretoria_vinculada">Diretoria Vinculada</Label>
            <Select value={watchDiretoria} onValueChange={(v) => setValue("diretoria_vinculada", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {DIRETORIAS_IDJUV.map((dir) => (
                  <SelectItem key={dir} value={dir}>
                    {dir}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidade_administrativa">Unidade Administrativa Responsável</Label>
            <Input
              id="unidade_administrativa"
              {...register("unidade_administrativa")}
              placeholder="Ex: Coordenação de Esporte"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="autoridade_autorizadora">Autoridade Competente para Autorização</Label>
          <Input
            id="autoridade_autorizadora"
            {...register("autoridade_autorizadora")}
            placeholder="Ex: Presidente do IDJuv / Diretor de Esporte"
          />
        </div>
      </div>

      {/* Localização e Capacidade */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Localização e Capacidade
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="endereco_completo">Endereço Completo</Label>
          <Input
            id="endereco_completo"
            {...register("endereco_completo")}
            placeholder="Rua, número, bairro, CEP"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="status">Situação da Unidade *</Label>
            <Select value={watchStatus} onValueChange={(v) => setValue("status", v as StatusUnidadeLocal)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_UNIDADE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacidade">Capacidade Máxima (pessoas)</Label>
            <Input
              id="capacidade"
              type="number"
              {...register("capacidade")}
              placeholder="Ex: 500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="horario_funcionamento">Horário de Funcionamento</Label>
            <Input
              id="horario_funcionamento"
              {...register("horario_funcionamento")}
              placeholder="Ex: 06h às 22h"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estrutura_disponivel">Estrutura Disponível</Label>
          <Textarea
            id="estrutura_disponivel"
            {...register("estrutura_disponivel")}
            placeholder="Iluminação, arquibancada, banheiros, vestiários, etc."
            rows={2}
          />
        </div>
      </div>

      {/* Áreas Disponíveis */}
      <div className="space-y-2">
        <Label>Áreas Disponíveis</Label>
        <div className="grid gap-2 md:grid-cols-3 max-h-48 overflow-y-auto border rounded-md p-3">
          {AREAS_DISPONIVEIS_OPTIONS.map((area) => (
            <div key={area} className="flex items-center space-x-2">
              <Checkbox
                id={area}
                checked={selectedAreas.includes(area)}
                onCheckedChange={() => toggleArea(area)}
              />
              <Label htmlFor={area} className="text-sm font-normal cursor-pointer">
                {area}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Controle */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Controle
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="regras_de_uso">Regras de Uso</Label>
          <Textarea
            id="regras_de_uso"
            {...register("regras_de_uso")}
            placeholder="Descreva as regras de uso da unidade..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações Administrativas</Label>
          <Textarea
            id="observacoes"
            {...register("observacoes")}
            placeholder="Observações adicionais..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {unidade ? "Salvar Alterações" : "Criar Unidade"}
        </Button>
      </div>
    </form>
  );
}
