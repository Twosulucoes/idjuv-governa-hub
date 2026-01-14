import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaskedInput } from "@/components/ui/masked-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PreCadastro } from "@/types/preCadastro";
import { UFS } from "@/types/preCadastro";
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

export function DocumentosForm({ dados, onChange, codigoAtual, onRecuperarPreCadastro }: Props) {
  const [statusCpf, setStatusCpf] = useState<StatusCpf | null>(null);
  const { verificar, isVerificando } = useVerificarCpf();

  const handleChange = (field: keyof PreCadastro, value: string) => {
    onChange({ ...dados, [field]: value });
    // Limpar status quando CPF muda
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
        <h3 className="text-lg font-semibold text-primary">Documentos Pessoais</h3>
        <p className="text-sm text-muted-foreground">
          Informe os dados dos seus documentos pessoais.
        </p>
      </div>

      <div className="grid gap-4">
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

        {/* RG */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Documento de Identidade (RG)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rg">Número do RG *</Label>
              <Input
                id="rg"
                value={dados.rg || ""}
                onChange={(e) => handleChange("rg", e.target.value.toUpperCase())}
                placeholder="0000000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rg_data_emissao">Data de Emissão</Label>
              <Input
                id="rg_data_emissao"
                type="date"
                value={dados.rg_data_emissao || ""}
                onChange={(e) => handleChange("rg_data_emissao", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rg_orgao_expedidor">Órgão Expedidor</Label>
              <Input
                id="rg_orgao_expedidor"
                value={dados.rg_orgao_expedidor || ""}
                onChange={(e) => handleChange("rg_orgao_expedidor", e.target.value.toUpperCase())}
                placeholder="SSP, DETRAN, etc."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rg_uf">UF Expedidor</Label>
              <Select
                value={dados.rg_uf || ""}
                onValueChange={(value) => handleChange("rg_uf", value)}
              >
                <SelectTrigger id="rg_uf">
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
        </div>

        {/* Certidão */}
        <div className="grid gap-2">
          <Label htmlFor="certidao_tipo">Tipo de Certidão</Label>
          <Select
            value={dados.certidao_tipo || ""}
            onValueChange={(value) => handleChange("certidao_tipo", value)}
          >
            <SelectTrigger id="certidao_tipo">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nascimento">Certidão de Nascimento</SelectItem>
              <SelectItem value="casamento">Certidão de Casamento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Título de Eleitor */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Título de Eleitor</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo_eleitor">Número do Título</Label>
              <Input
                id="titulo_eleitor"
                value={dados.titulo_eleitor || ""}
                onChange={(e) => handleChange("titulo_eleitor", e.target.value)}
                placeholder="0000 0000 0000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="titulo_zona">Zona</Label>
              <Input
                id="titulo_zona"
                value={dados.titulo_zona || ""}
                onChange={(e) => handleChange("titulo_zona", e.target.value)}
                placeholder="000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="titulo_secao">Seção</Label>
              <Input
                id="titulo_secao"
                value={dados.titulo_secao || ""}
                onChange={(e) => handleChange("titulo_secao", e.target.value)}
                placeholder="0000"
              />
            </div>
          </div>
        </div>

        {/* Certificado de Reservista */}
        <div className="grid gap-2">
          <Label htmlFor="certificado_reservista">
            Certificado de Reservista (quando aplicável)
          </Label>
          <Input
            id="certificado_reservista"
            value={dados.certificado_reservista || ""}
            onChange={(e) => handleChange("certificado_reservista", e.target.value)}
            placeholder="Número do certificado"
          />
          <p className="text-xs text-muted-foreground">
            Obrigatório para homens entre 18 e 45 anos
          </p>
        </div>
      </div>
    </div>
  );
}
