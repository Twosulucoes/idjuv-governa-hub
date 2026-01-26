import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PreCadastro } from "@/types/preCadastro";
import { UFS, CATEGORIAS_RESERVA } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

export function DocumentosForm({ dados, onChange }: Props) {
  const handleChange = (field: keyof PreCadastro, value: string) => {
    onChange({ ...dados, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Documentos Pessoais</h3>
        <p className="text-sm text-muted-foreground">
          Informe os dados dos seus documentos pessoais.
        </p>
      </div>

      <div className="grid gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo_cidade_votacao">Cidade de Votação</Label>
              <Input
                id="titulo_cidade_votacao"
                value={dados.titulo_cidade_votacao || ""}
                onChange={(e) => handleChange("titulo_cidade_votacao", e.target.value.toUpperCase())}
                placeholder="Cidade"
                className="uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="titulo_uf_votacao">UF de Votação</Label>
              <Select
                value={dados.titulo_uf_votacao || ""}
                onValueChange={(value) => handleChange("titulo_uf_votacao", value)}
              >
                <SelectTrigger id="titulo_uf_votacao">
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

            <div className="grid gap-2">
              <Label htmlFor="titulo_data_emissao">Data de Emissão</Label>
              <Input
                id="titulo_data_emissao"
                type="date"
                value={dados.titulo_data_emissao || ""}
                onChange={(e) => handleChange("titulo_data_emissao", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Certificado de Reservista */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Certificado de Reservista</h4>
          <p className="text-xs text-muted-foreground">
            Obrigatório para homens entre 18 e 45 anos
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="certificado_reservista">Número</Label>
              <Input
                id="certificado_reservista"
                value={dados.certificado_reservista || ""}
                onChange={(e) => handleChange("certificado_reservista", e.target.value)}
                placeholder="Número do certificado"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reservista_orgao">Órgão/UF</Label>
              <Input
                id="reservista_orgao"
                value={dados.reservista_orgao || ""}
                onChange={(e) => handleChange("reservista_orgao", e.target.value.toUpperCase())}
                placeholder="Órgão expedidor"
                className="uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reservista_data_emissao">Data de Expedição</Label>
              <Input
                id="reservista_data_emissao"
                type="date"
                value={dados.reservista_data_emissao || ""}
                onChange={(e) => handleChange("reservista_data_emissao", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reservista_categoria">Categoria da Reserva</Label>
              <Select
                value={dados.reservista_categoria || ""}
                onValueChange={(value) => handleChange("reservista_categoria", value)}
              >
                <SelectTrigger id="reservista_categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_RESERVA.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reservista_ano">Ano de Reserva</Label>
              <Input
                id="reservista_ano"
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={dados.reservista_ano || ""}
                onChange={(e) => handleChange("reservista_ano", e.target.value)}
                placeholder="Ano"
              />
            </div>
          </div>
        </div>

        {/* CTPS */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Carteira de Trabalho (CTPS)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ctps_numero">Número</Label>
              <Input
                id="ctps_numero"
                value={dados.ctps_numero || ""}
                onChange={(e) => handleChange("ctps_numero", e.target.value)}
                placeholder="Número da CTPS"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ctps_serie">Série</Label>
              <Input
                id="ctps_serie"
                value={dados.ctps_serie || ""}
                onChange={(e) => handleChange("ctps_serie", e.target.value)}
                placeholder="Série"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ctps_uf">UF</Label>
              <Select
                value={dados.ctps_uf || ""}
                onValueChange={(value) => handleChange("ctps_uf", value)}
              >
                <SelectTrigger id="ctps_uf">
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

            <div className="grid gap-2">
              <Label htmlFor="ctps_data_emissao">Data de Expedição</Label>
              <Input
                id="ctps_data_emissao"
                type="date"
                value={dados.ctps_data_emissao || ""}
                onChange={(e) => handleChange("ctps_data_emissao", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
