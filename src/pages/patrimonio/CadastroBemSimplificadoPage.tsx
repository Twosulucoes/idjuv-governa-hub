/**
 * CADASTRO SIMPLIFICADO DE BENS PATRIMONIAIS
 * Módulo para equipe de patrimônio cadastrar bens em unidades locais
 * O número de tombamento é sempre gerado pelo sistema (banco); a plaqueta antiga,
 * se houver, fica registrada como tombamento anterior.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Package,
  Building2,
  QrCode,
  FileText,
  CheckCircle2,
  Loader2,
  Plus,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/design-system";
import { toast } from "sonner";
import { imprimirEtiquetas } from "@/lib/etiquetasPatrimonio";

import {
  useCadastroBemSimplificado,
  CATEGORIAS_LABEL,
  FORMAS_AQUISICAO_LABEL,
  ESTADOS_CONSERVACAO_LABEL,
  type NovoBemPayload,
  type CategoriaBem,
  type FormaAquisicao,
  type EstadoConservacao,
} from "@/hooks/patrimonio/useCadastroBemSimplificado";

// Schema de validação
const cadastroBemSchema = z.object({
  unidade_local_id: z.string().min(1, "Selecione a unidade local"),
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres").max(200),
  categoria_bem: z.enum(["mobiliario", "informatica", "equipamento_esportivo", "veiculo", "eletrodomestico", "outros"]),
  subcategoria: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numero_serie: z.string().optional(),
  estado_conservacao: z.enum(["otimo", "bom", "regular", "ruim", "inservivel"]),
  localizacao_especifica: z.string().optional(),
  forma_aquisicao: z.enum(["compra", "doacao", "cessao", "transferencia"]),
  processo_sei: z.string().optional(),
  nota_fiscal: z.string().optional(),
  data_nota_fiscal: z.string().optional(),
  fornecedor_cnpj_cpf: z.string().optional(),
  observacao: z.string().optional(),
  possui_tombamento_externo: z.boolean().default(false),
  numero_patrimonio_externo: z.string().trim().max(50, "Máximo 50 caracteres").optional(),
}).refine((d) => !d.possui_tombamento_externo || !!d.numero_patrimonio_externo?.trim(), {
  message: "Informe o tombamento anterior",
  path: ["numero_patrimonio_externo"],
});

type FormData = z.infer<typeof cadastroBemSchema>;

interface BemCadastrado {
  id: string;
  numero_patrimonio: string;
  codigo_qr: string | null;
  descricao: string;
  unidade_nome?: string;
}

export default function CadastroBemSimplificadoPage() {
  const { unidadesLocais, loadingUnidades, cadastrarBem, isSubmitting } = useCadastroBemSimplificado();
  const [bemCadastrado, setBemCadastrado] = useState<BemCadastrado | null>(null);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(cadastroBemSchema),
    defaultValues: {
      unidade_local_id: "",
      descricao: "",
      categoria_bem: "mobiliario",
      estado_conservacao: "bom",
      forma_aquisicao: "compra",
      possui_tombamento_externo: false,
    },
  });

  const possuiTombamentoExterno = form.watch("possui_tombamento_externo");
  const formaAquisicao = form.watch("forma_aquisicao");
  const unidadeSelecionadaId = form.watch("unidade_local_id");

  const unidadeSelecionada = unidadesLocais.find((u) => u.id === unidadeSelecionadaId);

  const onSubmit = async (data: FormData) => {
    try {
      const resultado = await cadastrarBem(data as NovoBemPayload);
      setBemCadastrado({
        id: resultado.id,
        numero_patrimonio: resultado.numero_patrimonio,
        codigo_qr: resultado.codigo_qr,
        descricao: data.descricao,
        unidade_nome: unidadeSelecionada?.nome_unidade,
      });
      setMostrarSucesso(true);
      form.reset();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleNovoCadastro = () => {
    setMostrarSucesso(false);
    setBemCadastrado(null);
  };

  const imprimirEtiqueta = async () => {
    if (!bemCadastrado) return;
    try {
      await imprimirEtiquetas([{ ...bemCadastrado, unidade: bemCadastrado.unidade_nome }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível imprimir a etiqueta.");
    }
  };

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          migalhas={[
            { rotulo: "Inventário", href: "/inventario" },
            { rotulo: "Bens patrimoniais", href: "/inventario/bens" },
            { rotulo: "Cadastro simplificado" },
          ]}
          titulo="Cadastro de bem patrimonial"
          descricao="Cadastro simplificado com geração automática de tombamento"
          acoes={
            <Button variant="outline" asChild>
              <Link to="/inventario/bens">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar
              </Link>
            </Button>
          }
        />

        {/* Formulário */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Unidade Local */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                  Localização
                </CardTitle>
                <CardDescription>
                  Selecione a unidade onde o bem está localizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="unidade_local_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade Local *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingUnidades ? "Carregando..." : "Selecione a unidade"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unidadesLocais.map((unidade) => (
                            <SelectItem key={unidade.id} value={unidade.id}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {unidade.codigo_unidade}
                                </Badge>
                                <span>{unidade.nome_unidade}</span>
                                <span className="text-muted-foreground">({unidade.municipio})</span>
                              </div>
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
                  name="localizacao_especifica"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Localização Específica</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sala 01, Depósito, Recepção..." {...field} />
                      </FormControl>
                      <FormDescription>Onde exatamente o bem está localizado dentro da unidade</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Identificação do Bem */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" aria-hidden="true" />
                  Identificação do Bem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Bem *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mesa de escritório em MDF, Computador Desktop..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria_bem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CATEGORIAS_LABEL).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                    name="subcategoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategoria</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cadeira, Monitor, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Dell, Samsung..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Optiplex 3080" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero_serie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Série</FormLabel>
                        <FormControl>
                          <Input placeholder="S/N do equipamento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estado_conservacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de Conservação *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ESTADOS_CONSERVACAO_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
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
                  O número de tombamento é gerado automaticamente pelo sistema ao salvar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="possui_tombamento_externo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Tem plaqueta antiga?</FormLabel>
                        <FormDescription>
                          Marque se o bem já tem um número de patrimônio anterior (regularização)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {possuiTombamentoExterno && (
                  <FormField
                    control={form.control}
                    name="numero_patrimonio_externo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tombamento anterior (plaqueta antiga)</FormLabel>
                        <FormControl>
                          <Input placeholder="Número da plaqueta antiga" {...field} />
                        </FormControl>
                        <FormDescription>
                          O sistema gera um número novo para o bem; este número fica registrado
                          como tombamento anterior e o bem continua sendo encontrado por ele.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!possuiTombamentoExterno && (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      O número de tombamento (ex.: PAT-{new Date().getFullYear()}-000123) será gerado
                      pelo sistema ao salvar.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aquisição */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                  Dados de Aquisição
                </CardTitle>
                <CardDescription>
                  Informações sobre como o bem foi adquirido (opcional para rastreabilidade)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="forma_aquisicao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Aquisição *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(FORMAS_AQUISICAO_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {formaAquisicao === "compra" && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="processo_sei"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Processo SEI</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 00000.000000/2026-00" {...field} />
                            </FormControl>
                            <FormDescription>Processo de licitação/compra</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nota_fiscal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nota Fiscal</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da NF" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_nota_fiscal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data da Nota Fiscal</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fornecedor_cnpj_cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ/CPF do Fornecedor</FormLabel>
                            <FormControl>
                              <Input placeholder="00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais sobre o bem..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Limpar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Cadastrar Bem
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Modal de Sucesso */}
        <Dialog open={mostrarSucesso} onOpenChange={setMostrarSucesso}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                Bem Cadastrado com Sucesso!
              </DialogTitle>
              <DialogDescription>
                O bem foi registrado no sistema de patrimônio.
              </DialogDescription>
            </DialogHeader>

            {bemCadastrado && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Número de Tombamento:</p>
                  <p className="text-3xl font-mono font-bold text-primary">
                    {bemCadastrado.numero_patrimonio}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {bemCadastrado.descricao}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bemCadastrado.unidade_nome}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={imprimirEtiqueta}>
                    <Printer className="h-4 w-4 mr-2" aria-hidden="true" />
                    Imprimir Etiqueta
                  </Button>
                  <Button className="flex-1" onClick={handleNovoCadastro}>
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Novo Cadastro
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
