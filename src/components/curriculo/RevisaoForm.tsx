import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { PreCadastro, Dependente, Idioma } from "@/types/preCadastro";
import { formatCPF } from "@/lib/formatters";
import { DOCUMENTOS_CHECKLIST } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
}

export function RevisaoForm({ dados }: Props) {
  // Calcular completude dos campos
  const camposObrigatorios = [
    { campo: "nome_completo", label: "Nome completo" },
    { campo: "cpf", label: "CPF" },
    { campo: "email", label: "E-mail" },
    { campo: "data_nascimento", label: "Data de nascimento" },
    { campo: "sexo", label: "Sexo" },
    { campo: "telefone_celular", label: "Telefone celular" },
    { campo: "rg", label: "RG" },
    { campo: "endereco_logradouro", label: "Endereço" },
    { campo: "endereco_cidade", label: "Cidade" },
    { campo: "endereco_uf", label: "UF" },
    { campo: "escolaridade", label: "Escolaridade" },
  ];

  const camposPreenchidos = camposObrigatorios.filter(
    (c) => dados[c.campo as keyof PreCadastro]
  ).length;
  const progressoCampos = Math.round((camposPreenchidos / camposObrigatorios.length) * 100);

  // Calcular checklist de documentos
  const todosDocumentos = [
    ...DOCUMENTOS_CHECKLIST.pessoais,
    ...DOCUMENTOS_CHECKLIST.previdenciarios,
    ...DOCUMENTOS_CHECKLIST.escolaridade,
    ...DOCUMENTOS_CHECKLIST.certidoes,
    ...DOCUMENTOS_CHECKLIST.declaracoes,
    ...DOCUMENTOS_CHECKLIST.bancarios,
  ];
  const docsMarcados = todosDocumentos.filter(
    (d) => dados[d.key as keyof PreCadastro]
  ).length;
  const progressoDocs = Math.round((docsMarcados / todosDocumentos.length) * 100);

  const dependentes = (dados.dependentes || []) as Dependente[];
  const idiomas = (dados.idiomas || []) as Idioma[];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Revisão do Pré-Cadastro</h3>
        <p className="text-sm text-muted-foreground">
          Revise todas as informações antes de enviar.
        </p>
      </div>

      {/* Status de Preenchimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Campos Obrigatórios</p>
                <p className="text-2xl font-bold">{progressoCampos}%</p>
              </div>
              {progressoCampos === 100 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-500" />
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${progressoCampos}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Checklist de Documentos</p>
                <p className="text-2xl font-bold">{docsMarcados}/{todosDocumentos.length}</p>
              </div>
              {progressoDocs === 100 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-500" />
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${progressoDocs}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campos não preenchidos */}
      {progressoCampos < 100 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Campos obrigatórios pendentes:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                  {camposObrigatorios
                    .filter((c) => !dados[c.campo as keyof PreCadastro])
                    .map((c) => (
                      <li key={c.campo}>• {c.label}</li>
                    ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Pessoais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium">{dados.nome_completo || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">CPF:</span>
              <p className="font-medium">{formatCPF(dados.cpf || "")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">E-mail:</span>
              <p className="font-medium">{dados.email || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Telefone:</span>
              <p className="font-medium">{dados.telefone_celular || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Data Nascimento:</span>
              <p className="font-medium">
                {dados.data_nascimento
                  ? new Date(dados.data_nascimento).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Estado Civil:</span>
              <p className="font-medium">{dados.estado_civil || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-medium">
            {dados.endereco_logradouro
              ? `${dados.endereco_logradouro}, ${dados.endereco_numero || "S/N"}`
              : "-"}
          </p>
          {dados.endereco_complemento && (
            <p className="text-muted-foreground">{dados.endereco_complemento}</p>
          )}
          <p>
            {dados.endereco_bairro || ""} - {dados.endereco_cidade || ""}/{dados.endereco_uf || ""}
          </p>
          <p className="text-muted-foreground">CEP: {dados.endereco_cep || "-"}</p>
        </CardContent>
      </Card>

      {/* Escolaridade */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Escolaridade e Habilitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Escolaridade:</span>
              <p className="font-medium">{dados.escolaridade || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Formação:</span>
              <p className="font-medium">{dados.formacao_academica || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Instituição:</span>
              <p className="font-medium">{dados.instituicao_ensino || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Ano Conclusão:</span>
              <p className="font-medium">{dados.ano_conclusao || "-"}</p>
            </div>
          </div>
          {dados.cnh_numero && (
            <div className="pt-2 border-t">
              <span className="text-muted-foreground">CNH:</span>
              <p className="font-medium">
                {dados.cnh_numero} - Categoria {dados.cnh_categoria}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aptidões */}
      {(dados.habilidades?.length || idiomas.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aptidões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dados.habilidades && dados.habilidades.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Habilidades:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dados.habilidades.map((h) => (
                    <Badge key={h} variant="secondary" className="text-xs">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {idiomas.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Idiomas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {idiomas.map((i, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {i.idioma} ({i.nivel})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dados Bancários */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados Bancários</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Banco:</span>
              <p className="font-medium">
                {dados.banco_nome
                  ? `${dados.banco_codigo} - ${dados.banco_nome}`
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Agência/Conta:</span>
              <p className="font-medium">
                {dados.banco_agencia || "-"} / {dados.banco_conta || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependentes */}
      {dependentes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Dependentes ({dependentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dependentes.map((dep, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <p className="font-medium">{dep.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {dep.parentesco} • CPF: {formatCPF(dep.cpf)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
