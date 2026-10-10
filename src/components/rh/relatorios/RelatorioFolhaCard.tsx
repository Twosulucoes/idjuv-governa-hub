import { useId, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { useFolhasDoAno, useFichasDaFolhaAgregadas, useItensDaFolha } from "@/hooks/useRelatoriosRH";
import { gerarResumoFolhasAno, gerarFolhaPorUnidade, gerarFolhaPorRubrica } from "@/lib/pdfRelatoriosFolha";
import {
  agregarFichasPorUnidade,
  agregarItensPorRubrica,
  contarRubricas,
  descreverFolha,
  folhaPermiteDetalhe,
  linhaFolhaParaPlanilha,
  linhaUnidadeParaPlanilha,
  linhasRubricasParaPlanilha,
  totalizarFolhas,
  totalizarUnidades,
  liquidoBlocos,
} from "@/lib/relatoriosFolhaRegras";
import { formatCurrency } from "@/lib/pdfTemplate";
import { exportarParaExcel as exportarPlanilhaXlsx } from "@/export/exportExcel";
import { FiltroAno } from "./FiltroAno";
import { BotoesExportar, type FormatoExportacao } from "./BotoesExportar";
import { PreviaRegistros } from "./PreviaRegistros";

type TipoRelatorioFolha = "resumo" | "unidade" | "rubrica";

const TIPOS_RELATORIO: Array<{ valor: TipoRelatorioFolha; rotulo: string }> = [
  { valor: "resumo", rotulo: "Resumo do ano (por folha)" },
  { valor: "unidade", rotulo: "Folha por unidade" },
  { valor: "rubrica", rotulo: "Folha por rubrica" },
];

/**
 * Folha de pagamento em agregados: resumo do ano, uma folha por unidade ou por rubrica.
 * Sem dado nominal de servidor (LGPD); o relatório nominal fica fora até decisão do usuário.
 */
export function RelatorioFolhaCard() {
  const id = useId();
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [tipo, setTipo] = useState<TipoRelatorioFolha>("resumo");
  const [folhaId, setFolhaId] = useState<string | undefined>();
  const [gerando, setGerando] = useState<FormatoExportacao | null>(null);

  const folhasQuery = useFolhasDoAno(ano);
  const folhas = useMemo(() => folhasQuery.data ?? [], [folhasQuery.data]);
  const detalhe = tipo !== "resumo";

  // Só folhas já processadas podem ser detalhadas; a seleção some se o ano mudar.
  const folhasDetalhaveis = useMemo(() => folhas.filter((f) => folhaPermiteDetalhe(f.status, f.quantidade_servidores)), [folhas]);
  const folhaSelecionada = folhasDetalhaveis.find((f) => f.id === folhaId);
  const folhaAtiva = detalhe ? folhaSelecionada?.id : undefined;

  const fichasQuery = useFichasDaFolhaAgregadas(tipo === "unidade" ? folhaAtiva : undefined);
  const itensQuery = useItensDaFolha(tipo === "rubrica" ? folhaAtiva : undefined);

  const agregadosUnidade = useMemo(() => agregarFichasPorUnidade(fichasQuery.data ?? []), [fichasQuery.data]);
  const blocosRubrica = useMemo(() => agregarItensPorRubrica(itensQuery.data ?? []), [itensQuery.data]);

  const consulta = tipo === "resumo" ? folhasQuery : tipo === "unidade" ? fichasQuery : itensQuery;
  const total = tipo === "resumo" ? folhas.length : tipo === "unidade" ? agregadosUnidade.length : contarRubricas(blocosRubrica);
  const substantivo: [string, string] =
    tipo === "resumo" ? ["folha", "folhas"] : tipo === "unidade" ? ["unidade", "unidades"] : ["rubrica", "rubricas"];
  const liquido =
    tipo === "resumo"
      ? totalizarFolhas(folhas.filter((f) => folhaPermiteDetalhe(f.status))).liquido
      : tipo === "unidade"
        ? totalizarUnidades(agregadosUnidade).liquido
        : liquidoBlocos(blocosRubrica);

  const aguardandoFolha = detalhe && !folhaSelecionada;
  const bloqueado = aguardandoFolha || consulta.isLoading || consulta.isError || total === 0;

  const handleExportar = async (formato: FormatoExportacao) => {
    if (bloqueado) return;
    setGerando(formato);
    try {
      if (tipo === "resumo") {
        if (formato === "pdf") await gerarResumoFolhasAno(folhas, ano);
        else exportarPlanilhaXlsx(folhas.map(linhaFolhaParaPlanilha), `relatorio-folha-resumo-${ano}`, "Folhas");
      } else if (tipo === "unidade" && folhaSelecionada) {
        if (formato === "pdf") await gerarFolhaPorUnidade(agregadosUnidade, folhaSelecionada);
        else exportarPlanilhaXlsx(agregadosUnidade.map(linhaUnidadeParaPlanilha), "relatorio-folha-unidade", "Por unidade");
      } else if (tipo === "rubrica" && folhaSelecionada) {
        if (formato === "pdf") await gerarFolhaPorRubrica(blocosRubrica, folhaSelecionada);
        else exportarPlanilhaXlsx(linhasRubricasParaPlanilha(blocosRubrica), "relatorio-folha-rubrica", "Por rubrica");
      }
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório de folha:", error);
      toast.error("Erro ao gerar o relatório de folha.");
    } finally {
      setGerando(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Folha de Pagamento</CardTitle>
            <CardDescription>Resumo do ano, por unidade ou por rubrica — só valores agregados, sem dados nominais</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FiltroAno ano={ano} onChange={setAno} />
          <div className="space-y-1">
            <Label htmlFor={`${id}-tipo`}>Relatório</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRelatorioFolha)}>
              <SelectTrigger id={`${id}-tipo`}>
                <SelectValue placeholder="Relatório" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_RELATORIO.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {detalhe && (
          <div className="space-y-1">
            <Label htmlFor={`${id}-folha`}>Folha</Label>
            <Select
              value={folhaSelecionada?.id ?? ""}
              onValueChange={setFolhaId}
              disabled={folhasQuery.isLoading || folhasDetalhaveis.length === 0}
            >
              <SelectTrigger id={`${id}-folha`}>
                <SelectValue placeholder={folhasDetalhaveis.length === 0 ? "Nenhuma folha processada no ano" : "Selecione a folha"} />
              </SelectTrigger>
              <SelectContent>
                {folhasDetalhaveis.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {descreverFolha(f)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Só folhas abertas (processadas), fechadas ou reabertas, com fichas, podem ser detalhadas.</p>
          </div>
        )}

        <div className="p-3 bg-muted/50 rounded-lg">
          {aguardandoFolha ? (
            <p className="text-sm text-muted-foreground">Selecione uma folha para consultar.</p>
          ) : (
            <PreviaRegistros
              carregando={consulta.isLoading}
              erro={consulta.isError}
              total={total}
              substantivo={substantivo}
              detalhe={<>líquido {formatCurrency(liquido)}</>}
              tituloVazio={tipo === "resumo" ? "Nenhuma folha no ano" : "Folha sem fichas processadas"}
              descricaoVazio={tipo === "resumo" ? "Escolha outro ano." : "Processe a folha ou escolha outra."}
            />
          )}
        </div>

        <BotoesExportar onExportar={handleExportar} gerando={gerando} desabilitado={bloqueado} />
      </CardContent>
    </Card>
  );
}
