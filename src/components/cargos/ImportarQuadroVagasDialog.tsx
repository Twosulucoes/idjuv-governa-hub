import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileDown, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useImportarQuadroVagas,
  type LinhaPlanilhaVagas,
  type RelatorioImportacaoVagas,
} from "@/hooks/useQuadroVagas";

interface ImportarQuadroVagasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Cabeçalho da planilha (sem acento, minúsculo, espaço vira _) → chave da RPC
const COLUNAS: Record<string, keyof LinhaPlanilhaVagas> = {
  cargo: "cargo",
  nome: "cargo",
  nome_do_cargo: "cargo",
  sigla: "sigla",
  simbolo: "sigla",
  categoria: "categoria",
  vencimento: "vencimento",
  vencimento_base: "vencimento",
  remuneracao: "vencimento",
  unidade: "unidade",
  setor: "unidade",
  lotacao: "unidade",
  quantidade: "quantidade",
  quantidade_de_vagas: "quantidade",
  vagas: "quantidade",
  qtd: "quantidade",
  codigo: "codigo",
  codigo_da_vaga: "codigo",
  lei: "lei_numero",
  lei_numero: "lei_numero",
  lei_de_criacao: "lei_numero",
  lei_data: "lei_data",
  data_da_lei: "lei_data",
};

const MODELO: Record<string, string | number>[] = [
  {
    cargo: "Diretor-Presidente",
    sigla: "CNE-1",
    categoria: "comissionado",
    vencimento: "15000,00",
    unidade: "PRESI",
    quantidade: 1,
    codigo: "",
    lei_numero: "1.234/2019",
    lei_data: "10/02/2019",
  },
  {
    cargo: "Assessor Técnico",
    sigla: "CDS-3",
    categoria: "comissionado",
    vencimento: "4500,00",
    unidade: "",
    quantidade: 4,
    codigo: "",
    lei_numero: "1.234/2019",
    lei_data: "10/02/2019",
  },
];

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const paraTexto = (valor: unknown): string => {
  if (valor instanceof Date) {
    // data da planilha (cellDates): AAAA-MM-DD sem deslocar o fuso
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, "0");
    const d = String(valor.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return valor == null ? "" : String(valor).trim();
};

type CampoTexto = Exclude<keyof LinhaPlanilhaVagas, "linha">;

async function lerPlanilha(arquivo: File): Promise<{ linhas: LinhaPlanilhaVagas[]; semCargo: number }> {
  const dados = await arquivo.arrayBuffer();
  // raw: o CSV chega como texto (sem o palpite americano de número e data: 15000,00 e 10/02/2019 ficam como estão);
  // a RPC interpreta no padrão brasileiro. No XLSX, data de verdade vem como Date (cellDates).
  const pasta = XLSX.read(dados, { type: "array", cellDates: true, raw: true });
  const aba = pasta.Sheets[pasta.SheetNames[0]];
  const brutas = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, { raw: true, defval: "" });
  let semCargo = 0;
  const linhas: LinhaPlanilhaVagas[] = [];
  for (const bruta of brutas) {
    const linha: Partial<LinhaPlanilhaVagas> = {};
    for (const [cabecalho, valor] of Object.entries(bruta)) {
      const chave = COLUNAS[normalizar(cabecalho)] as CampoTexto | undefined;
      const texto = paraTexto(valor);
      if (chave && texto) linha[chave] = texto;
    }
    if (!linha.cargo) {
      if (Object.keys(linha).length > 0) semCargo += 1;
      continue;
    }
    // __rowNum__ é a linha da planilha começando em 0 (o cabeçalho é a linha 1 do Excel)
    const indice = (bruta as { __rowNum__?: number }).__rowNum__;
    linhas.push({ ...(linha as LinhaPlanilhaVagas), linha: typeof indice === "number" ? indice + 1 : undefined });
  }
  return { linhas, semCargo };
}

function baixarModelo() {
  const planilha = XLSX.utils.json_to_sheet(MODELO);
  const pasta = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(pasta, planilha, "Quadro de vagas");
  XLSX.writeFile(pasta, "modelo_quadro_vagas.xlsx");
}

export function ImportarQuadroVagasDialog({ open, onOpenChange }: ImportarQuadroVagasDialogProps) {
  const entrada = useRef<HTMLInputElement>(null);
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaPlanilhaVagas[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioImportacaoVagas | null>(null);
  const importar = useImportarQuadroVagas();

  const limpar = () => {
    setArquivoNome(null);
    setLinhas([]);
    setRelatorio(null);
    importar.reset();
  };

  const fechar = (aberto: boolean) => {
    if (!aberto) limpar();
    onOpenChange(aberto);
  };

  const aoEscolherArquivo = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 5 MB).");
      return;
    }
    setRelatorio(null);
    setLinhas([]);
    try {
      const { linhas: lidas, semCargo } = await lerPlanilha(arquivo);
      if (lidas.length === 0) {
        toast.error('Nenhuma linha com a coluna "cargo" preenchida. Use o modelo.');
        return;
      }
      if (semCargo > 0) {
        toast.warning(`${semCargo} linha(s) sem a coluna "cargo" foram ignoradas.`);
      }
      setArquivoNome(arquivo.name);
      setLinhas(lidas);
      // primeiro sempre simula: nada é gravado até a confirmação
      setRelatorio(await importar.mutateAsync({ linhas: lidas, gravar: false }));
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível ler a planilha (XLSX, XLS ou CSV).");
    }
  };

  const gravar = async () => {
    try {
      const resultado = await importar.mutateAsync({ linhas, gravar: true });
      setRelatorio(resultado);
      if (resultado.gravado) {
        toast.success(`Quadro importado: ${resultado.vagas_criadas} vaga(s) nova(s).`);
        fechar(false);
      } else {
        toast.error("A importação não foi gravada: corrija os erros listados.");
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao gravar a importação.");
    }
  };

  const temErros = (relatorio?.erros.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar quadro de vagas</DialogTitle>
          <DialogDescription>
            Uma linha por cargo com a quantidade de vagas, ou uma linha por vaga com o código. Reimportar não duplica:
            cargos e códigos que já existem são reaproveitados e nenhuma vaga é apagada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={baixarModelo}>
              <FileDown className="h-4 w-4" aria-hidden="true" />
              Baixar modelo
            </Button>
            <Button onClick={() => entrada.current?.click()} disabled={importar.isPending}>
              {importar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              Escolher planilha
            </Button>
            <input
              ref={entrada}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              aria-label="Planilha do quadro de vagas"
              onChange={aoEscolherArquivo}
            />
          </div>

          <p className="text-body text-muted-foreground">
            Colunas: <strong>cargo</strong>, sigla, categoria (efetivo, comissionado, funcao_gratificada, temporario ou
            estagiario; obrigatória para cargo novo), vencimento, unidade (sigla), quantidade <em>ou</em> codigo,
            lei_numero e lei_data. Sem código, as vagas recebem <code>SIGLA.001</code>, <code>SIGLA.002</code>…
          </p>

          {relatorio && (
            <section aria-live="polite" className="space-y-3">
              <h3 className="font-medium">
                {arquivoNome}: {relatorio.linhas} linha(s) {relatorio.gravado ? "gravadas" : "simuladas"}
              </h3>
              <ul className="grid grid-cols-2 gap-2 text-body sm:grid-cols-3">
                <li>Cargos novos: <strong>{relatorio.cargos_criados}</strong></li>
                <li>Cargos já cadastrados: <strong>{relatorio.cargos_existentes}</strong></li>
                <li>Vagas novas: <strong>{relatorio.vagas_criadas}</strong></li>
                <li>Vagas que já existiam: <strong>{relatorio.vagas_existentes}</strong></li>
                <li>Ocupantes ligados a vagas: <strong>{relatorio.ocupantes_vinculados}</strong></li>
              </ul>

              {temErros && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertTitle>Corrija a planilha: nada será gravado enquanto houver erro</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {relatorio.erros.map((e, i) => (
                        <li key={i}>Linha {e.linha}: {e.erro}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {relatorio.avisos.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertTitle>Avisos</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {relatorio.avisos.map((a, i) => (
                        <li key={i}>{a.linha ? `Linha ${a.linha}: ` : ""}{a.aviso}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {!temErros && !relatorio.gravado && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <AlertTitle>Simulação sem erros</AlertTitle>
                  <AlertDescription>Confira os números acima e grave para confirmar.</AlertDescription>
                </Alert>
              )}
            </section>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => fechar(false)}>
            Cancelar
          </Button>
          <Button onClick={gravar} disabled={!relatorio || temErros || relatorio.gravado || importar.isPending}>
            {importar.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Gravar importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
