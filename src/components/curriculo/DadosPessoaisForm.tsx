import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaskedInput } from "@/components/ui/masked-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PreCadastro } from "@/types/preCadastro";
import { ESTADOS_CIVIS, UFS, TIPOS_SANGUINEOS } from "@/types/preCadastro";
import { useVerificarCpf } from "@/hooks/useVerificarCpf";
import { Loader2, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
  codigoAtual?: string;
  onRecuperarPreCadastro?: (codigo: string) => void;
}

interface StatusCpf {
  verificado: boolean;
  existeServidor: boolean;
  existePreCadastro: boolean;
  servidor?: { nome: string; matricula: string; situacao: string };
  preCadastro?: { nome: string; status: string; codigo: string };
}

export function DadosPessoaisForm({ dados, onChange, codigoAtual, onRecuperarPreCadastro }: Props) {
  const [statusCpf, setStatusCpf] = useState<StatusCpf | null>(null);
  const { verificar, isVerificando } = useVerificarCpf();

  const handleChange = (field: keyof PreCadastro, value: string) => {
    onChange({ ...dados, [field]: value });
    if (field === "cpf") {
      setStatusCpf(null);
    }
  };

  const handleVerificarCpf = useCallback(async () => {
    const cpf = dados.cpf;
    if (!cpf || cpf.replace(/\D/g, "").length !== 11) return;

    const resultado = await verificar(cpf, codigoAtual);
    setStatusCpf({
      verificado: true,
      ...resultado,
    });
  }, [dados.cpf, codigoAtual, verificar]);

  const handleRecuperar = () => {
    if (statusCpf?.preCadastro?.codigo && onRecuperarPreCadastro) {
      onRecuperarPreCadastro(statusCpf.preCadastro.codigo);
    }
  };

  const cpfCompleto = (dados.cpf || "").replace(/\D/g, "").length === 11;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Dados Pessoais</h3>
        <p className="text-sm text-muted-foreground">
          Preencha seus dados pessoais básicos.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <Input
            id="nome_completo"
            value={dados.nome_completo || ""}
            onChange={(e) => handleChange("nome_completo", e.target.value.toUpperCase())}
            placeholder="Digite seu nome completo"
            className="uppercase"
          />
        </div>

        {/* CPF com verificação */}
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <div className="flex gap-2">
            <MaskedInput
              id="cpf"
              mask="cpf"
              value={dados.cpf || ""}
              onChange={(value) => handleChange("cpf", value)}
              placeholder="000.000.000-00"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleVerificarCpf}
              disabled={!cpfCompleto || isVerificando}
              className="shrink-0"
            >
              {isVerificando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verificar"
              )}
            </Button>
          </div>

          {/* Status do CPF */}
          {statusCpf?.verificado && (
            <div className="mt-2">
              {statusCpf.existeServidor && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>CPF já cadastrado como servidor</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Este CPF está vinculado ao servidor:</p>
                    <div className="bg-destructive/10 p-2 rounded text-sm">
                      <p><strong>Nome:</strong> {statusCpf.servidor?.nome}</p>
                      <p><strong>Matrícula:</strong> {statusCpf.servidor?.matricula}</p>
                      <p><strong>Situação:</strong> {statusCpf.servidor?.situacao}</p>
                    </div>
                    <p className="text-xs">Entre em contato com o RH.</p>
                  </AlertDescription>
                </Alert>
              )}

              {!statusCpf.existeServidor && statusCpf.existePreCadastro && (
                <Alert className="border-warning bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertTitle className="text-warning">Pré-cadastro existente</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Este CPF já possui um pré-cadastro:</p>
                    <div className="bg-warning/10 p-2 rounded text-sm">
                      <p><strong>Nome:</strong> {statusCpf.preCadastro?.nome}</p>
                      <p><strong>Status:</strong> {statusCpf.preCadastro?.status}</p>
                      <p><strong>Código:</strong> {statusCpf.preCadastro?.codigo}</p>
                    </div>
                    {onRecuperarPreCadastro && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRecuperar}
                        className="mt-2"
                      >
                        Recuperar pré-cadastro existente
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!statusCpf.existeServidor && !statusCpf.existePreCadastro && (
                <Alert className="border-success bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertTitle className="text-success">CPF disponível</AlertTitle>
                  <AlertDescription>
                    CPF liberado para pré-cadastro.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nome_social">Nome Social (se aplicável)</Label>
          <Input
            id="nome_social"
            value={dados.nome_social || ""}
            onChange={(e) => handleChange("nome_social", e.target.value.toUpperCase())}
            placeholder="Digite seu nome social"
            className="uppercase"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={dados.data_nascimento || ""}
              onChange={(e) => handleChange("data_nascimento", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sexo">Sexo *</Label>
            <Select
              value={dados.sexo || ""}
              onValueChange={(value) => handleChange("sexo", value)}
            >
              <SelectTrigger id="sexo">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
                <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="estado_civil">Estado Civil *</Label>
            <Select
              value={dados.estado_civil || ""}
              onValueChange={(value) => handleChange("estado_civil", value)}
            >
              <SelectTrigger id="estado_civil">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_CIVIS.map((ec) => (
                  <SelectItem key={ec} value={ec}>
                    {ec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Raça/Cor e PCD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="raca_cor">Raça/Cor</Label>
            <Select
              value={dados.raca_cor || ""}
              onValueChange={(value) => handleChange("raca_cor", value)}
            >
              <SelectTrigger id="raca_cor">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Branca">Branca</SelectItem>
                <SelectItem value="Preta">Preta</SelectItem>
                <SelectItem value="Parda">Parda</SelectItem>
                <SelectItem value="Amarela">Amarela</SelectItem>
                <SelectItem value="Indígena">Indígena</SelectItem>
                <SelectItem value="Não declarada">Não declarada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pcd">Pessoa com Deficiência (PCD)</Label>
            <Select
              value={dados.pcd === true ? "sim" : dados.pcd === false ? "nao" : ""}
              onValueChange={(value) => handleChange("pcd", value === "sim" ? "true" : "false")}
            >
              <SelectTrigger id="pcd">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao">Não</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dados.pcd === true && (
            <div className="grid gap-2">
              <Label htmlFor="pcd_tipo">Tipo de Deficiência</Label>
              <Select
                value={dados.pcd_tipo || ""}
                onValueChange={(value) => handleChange("pcd_tipo", value)}
              >
                <SelectTrigger id="pcd_tipo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Física">Física</SelectItem>
                  <SelectItem value="Auditiva">Auditiva</SelectItem>
                  <SelectItem value="Visual">Visual</SelectItem>
                  <SelectItem value="Intelectual">Intelectual</SelectItem>
                  <SelectItem value="Múltipla">Múltipla</SelectItem>
                  <SelectItem value="Outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Tipo Sanguíneo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tipo_sanguineo">Tipo Sanguíneo/RH</Label>
            <Select
              value={dados.tipo_sanguineo || ""}
              onValueChange={(value) => handleChange("tipo_sanguineo", value)}
            >
              <SelectTrigger id="tipo_sanguineo">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_SANGUINEOS.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nacionalidade">Nacionalidade</Label>
            <Input
              id="nacionalidade"
              value={dados.nacionalidade || "Brasileira"}
              onChange={(e) => handleChange("nacionalidade", e.target.value)}
              placeholder="Nacionalidade"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="naturalidade_cidade">Cidade de Nascimento</Label>
            <Input
              id="naturalidade_cidade"
              value={dados.naturalidade_cidade || ""}
              onChange={(e) => handleChange("naturalidade_cidade", e.target.value.toUpperCase())}
              placeholder="Cidade"
              className="uppercase"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="naturalidade_uf">UF</Label>
            <Select
              value={dados.naturalidade_uf || ""}
              onValueChange={(value) => handleChange("naturalidade_uf", value)}
            >
              <SelectTrigger id="naturalidade_uf">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nome dos Pais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nome_mae">Nome da Mãe</Label>
            <Input
              id="nome_mae"
              value={dados.nome_mae || ""}
              onChange={(e) => handleChange("nome_mae", e.target.value.toUpperCase())}
              placeholder="Nome completo da mãe"
              className="uppercase"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nome_pai">Nome do Pai</Label>
            <Input
              id="nome_pai"
              value={dados.nome_pai || ""}
              onChange={(e) => handleChange("nome_pai", e.target.value.toUpperCase())}
              placeholder="Nome completo do pai"
              className="uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={dados.email || ""}
              onChange={(e) => handleChange("email", e.target.value.toLowerCase())}
              placeholder="seu@email.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefone_celular">Telefone Celular *</Label>
            <MaskedInput
              id="telefone_celular"
              mask="telefone"
              value={dados.telefone_celular || ""}
              onChange={(value) => handleChange("telefone_celular", value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="telefone_fixo">Telefone Fixo (opcional)</Label>
          <MaskedInput
            id="telefone_fixo"
            mask="telefone"
            value={dados.telefone_fixo || ""}
            onChange={(value) => handleChange("telefone_fixo", value)}
            placeholder="(00) 0000-0000"
          />
        </div>
      </div>
    </div>
  );
}
