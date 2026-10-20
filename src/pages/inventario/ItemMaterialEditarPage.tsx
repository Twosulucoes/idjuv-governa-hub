/**
 * EDIÇÃO DE ITEM DE MATERIAL (ALMOXARIFADO)
 * Altera os dados cadastrais, os parâmetros de estoque (mínimo, máximo, ponto de reposição)
 * e o valor unitário médio de um item. O saldo em estoque e o último valor de compra não são
 * editados aqui: virão das entradas e saídas numa próxima etapa.
 */

import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Boxes, Layers, Loader2, Package, Save, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/design-system";
import { DetalheCarregando, DetalheNaoEncontrado } from "@/components/inventario/DetalheRegistro";
import { UNIDADES_MEDIDA } from "@/components/inventario/unidadesMedida";
import { useCategoriasMaterial, useItemMaterial, useUpdateItemMaterial } from "@/hooks/useAlmoxarifado";
import type { Database } from "@/integrations/supabase/types";

type ItemUpdate = Database["public"]["Tables"]["itens_material"]["Update"];
type ItemBase = NonNullable<ReturnType<typeof useItemMaterial>["data"]>;
type ItemMaterial = Omit<ItemBase, "categoria"> & {
  categoria: { id: string; nome: string } | null;
};

/** Valor do Select para "sem categoria" (o Radix não aceita item com valor vazio). */
const NENHUM = "__nenhum__";

/** Número opcional (aceita vírgula), maior ou igual a zero. */
const numeroOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || (Number.isFinite(Number(v.replace(",", "."))) && Number(v.replace(",", ".")) >= 0), {
    message: "Informe um número maior ou igual a zero",
  });

function paraNumero(valor: string): number | null {
  const limpo = valor.trim();
  return limpo === "" ? null : Number(limpo.replace(",", "."));
}

const editarItemSchema = z
  .object({
    codigo: z.string().trim().min(1, "Informe o código").max(50, "Máximo 50 caracteres"),
    codigo_sku: z.string().trim().max(50, "Máximo 50 caracteres"),
    descricao: z.string().trim().min(3, "Descrição deve ter no mínimo 3 caracteres").max(200),
    especificacao: z.string(),
    unidade_medida: z.string().min(1, "Informe a unidade de medida"),
    categoria_id: z.string(),
    estoque_minimo: numeroOpcional,
    estoque_maximo: numeroOpcional,
    ponto_reposicao: numeroOpcional,
    valor_unitario_medio: numeroOpcional,
    lote: z.string().trim().max(50, "Máximo 50 caracteres"),
    validade: z.string(),
    ativo: z.boolean(),
  })
  .superRefine((dados, ctx) => {
    const minimo = paraNumero(dados.estoque_minimo);
    const maximo = paraNumero(dados.estoque_maximo);
    if (minimo !== null && maximo !== null && Number.isFinite(minimo) && Number.isFinite(maximo) && maximo < minimo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["estoque_maximo"],
        message: "O estoque máximo não pode ser menor que o mínimo",
      });
    }
  });

type FormData = z.infer<typeof editarItemSchema>;
type CampoTextoForm = Exclude<keyof FormData, "ativo">;

/** Campos editáveis. Ficam de fora id, created_at, updated_at e ultimo_valor_compra. */
const CAMPOS_EDITAVEIS = [
  "codigo", "codigo_sku", "descricao", "especificacao", "unidade_medida", "categoria_id",
  "estoque_minimo", "estoque_maximo", "ponto_reposicao", "valor_unitario_medio", "lote", "validade", "ativo",
] as const satisfies readonly (keyof FormData)[];

const CAMPOS_NUMERICOS: readonly string[] = ["estoque_minimo", "estoque_maximo", "ponto_reposicao", "valor_unitario_medio"];

function texto(valor: string | number | null | undefined): string {
  return valor === null || valor === undefined ? "" : String(valor);
}

function valoresIniciais(item: ItemMaterial): FormData {
  return {
    codigo: texto(item.codigo),
    codigo_sku: texto(item.codigo_sku),
    descricao: texto(item.descricao),
    especificacao: texto(item.especificacao),
    unidade_medida: texto(item.unidade_medida),
    categoria_id: item.categoria_id || NENHUM,
    estoque_minimo: texto(item.estoque_minimo),
    estoque_maximo: texto(item.estoque_maximo),
    ponto_reposicao: texto(item.ponto_reposicao),
    valor_unitario_medio: texto(item.valor_unitario_medio),
    lote: texto(item.lote),
    validade: texto(item.validade),
    ativo: item.ativo !== false,
  };
}

/** Converte o valor do formulário para o que vai à coluna (vazio vira null). */
function paraColuna(campo: keyof FormData, valor: string | boolean): string | number | boolean | null {
  if (typeof valor === "boolean") return valor;
  if (CAMPOS_NUMERICOS.includes(campo)) return paraNumero(valor);
  if (campo === "categoria_id") return valor === NENHUM ? null : valor;
  const limpo = valor.trim();
  return limpo === "" ? null : limpo;
}

/** Monta o update só com os campos que mudaram; nunca inclui id, datas de sistema nem saldo. */
function montarAlteracoes(inicial: FormData, atual: FormData): ItemUpdate {
  const alteracoes: Record<string, string | number | boolean | null> = {};
  for (const campo of CAMPOS_EDITAVEIS) {
    const antes = paraColuna(campo, inicial[campo]);
    const depois = paraColuna(campo, atual[campo]);
    if (antes !== depois) alteracoes[campo] = depois;
  }
  return alteracoes as ItemUpdate;
}

function CampoTexto({
  control,
  nome,
  rotulo,
  placeholder,
  tipo = "text",
  descricao,
}: {
  control: Control<FormData>;
  nome: CampoTextoForm;
  rotulo: string;
  placeholder?: string;
  tipo?: "text" | "date" | "number";
  descricao?: string;
}) {
  return (
    <FormField
      control={control}
      name={nome}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl>
            <Input
              type={tipo}
              placeholder={placeholder}
              step={tipo === "number" ? "any" : undefined}
              min={tipo === "number" ? 0 : undefined}
              {...field}
            />
          </FormControl>
          {descricao && <FormDescription>{descricao}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CampoSelect({
  control,
  nome,
  rotulo,
  opcoes,
  placeholder = "Selecione",
}: {
  control: Control<FormData>;
  nome: CampoTextoForm;
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={nome}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {opcoes.map((opcao) => (
                <SelectItem key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormularioEdicaoItem({ item }: { item: ItemMaterial }) {
  const navigate = useNavigate();
  const atualizarItem = useUpdateItemMaterial();
  const { data: categorias = [], isLoading: carregandoCategorias } = useCategoriasMaterial();

  const iniciais = valoresIniciais(item);
  const form = useForm<FormData>({
    resolver: zodResolver(editarItemSchema),
    defaultValues: iniciais,
  });

  const urlFicha = `/inventario/almoxarifado/${item.id}`;

  // Valores atuais fora das listas (categoria inativa, unidade antiga) entram como opção para não sumir.
  const opcoesUnidade = UNIDADES_MEDIDA.map((u) => ({ valor: u.value, rotulo: `${u.label} (${u.value})` }));
  if (item.unidade_medida && !UNIDADES_MEDIDA.some((u) => u.value === item.unidade_medida)) {
    opcoesUnidade.push({ valor: item.unidade_medida, rotulo: item.unidade_medida });
  }
  const opcoesCategoria = [
    { valor: NENHUM, rotulo: "Sem categoria" },
    ...categorias.map((c) => ({ valor: c.id, rotulo: c.codigo ? `${c.codigo} · ${c.nome}` : c.nome })),
  ];
  if (item.categoria_id && !categorias.some((c) => c.id === item.categoria_id)) {
    opcoesCategoria.push({ valor: item.categoria_id, rotulo: item.categoria?.nome || "Categoria atual" });
  }

  const onSubmit = async (dados: FormData) => {
    const alteracoes = montarAlteracoes(iniciais, dados);
    if (Object.keys(alteracoes).length === 0) {
      toast.info("Nenhuma alteração para salvar");
      navigate(urlFicha);
      return;
    }
    try {
      // O toast de sucesso/erro vem do useUpdateItemMaterial.
      await atualizarItem.mutateAsync({ id: item.id, ...alteracoes });
      navigate(urlFicha);
    } catch {
      // Erro já avisado pelo hook; o usuário continua na tela para corrigir.
    }
  };

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          migalhas={[
            { rotulo: "Inventário", href: "/inventario" },
            { rotulo: "Almoxarifado", href: "/inventario/almoxarifado" },
            { rotulo: item.codigo || "Item", href: urlFicha },
            { rotulo: "Editar" },
          ]}
          titulo="Editar item de material"
          descricao={<span className="font-mono">Código {item.codigo}</span>}
          acoes={
            <Button variant="outline" asChild>
              <Link to={urlFicha}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar à ficha
              </Link>
            </Button>
          }
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Identificação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" aria-hidden="true" />
                  Identificação do item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoTexto control={form.control} nome="codigo" rotulo="Código *" />
                  <CampoTexto control={form.control} nome="codigo_sku" rotulo="Código SKU" />
                </div>
                <CampoTexto control={form.control} nome="descricao" rotulo="Descrição *" />
                <FormField
                  control={form.control}
                  name="especificacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especificação</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" placeholder="Características técnicas do material" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoSelect
                    control={form.control}
                    nome="unidade_medida"
                    rotulo="Unidade de medida *"
                    opcoes={opcoesUnidade}
                  />
                  <CampoSelect
                    control={form.control}
                    nome="categoria_id"
                    rotulo="Categoria"
                    opcoes={opcoesCategoria}
                    placeholder={carregandoCategorias ? "Carregando..." : "Selecione a categoria"}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Item ativo</FormLabel>
                        <FormDescription>Desligue para marcar o item como fora de uso.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Parâmetros de estoque */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingDown className="h-5 w-5" aria-hidden="true" />
                  Parâmetros de estoque
                </CardTitle>
                <CardDescription>
                  Limites de controle do item, na unidade de medida escolhida. Não é o saldo em estoque,
                  que chega numa próxima etapa.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CampoTexto control={form.control} nome="estoque_minimo" rotulo="Estoque mínimo" tipo="number" />
                <CampoTexto control={form.control} nome="estoque_maximo" rotulo="Estoque máximo" tipo="number" />
                <CampoTexto
                  control={form.control}
                  nome="ponto_reposicao"
                  rotulo="Ponto de reposição"
                  tipo="number"
                  descricao="Quantidade em que se deve pedir reposição"
                />
              </CardContent>
            </Card>

            {/* Valores, lote e validade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="h-5 w-5" aria-hidden="true" />
                  Valor, lote e validade
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CampoTexto
                  control={form.control}
                  nome="valor_unitario_medio"
                  rotulo="Valor unitário médio (R$)"
                  tipo="number"
                />
                <CampoTexto control={form.control} nome="lote" rotulo="Lote" />
                <CampoTexto control={form.control} nome="validade" rotulo="Validade" tipo="date" />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(urlFicha)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={atualizarItem.isPending}>
                {atualizarItem.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ModuleLayout>
  );
}

export default function ItemMaterialEditarPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useItemMaterial(id);

  if (isLoading) return <DetalheCarregando rotulo="Carregando dados do item" />;

  if (error || !data) {
    return (
      <DetalheNaoEncontrado
        migalhas={[
          { rotulo: "Inventário", href: "/inventario" },
          { rotulo: "Almoxarifado", href: "/inventario/almoxarifado" },
          { rotulo: "Editar" },
        ]}
        titulo="Editar item de material"
        icone={Boxes}
        mensagem={error ? "Não foi possível carregar o item" : "Item não encontrado"}
        voltarPara="/inventario/almoxarifado"
        rotuloVoltar="Voltar ao almoxarifado"
      />
    );
  }

  const item = data as unknown as ItemMaterial;
  return <FormularioEdicaoItem key={item.id} item={item} />;
}
