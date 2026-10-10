import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { useLicencasRelatorio, useNomeUnidadeSelecionada } from "@/hooks/useRelatoriosRH";
import { gerarRelatorioLicencas } from "@/lib/pdfRelatoriosAfastamentos";
import { LICENCA_STATUS_LABELS } from "@/types/rh";
import {
  diasLicenca,
  linhaLicencaParaPlanilha,
  periodoValido,
  rotuloStatusLicenca,
  somar,
  periodoMesAtual,
} from "@/lib/relatoriosRHRegras";
import { exportarParaExcel as exportarPlanilhaXlsx } from "@/export/exportExcel";
import { FiltroPeriodo } from "./FiltroPeriodo";
import { FiltroUnidade } from "./FiltroUnidade";
import { FiltroSelect } from "./FiltroSelect";
import { BotoesExportar, type FormatoExportacao } from "./BotoesExportar";
import { PreviaRegistros } from "./PreviaRegistros";

const rotuloDias = (n: number) => `${n} dia${n === 1 ? "" : "s"}`;

/** Licenças e afastamentos vigentes no período, agrupados por tipo. Sem dados de saúde (LGPD). */
export function RelatorioLicencasCard() {
  const [periodo, setPeriodo] = useState(periodoMesAtual);
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [gerando, setGerando] = useState<FormatoExportacao | null>(null);

  const filtros = { inicio: periodo.inicio, fim: periodo.fim, unidadeId, status };
  const valido = periodoValido(periodo.inicio, periodo.fim);
  const { data: linhas = [], isLoading, isError } = useLicencasRelatorio(filtros);
  const unidadeNome = useNomeUnidadeSelecionada(unidadeId);

  const handleExportar = async (formato: FormatoExportacao) => {
    if (linhas.length === 0) return;
    setGerando(formato);
    try {
      if (formato === "pdf") {
        await gerarRelatorioLicencas(linhas, {
          inicio: periodo.inicio,
          fim: periodo.fim,
          unidadeNome,
          statusLabel: status ? rotuloStatusLicenca(status) : undefined,
        });
      } else {
        exportarPlanilhaXlsx(linhas.map((l) => linhaLicencaParaPlanilha(l, periodo.fim)), "relatorio-licencas", "Licenças");
      }
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório de licenças:", error);
      toast.error("Erro ao gerar o relatório de licenças.");
    } finally {
      setGerando(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HeartPulse className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Licenças e Afastamentos</CardTitle>
            <CardDescription>Afastamentos vigentes no período, por tipo, com subtotal de dias</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FiltroPeriodo inicio={periodo.inicio} fim={periodo.fim} onChange={(inicio, fim) => setPeriodo({ inicio, fim })} />
        <FiltroUnidade unidadeId={unidadeId} onChange={setUnidadeId} />
        <FiltroSelect label="Status" valor={status} opcoes={LICENCA_STATUS_LABELS} onChange={setStatus} rotuloTodos="Todos os status" />

        <div className="p-3 bg-muted/50 rounded-lg">
          <PreviaRegistros
            filtrosInvalidos={!valido}
            carregando={isLoading}
            erro={isError}
            total={linhas.length}
            detalhe={rotuloDias(somar(linhas, (l) => diasLicenca(l, periodo.fim)))}
          />
        </div>

        <BotoesExportar onExportar={handleExportar} gerando={gerando} desabilitado={!valido || isLoading || linhas.length === 0} />
      </CardContent>
    </Card>
  );
}
