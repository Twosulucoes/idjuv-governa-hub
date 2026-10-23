import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Loader2, Save, Building2, Server } from "lucide-react";
import { useTenant } from "@/core/tenant";
import { useConfigAutarquia, useSaveConfigAutarquia } from "@/hooks/useFolhaPagamento";
import { identidadeDoCliente } from "@/lib/identidadeConfigAutarquia";

const configSchema = z.object({
  natureza_juridica: z.string().optional(),
  // O banco guarda o código IBGE com 7 dígitos (varchar(7)); ex.: Boa Vista = 1400100
  codigo_municipio: z
    .string()
    .trim()
    .regex(/^(\d{7})?$/, "O código IBGE tem 7 números, sem ponto nem traço (ex.: 1400100)")
    .optional(),
  regime_tributario: z.string().optional(),
  cpf_responsavel: z.string().optional(),
  responsavel_contabil: z.string().optional(),
  cpf_contabil: z.string().optional(),
  crc_contabil: z.string().max(30).optional(),
  esocial_ambiente: z.string().optional(),
  esocial_processo_emissao: z.string().max(10).optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export function ConfigAutarquiaTab() {
  const tenant = useTenant();
  const { data: config, isLoading } = useConfigAutarquia();
  const saveConfig = useSaveConfigAutarquia();
  const identidade = identidadeDoCliente(tenant, config);
  const endereco = [
    identidade.endereco_logradouro,
    identidade.endereco_numero,
    identidade.endereco_complemento,
    identidade.endereco_bairro,
    [identidade.endereco_cidade, identidade.endereco_uf].filter(Boolean).join("/"),
    identidade.endereco_cep,
  ]
    .filter(Boolean)
    .join(", ");
  const itensIdentidade: [string, string | null][] = [
    ["Razão social", identidade.razao_social],
    ["CNPJ", identidade.cnpj],
    ["Nome curto", identidade.nome_fantasia],
    ["Endereço", endereco],
    ["Telefone", identidade.telefone],
    ["E-mail", identidade.email_institucional],
    ["Site", identidade.site],
    ["Dirigente", [identidade.responsavel_legal, identidade.cargo_responsavel].filter(Boolean).join(", ")],
  ];

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      natureza_juridica: "",
      codigo_municipio: "",
      regime_tributario: "",
      cpf_responsavel: "",
      responsavel_contabil: "",
      cpf_contabil: "",
      crc_contabil: "",
      esocial_ambiente: "",
      esocial_processo_emissao: "",
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        natureza_juridica: config.natureza_juridica || "",
        codigo_municipio: config.codigo_municipio || "",
        regime_tributario: config.regime_tributario || "",
        cpf_responsavel: config.cpf_responsavel || "",
        responsavel_contabil: config.responsavel_contabil || "",
        cpf_contabil: config.cpf_contabil || "",
        crc_contabil: config.crc_contabil || "",
        esocial_ambiente: config.esocial_ambiente || "",
        esocial_processo_emissao: config.esocial_processo_emissao || "",
      });
    }
  }, [config, form]);

  const onSubmit = (data: ConfigFormData) => {
    saveConfig.mutate({
      ...data,
      // Razão social e CNPJ são obrigatórios na tabela: vão com os da Configuração do cliente. O resto da
      // identidade não é mais gravado aqui (quem lê usa `comIdentidadeDoCliente`).
      razao_social: identidade.razao_social,
      cnpj: identidade.cnpj,
      id: config?.id,
      ativo: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Identidade da instituição: só leitura, vem da Configuração do cliente */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da instituição
                </CardTitle>
                <CardDescription>
                  Razão social, CNPJ, endereço, contato e dirigente ficam num lugar só: a Configuração do cliente. A
                  folha, o eSocial e os arquivos do banco usam esses dados.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link to="/admin/configuracao-cliente">
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                  Editar na Configuração do cliente
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!identidade.razao_social || !identidade.cnpj) && (
              <Alert>
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertDescription>
                  Falta {!identidade.razao_social ? "o nome oficial" : "o CNPJ"} na Configuração do cliente.
                </AlertDescription>
              </Alert>
            )}
            <dl className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
              {itensIdentidade.map(([rotulo, valor]) => (
                <div key={rotulo} className="min-w-0">
                  <dt className="text-muted-foreground">{rotulo}</dt>
                  <dd className="break-words font-medium">{valor || "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Dados da folha e do eSocial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados para a folha e o eSocial
            </CardTitle>
            <CardDescription>
              O que só a folha de pagamento e o eSocial usam
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">



            <FormField
              control={form.control}
              name="natureza_juridica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Natureza jurídica (código do eSocial)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1104 - Autarquia Estadual">1104 - Autarquia Estadual</SelectItem>
                      <SelectItem value="1105 - Autarquia Municipal">1105 - Autarquia Municipal</SelectItem>
                      <SelectItem value="1201 - Fundação Pública Direito Público">1201 - Fundação Pública Direito Público</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regime_tributario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regime Tributário</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Imune">Imune</SelectItem>
                      <SelectItem value="Isento">Isento</SelectItem>
                      <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                      <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codigo_municipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código IBGE Município</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="1400100" inputMode="numeric" maxLength={7} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle>Responsáveis</CardTitle>
            <CardDescription>
              CPF do dirigente e contador, para assinaturas e envio ao eSocial (o nome e o cargo do dirigente vêm da
              Configuração do cliente)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">

            <FormField
              control={form.control}
              name="cpf_responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do Responsável</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="000.000.000-00" maxLength={14} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="responsavel_contabil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável Contábil</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do contador" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf_contabil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do Contador</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="000.000.000-00" maxLength={14} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="crc_contabil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRC do Contador</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="CRC/UF 000000" maxLength={30} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* eSocial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Configurações eSocial
            </CardTitle>
            <CardDescription>
              Parâmetros para envio de eventos ao eSocial
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="esocial_ambiente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ambiente eSocial</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1 - Produção">1 - Produção</SelectItem>
                      <SelectItem value="2 - Produção Restrita (Homologação)">2 - Produção Restrita (Homologação)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Ambiente 1 para envio real, 2 para testes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="esocial_processo_emissao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo de Emissão</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 - Aplicativo do Empregador</SelectItem>
                      <SelectItem value="2">2 - Aplicativo Governamental</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saveConfig.isPending} size="lg">
            {saveConfig.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </Form>
  );
}
