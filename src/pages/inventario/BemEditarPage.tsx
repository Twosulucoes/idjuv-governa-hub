/**
 * EDIÇÃO DE BEM PATRIMONIAL
 * Altera os dados descritivos, de localização e de responsabilidade de um bem.
 * Número de tombamento, código QR e dados financeiros de aquisição só o administrador altera
 * (o gatilho fn_gerar_numero_tombamento do banco também barra tombamento/QR para quem não é admin).
 */

import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, FileText, Loader2, Lock, Package, QrCode, Save, User } from "lucide-react";
import { toast } from "sonner";

import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/contexts/AuthContext";
import { useBemPatrimonial, useUnidadesLocaisPatrimonio, useUpdateBem } from "@/hooks/usePatrimonio";
import { useServidoresAtivosOpcoes } from "@/hooks/useComissoes";
import {
  CATEGORIAS_LABEL,
  ESTADOS_CONSERVACAO_LABEL,
  FORMAS_AQUISICAO_LABEL,
} from "@/hooks/patrimonio/useCadastroBemSimplificado";
import type { Database } from "@/integrations/supabase/types";

type BemUpdate = Database["public"]["Tables"]["bens_patrimoniais"]["Update"];
type Bem = NonNullable<ReturnType<typeof useBemPatrimonial>["data"]>;

/** Valor do Select para "sem unidade/responsável" (o Radix não aceita item com valor vazio). */
const NENHUM = "__nenhum__";

const editarBemSchema = z.object({
  descricao: z.string().trim().min(3, "Descrição deve ter no mínimo 3 caracteres").max(200),
  especificacao: z.string(),
  categoria_bem: z.string(),
  subcategoria: z.string(),
  marca: z.string(),
  modelo: z.string(),
  numero_serie: z.string(),
  estado_conservacao: z.string(),
  unidade_local_id: z.string(),
  localizacao_especifica: z.string(),
  predio: z.string(),
  andar: z.string(),
  sala: z.string(),
  ponto_especifico: z.string(),
  responsavel_id: z.string(),
  cargo_responsavel: z.string(),
  processo_sei: z.string(),
  nota_fiscal: z.string(),
  data_nota_fiscal: z.string(),
  fornecedor_cnpj_cpf: z.string(),
  garantia_ate: z.string(),
  observacao: z.string(),
  // Travados para quem não é admin
  numero_patrimonio: z.string().trim().min(1, "Informe o número de patrimônio").max(50, "Máximo 50 caracteres"),
  codigo_qr: z.string().trim().max(100, "Máximo 100 caracteres"),
  valor_aquisicao: z
    .string()
    .trim()
    .refine((v) => v !== "" && Number.isFinite(Number(v.replace(",", "."))) && Number(v.replace(",", ".")) >= 0, {
      message: "Informe um valor válido",
    }),
  data_aquisicao: z.string().min(1, "Informe a data de aquisição"),
  forma_aquisicao: z.string(),
});

type FormData = z.infer<typeof editarBemSchema>;
type CampoForm = keyof FormData;

/** Campos que todo usuário com acesso à tela pode alterar. */
const CAMPOS_LIVRES = [
  "descricao", "especificacao", "categoria_bem", "subcategoria", "marca", "modelo", "numero_serie",
  "estado_conservacao", "unidade_local_id", "localizacao_especifica", "predio", "andar", "sala",
  "ponto_especifico", "responsavel_id", "cargo_responsavel", "processo_sei", "nota_fiscal",
  "data_nota_fiscal", "fornecedor_cnpj_cpf", "garantia_ate", "observacao",
] as const satisfies readonly CampoForm[];

/** Campos que só o administrador altera: nem são enviados no update de quem não é admin. */
const CAMPOS_SO_ADMIN = [
  "numero_patrimonio", "codigo_qr", "valor_aquisicao", "data_aquisicao", "forma_aquisicao",
] as const satisfies readonly CampoForm[];

const NOTA_SO_ADMIN = "Só o administrador altera";

function texto(valor: string | number | null | undefined): string {
  return valor === null || valor === undefined ? "" : String(valor);
}

function valoresIniciais(bem: Bem): FormData {
  return {
    descricao: texto(bem.descricao),
    especificacao: texto(bem.especificacao),
    categoria_bem: texto(bem.categoria_bem),
    subcategoria: texto(bem.subcategoria),
    marca: texto(bem.marca),
    modelo: texto(bem.modelo),
    numero_serie: texto(bem.numero_serie),
    estado_conservacao: texto(bem.estado_conservacao),
    unidade_local_id: bem.unidade_local_id || NENHUM,
    localizacao_especifica: texto(bem.localizacao_especifica),
    predio: texto(bem.predio),
    andar: texto(bem.andar),
    sala: texto(bem.sala),
    ponto_especifico: texto(bem.ponto_especifico),
    responsavel_id: bem.responsavel_id || NENHUM,
    cargo_responsavel: texto(bem.cargo_responsavel),
    processo_sei: texto(bem.processo_sei),
    nota_fiscal: texto(bem.nota_fiscal),
    data_nota_fiscal: texto(bem.data_nota_fiscal),
    fornecedor_cnpj_cpf: texto(bem.fornecedor_cnpj_cpf),
    garantia_ate: texto(bem.garantia_ate),
    observacao: texto(bem.observacao),
    numero_patrimonio: texto(bem.numero_patrimonio),
    codigo_qr: texto(bem.codigo_qr),
    valor_aquisicao: texto(bem.valor_aquisicao),
    data_aquisicao: texto(bem.data_aquisicao),
    forma_aquisicao: texto(bem.forma_aquisicao),
  };
}

/** Converte o valor do formulário para o que vai à coluna (vazio vira null). */
function paraColuna(campo: CampoForm, valor: string): string | number | null {
  if (campo === "valor_aquisicao") return Number(valor.replace(",", "."));
  if (campo === "unidade_local_id" || campo === "responsavel_id") return valor === NENHUM ? null : valor;
  const limpo = valor.trim();
  return limpo === "" ? null : limpo;
}

/**
 * Monta o update só com os campos que mudaram e que o usuário pode alterar.
 * Nunca inclui valor_liquido (coluna gerada), id, created_at nem outros campos de sistema.
 */
function montarAlteracoes(inicial: FormData, atual: FormData, ehAdmin: boolean): BemUpdate {
  const campos: readonly CampoForm[] = ehAdmin ? [...CAMPOS_LIVRES, ...CAMPOS_SO_ADMIN] : CAMPOS_LIVRES;
  const alteracoes: Record<string, string | number | null> = {};
  for (const campo of campos) {
    const antes = paraColuna(campo, inicial[campo]);
    const depois = paraColuna(campo, atual[campo]);
    if (antes !== depois) alteracoes[campo] = depois;
  }
  return alteracoes as BemUpdate;
}

function CampoTexto({
  control,
  nome,
  rotulo,
  placeholder,
  tipo = "text",
  desabilitado = false,
  descricao,
}: {
  control: Control<FormData>;
  nome: CampoForm;
  rotulo: string;
  placeholder?: string;
  tipo?: "text" | "date" | "number";
  desabilitado?: boolean;
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
              disabled={desabilitado}
              step={tipo === "number" ? "0.01" : undefined}
              min={tipo === "number" ? 0 : undefined}
              {...field}
            />
          </FormControl>
          {descricao && (
            <FormDescription className="flex items-center gap-1">
              {desabilitado && <Lock className="h-3 w-3" aria-hidden="true" />}
              {descricao}
            </FormDescription>
          )}
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
  desabilitado = false,
  descricao,
}: {
  control: Control<FormData>;
  nome: CampoForm;
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  placeholder?: string;
  desabilitado?: boolean;
  descricao?: string;
}) {
  return (
    <FormField
      control={control}
      name={nome}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={desabilitado}>
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
          {descricao && (
            <FormDescription className="flex items-center gap-1">
              {desabilitado && <Lock className="h-3 w-3" aria-hidden="true" />}
              {descricao}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Opções de um mapa de rótulos, mantendo o valor atual do bem mesmo se estiver fora da lista. */
function opcoesDeRotulos(rotulos: Record<string, string>, valorAtual: string) {
  const opcoes = Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));
  if (valorAtual && !rotulos[valorAtual]) opcoes.push({ valor: valorAtual, rotulo: valorAtual.replace(/_/g, " ") });
  return opcoes;
}

function FormularioEdicaoBem({ bem }: { bem: Bem }) {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const atualizarBem = useUpdateBem();
  const { data: unidades = [], isLoading: carregandoUnidades } = useUnidadesLocaisPatrimonio();
  const { data: servidores = [], isLoading: carregandoServidores } = useServidoresAtivosOpcoes();

  const iniciais = valoresIniciais(bem);
  const form = useForm<FormData>({
    resolver: zodResolver(editarBemSchema),
    defaultValues: iniciais,
  });

  const urlFicha = `/inventario/bens/${bem.id}`;
  const travado = !isSuperAdmin;
  const notaTravada = travado ? NOTA_SO_ADMIN : undefined;

  // A unidade/responsável atual pode estar inativa e fora das listas: entra como opção para não sumir.
  const opcoesUnidade = [
    { valor: NENHUM, rotulo: "Sem unidade" },
    ...unidades.map((u) => ({
      valor: u.id,
      rotulo: [u.codigo_unidade, u.nome_unidade, u.municipio && `(${u.municipio})`].filter(Boolean).join(" "),
    })),
  ];
  if (bem.unidade_local_id && !unidades.some((u) => u.id === bem.unidade_local_id)) {
    opcoesUnidade.push({ valor: bem.unidade_local_id, rotulo: bem.unidade_local?.nome_unidade || "Unidade atual" });
  }
  const opcoesResponsavel = [
    { valor: NENHUM, rotulo: "Sem responsável" },
    ...servidores.map((s) => ({
      valor: s.id,
      rotulo: s.matricula ? `${s.nome_completo} (${s.matricula})` : s.nome_completo,
    })),
  ];
  if (bem.responsavel_id && !servidores.some((s) => s.id === bem.responsavel_id)) {
    opcoesResponsavel.push({ valor: bem.responsavel_id, rotulo: bem.responsavel?.nome_completo || "Responsável atual" });
  }

  const onSubmit = async (dados: FormData) => {
    const alteracoes = montarAlteracoes(iniciais, dados, isSuperAdmin);
    if (Object.keys(alteracoes).length === 0) {
      toast.info("Nenhuma alteração para salvar");
      navigate(urlFicha);
      return;
    }
    try {
      // O toast de sucesso/erro vem do useUpdateBem.
      await atualizarBem.mutateAsync({ id: bem.id, ...alteracoes });
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
            { rotulo: "Bens", href: "/inventario/bens" },
            { rotulo: bem.numero_patrimonio || "Bem", href: urlFicha },
            { rotulo: "Editar" },
          ]}
          titulo="Editar bem patrimonial"
          descricao={<span className="font-mono">Patrimônio {bem.numero_patrimonio}</span>}
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
                  Identificação do bem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CampoTexto control={form.control} nome="descricao" rotulo="Descrição do bem *" />
                <FormField
                  control={form.control}
                  name="especificacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especificação</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" placeholder="Características técnicas do bem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoSelect
                    control={form.control}
                    nome="categoria_bem"
                    rotulo="Categoria"
                    opcoes={opcoesDeRotulos(CATEGORIAS_LABEL, iniciais.categoria_bem)}
                  />
                  <CampoTexto control={form.control} nome="subcategoria" rotulo="Subcategoria" placeholder="Ex: Cadeira, Monitor" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CampoTexto control={form.control} nome="marca" rotulo="Marca" />
                  <CampoTexto control={form.control} nome="modelo" rotulo="Modelo" />
                  <CampoTexto control={form.control} nome="numero_serie" rotulo="Número de série" />
                </div>
                <CampoSelect
                  control={form.control}
                  nome="estado_conservacao"
                  rotulo="Estado de conservação"
                  opcoes={opcoesDeRotulos(ESTADOS_CONSERVACAO_LABEL, iniciais.estado_conservacao)}
                />
              </CardContent>
            </Card>

            {/* Tombamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="h-5 w-5" aria-hidden="true" />
                  Tombamento
                </CardTitle>
                <CardDescription>
                  O número de patrimônio e o código QR identificam a plaqueta do bem.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CampoTexto
                  control={form.control}
                  nome="numero_patrimonio"
                  rotulo="Número de patrimônio"
                  desabilitado={travado}
                  descricao={notaTravada ?? "Ao trocar, o número atual fica registrado como tombamento anterior"}
                />
                <CampoTexto
                  control={form.control}
                  nome="codigo_qr"
                  rotulo="Código QR"
                  desabilitado={travado}
                  descricao={notaTravada}
                />
              </CardContent>
            </Card>

            {/* Localização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CampoSelect
                  control={form.control}
                  nome="unidade_local_id"
                  rotulo="Unidade local"
                  opcoes={opcoesUnidade}
                  placeholder={carregandoUnidades ? "Carregando..." : "Selecione a unidade"}
                  descricao="Trocar a unidade registra uma transferência no histórico do bem"
                />
                <CampoTexto
                  control={form.control}
                  nome="localizacao_especifica"
                  rotulo="Localização específica"
                  placeholder="Ex: Sala 01, Depósito, Recepção"
                />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <CampoTexto control={form.control} nome="predio" rotulo="Prédio" />
                  <CampoTexto control={form.control} nome="andar" rotulo="Andar" />
                  <CampoTexto control={form.control} nome="sala" rotulo="Sala" />
                  <CampoTexto control={form.control} nome="ponto_especifico" rotulo="Ponto específico" />
                </div>
              </CardContent>
            </Card>

            {/* Responsabilidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" aria-hidden="true" />
                  Responsabilidade
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CampoSelect
                  control={form.control}
                  nome="responsavel_id"
                  rotulo="Responsável"
                  opcoes={opcoesResponsavel}
                  placeholder={carregandoServidores ? "Carregando..." : "Selecione o responsável"}
                />
                <CampoTexto control={form.control} nome="cargo_responsavel" rotulo="Cargo do responsável" />
              </CardContent>
            </Card>

            {/* Aquisição */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                  Dados de aquisição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CampoTexto
                    control={form.control}
                    nome="valor_aquisicao"
                    rotulo="Valor de aquisição (R$)"
                    tipo="number"
                    desabilitado={travado}
                    descricao={notaTravada}
                  />
                  <CampoTexto
                    control={form.control}
                    nome="data_aquisicao"
                    rotulo="Data de aquisição"
                    tipo="date"
                    desabilitado={travado}
                    descricao={notaTravada}
                  />
                  <CampoSelect
                    control={form.control}
                    nome="forma_aquisicao"
                    rotulo="Forma de aquisição"
                    opcoes={opcoesDeRotulos(FORMAS_AQUISICAO_LABEL, iniciais.forma_aquisicao)}
                    desabilitado={travado}
                    descricao={notaTravada}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoTexto control={form.control} nome="processo_sei" rotulo="Processo SEI" placeholder="Ex: 00000.000000/2026-00" />
                  <CampoTexto control={form.control} nome="nota_fiscal" rotulo="Nota fiscal" />
                  <CampoTexto control={form.control} nome="data_nota_fiscal" rotulo="Data da nota fiscal" tipo="date" />
                  <CampoTexto control={form.control} nome="fornecedor_cnpj_cpf" rotulo="CNPJ/CPF do fornecedor" />
                  <CampoTexto control={form.control} nome="garantia_ate" rotulo="Garantia até" tipo="date" />
                </div>
                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" placeholder="Observações adicionais sobre o bem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(urlFicha)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={atualizarBem.isPending}>
                {atualizarBem.isPending ? (
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

export default function BemEditarPage() {
  const { id } = useParams<{ id: string }>();
  const { data: bem, isLoading, error } = useBemPatrimonial(id);

  if (isLoading) return <DetalheCarregando rotulo="Carregando dados do bem" />;

  if (error || !bem) {
    return (
      <DetalheNaoEncontrado
        migalhas={[
          { rotulo: "Inventário", href: "/inventario" },
          { rotulo: "Bens", href: "/inventario/bens" },
          { rotulo: "Editar" },
        ]}
        titulo="Editar bem patrimonial"
        icone={Package}
        mensagem={error ? "Não foi possível carregar o bem" : "Bem não encontrado"}
        voltarPara="/inventario/bens"
        rotuloVoltar="Voltar à listagem"
      />
    );
  }

  return <FormularioEdicaoBem key={bem.id} bem={bem} />;
}
