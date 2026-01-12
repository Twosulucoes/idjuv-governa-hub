import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Building2, Server } from "lucide-react";
import { useConfigAutarquia, useSaveConfigAutarquia } from "@/hooks/useFolhaPagamento";
import { UFS } from "@/types/rh";

const configSchema = z.object({
  razao_social: z.string().min(3, "Razão social é obrigatória"),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ inválido"),
  natureza_juridica: z.string().optional(),
  codigo_municipio: z.string().max(10).optional(),
  regime_tributario: z.string().optional(),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().max(30).optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  endereco_cep: z.string().optional(),
  telefone: z.string().max(30).optional(),
  email_institucional: z.string().email("E-mail inválido").optional().or(z.literal("")),
  site: z.string().optional(),
  responsavel_legal: z.string().optional(),
  cpf_responsavel: z.string().optional(),
  cargo_responsavel: z.string().optional(),
  responsavel_contabil: z.string().optional(),
  cpf_contabil: z.string().optional(),
  crc_contabil: z.string().max(30).optional(),
  esocial_ambiente: z.string().optional(),
  esocial_processo_emissao: z.string().max(10).optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export function ConfigAutarquiaTab() {
  const { data: config, isLoading } = useConfigAutarquia();
  const saveConfig = useSaveConfigAutarquia();

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      razao_social: "",
      nome_fantasia: "",
      cnpj: "",
      natureza_juridica: "",
      codigo_municipio: "",
      regime_tributario: "",
      endereco_logradouro: "",
      endereco_numero: "",
      endereco_complemento: "",
      endereco_bairro: "",
      endereco_cidade: "",
      endereco_uf: "",
      endereco_cep: "",
      telefone: "",
      email_institucional: "",
      site: "",
      responsavel_legal: "",
      cpf_responsavel: "",
      cargo_responsavel: "",
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
        razao_social: config.razao_social || "",
        nome_fantasia: config.nome_fantasia || "",
        cnpj: config.cnpj || "",
        natureza_juridica: config.natureza_juridica || "",
        codigo_municipio: config.codigo_municipio || "",
        regime_tributario: config.regime_tributario || "",
        endereco_logradouro: config.endereco_logradouro || "",
        endereco_numero: config.endereco_numero || "",
        endereco_complemento: config.endereco_complemento || "",
        endereco_bairro: config.endereco_bairro || "",
        endereco_cidade: config.endereco_cidade || "",
        endereco_uf: config.endereco_uf || "",
        endereco_cep: config.endereco_cep || "",
        telefone: config.telefone || "",
        email_institucional: config.email_institucional || "",
        site: config.site || "",
        responsavel_legal: config.responsavel_legal || "",
        cpf_responsavel: config.cpf_responsavel || "",
        cargo_responsavel: config.cargo_responsavel || "",
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
        {/* Dados da Autarquia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Autarquia
            </CardTitle>
            <CardDescription>
              Informações básicas da instituição para folha de pagamento e eSocial
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="razao_social"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Razão Social *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome oficial da autarquia" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="00.000.000/0000-00" maxLength={18} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nome_fantasia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Fantasia</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome popular" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="natureza_juridica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Natureza Jurídica</FormLabel>
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
                    <Input {...field} placeholder="1400100" maxLength={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="endereco_cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="00000-000" maxLength={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_logradouro"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Rua, Avenida, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nº" maxLength={30} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_complemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sala, andar, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Bairro" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Cidade" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_uf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
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

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="(00) 0000-0000" maxLength={30} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email_institucional"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail Institucional</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="contato@orgao.gov.br" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://www.orgao.gov.br" />
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
              Informações necessárias para assinaturas e envio ao eSocial
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="responsavel_legal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável Legal</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="cargo_responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo do Responsável</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Presidente, Diretor, etc." />
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
