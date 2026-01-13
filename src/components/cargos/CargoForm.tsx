import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ComposicaoCargosEditor } from "./ComposicaoCargosEditor";

export type ComposicaoItem = {
  id?: string;
  unidade_id: string;
  quantidade_vagas: number;
  unidade_nome?: string;
  unidade_sigla?: string;
};

const cargoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  sigla: z.string().max(20).optional().or(z.literal("")),
  categoria: z.enum(["efetivo", "comissionado", "funcao_gratificada", "temporario", "estagiario"]),
  nivel_hierarquico: z.coerce.number().min(1).max(10).default(1),
  escolaridade: z.string().optional().or(z.literal("")),
  vencimento_base: z.coerce.number().min(0).optional().or(z.literal("")),
  quantidade_vagas: z.coerce.number().min(1).default(1),
  cbo: z.string().max(10).optional().or(z.literal("")),
  atribuicoes: z.string().max(5000).optional().or(z.literal("")),
  experiencia_exigida: z.string().max(500).optional().or(z.literal("")),
  lei_criacao_numero: z.string().max(50).optional().or(z.literal("")),
  lei_criacao_data: z.string().optional().or(z.literal("")),
  lei_criacao_artigo: z.string().max(100).optional().or(z.literal("")),
  lei_documento_url: z.string().url().optional().or(z.literal("")),
  competencias: z.array(z.string()).optional(),
  responsabilidades: z.array(z.string()).optional(),
  requisitos: z.array(z.string()).optional(),
  conhecimentos_necessarios: z.array(z.string()).optional(),
});

export type CargoFormData = z.infer<typeof cargoSchema>;

type CargoFormProps = {
  cargo?: {
    id: string;
    nome: string;
    sigla: string | null;
    categoria: 'efetivo' | 'comissionado' | 'funcao_gratificada' | 'temporario' | 'estagiario';
    nivel_hierarquico: number | null;
    escolaridade: string | null;
    vencimento_base: number | null;
    quantidade_vagas: number | null;
    cbo: string | null;
    atribuicoes: string | null;
    competencias: string[] | null;
    responsabilidades: string[] | null;
    requisitos: string[] | null;
    conhecimentos_necessarios: string[] | null;
    experiencia_exigida: string | null;
    lei_criacao_numero: string | null;
    lei_criacao_data: string | null;
    lei_criacao_artigo: string | null;
    lei_documento_url: string | null;
  } | null;
  composicao?: ComposicaoItem[];
  onSubmit: (data: CargoFormData, composicao: ComposicaoItem[]) => void;
  onCancel: () => void;
  isLoading: boolean;
};

const ESCOLARIDADE_OPTIONS = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Ensino Técnico",
  "Ensino Superior",
  "Pós-Graduação",
  "Mestrado",
  "Doutorado",
];

export function CargoForm({ cargo, composicao: initialComposicao = [], onSubmit, onCancel, isLoading }: CargoFormProps) {
  const [composicao, setComposicao] = useState<ComposicaoItem[]>(initialComposicao);
  
  // Sincronizar estado quando initialComposicao mudar (novo cargo selecionado)
  useEffect(() => {
    setComposicao(initialComposicao);
  }, [JSON.stringify(initialComposicao)]);
  
  const form = useForm<CargoFormData>({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      nome: cargo?.nome || "",
      sigla: cargo?.sigla || "",
      categoria: cargo?.categoria || "efetivo",
      nivel_hierarquico: cargo?.nivel_hierarquico || 1,
      escolaridade: cargo?.escolaridade || "",
      vencimento_base: cargo?.vencimento_base || undefined,
      quantidade_vagas: cargo?.quantidade_vagas || 1,
      cbo: cargo?.cbo || "",
      atribuicoes: cargo?.atribuicoes || "",
      experiencia_exigida: cargo?.experiencia_exigida || "",
      lei_criacao_numero: cargo?.lei_criacao_numero || "",
      lei_criacao_data: cargo?.lei_criacao_data || "",
      lei_criacao_artigo: cargo?.lei_criacao_artigo || "",
      lei_documento_url: cargo?.lei_documento_url || "",
      competencias: cargo?.competencias || [],
      responsabilidades: cargo?.responsabilidades || [],
      requisitos: cargo?.requisitos || [],
      conhecimentos_necessarios: cargo?.conhecimentos_necessarios || [],
    },
  });

  const handleFormSubmit = (data: CargoFormData) => {
    // Validar soma de vagas distribuídas
    const totalDistribuido = composicao.reduce((sum, c) => sum + c.quantidade_vagas, 0);
    
    if (totalDistribuido > data.quantidade_vagas) {
      toast.error(`Total distribuído (${totalDistribuido}) excede o total de vagas do cargo (${data.quantidade_vagas}). Ajuste a distribuição ou aumente o número de vagas.`);
      return;
    }
    
    onSubmit(data, composicao);
  };

  // Calcular se há inconsistência na distribuição
  const totalDistribuido = composicao.reduce((sum, c) => sum + c.quantidade_vagas, 0);
  const vagasFormulario = form.watch("quantidade_vagas") || 0;
  const hasDistributionWarning = totalDistribuido > 0 && totalDistribuido !== vagasFormulario;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs defaultValue="identificacao" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
            <TabsTrigger value="atribuicoes">Atribuições</TabsTrigger>
            <TabsTrigger value="remuneracao">Remuneração</TabsTrigger>
            <TabsTrigger value="lotacao">Lotação</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
          </TabsList>

          {/* Identificação */}
          <TabsContent value="identificacao" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cargo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Analista Administrativo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sigla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sigla</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="efetivo">Efetivo</SelectItem>
                        <SelectItem value="comissionado">Comissionado</SelectItem>
                        <SelectItem value="funcao_gratificada">Função Gratificada</SelectItem>
                        <SelectItem value="temporario">Temporário</SelectItem>
                        <SelectItem value="estagiario">Estagiário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivel_hierarquico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível Hierárquico *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cbo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CBO (Classificação Brasileira de Ocupações)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2521-05" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidade_vagas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Vagas *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Requisitos */}
          <TabsContent value="requisitos" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="escolaridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escolaridade Mínima</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a escolaridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESCOLARIDADE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experiencia_exigida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experiência Exigida</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2 anos na área administrativa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ArrayFieldEditor
              label="Requisitos"
              value={form.watch("requisitos") || []}
              onChange={(val) => form.setValue("requisitos", val)}
              placeholder="Digite um requisito e pressione Enter"
            />

            <ArrayFieldEditor
              label="Conhecimentos Necessários"
              value={form.watch("conhecimentos_necessarios") || []}
              onChange={(val) => form.setValue("conhecimentos_necessarios", val)}
              placeholder="Digite um conhecimento e pressione Enter"
            />
          </TabsContent>

          {/* Atribuições */}
          <TabsContent value="atribuicoes" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="atribuicoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição das Atribuições</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva as atribuições do cargo..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ArrayFieldEditor
              label="Competências"
              value={form.watch("competencias") || []}
              onChange={(val) => form.setValue("competencias", val)}
              placeholder="Digite uma competência e pressione Enter"
            />

            <ArrayFieldEditor
              label="Responsabilidades"
              value={form.watch("responsabilidades") || []}
              onChange={(val) => form.setValue("responsabilidades", val)}
              placeholder="Digite uma responsabilidade e pressione Enter"
            />
          </TabsContent>

          {/* Remuneração */}
          <TabsContent value="remuneracao" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="vencimento_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vencimento Base (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Lotação / Distribuição por Unidade */}
          <TabsContent value="lotacao" className="space-y-4 pt-4">
            {hasDistributionWarning && (
              <Alert variant={totalDistribuido > vagasFormulario ? "destructive" : "default"} className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {totalDistribuido > vagasFormulario 
                    ? `Total distribuído (${totalDistribuido}) excede as vagas do cargo (${vagasFormulario}). Corrija antes de salvar.`
                    : `Total distribuído (${totalDistribuido}) é menor que as vagas do cargo (${vagasFormulario}). Restam ${vagasFormulario - totalDistribuido} vagas a distribuir.`
                  }
                </AlertDescription>
              </Alert>
            )}
            <ComposicaoCargosEditor
              cargoId={cargo?.id}
              value={composicao}
              onChange={setComposicao}
            />
          </TabsContent>

          {/* Dados Legais */}
          <TabsContent value="legal" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lei_criacao_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Lei/Decreto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lei nº 1.234/2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lei_criacao_data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Lei</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lei_criacao_artigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artigo Específico</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Art. 15, §2º" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lei_documento_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : cargo ? "Atualizar" : "Criar Cargo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Helper component for array fields
function ArrayFieldEditor({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (val: string[]) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          <Button type="button" variant="outline" size="icon" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {value.length > 0 && (
          <ul className="space-y-2">
            {value.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
              >
                <span className="text-sm">{item}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
