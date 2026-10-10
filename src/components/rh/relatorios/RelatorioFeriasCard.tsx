import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { FERIAS_STATUS_LABELS } from "@/types/rh";
import { useFeriasRelatorio, useNomeUnidadeSelecionada } from "@/hooks/useRelatoriosRH";
import { gerarRelatorioFerias } from "@/lib/pdfRelatoriosAfastamentos";
import { linhaFeriasParaPlanilha, periodoValido, rotuloStatusFerias, somar, periodoMesAtual } from "@/lib/relatoriosRHRegras";
import { exportarParaExcel as exportarPlanilhaXlsx } from "@/export/exportExcel";
import { FiltroPeriodo } from "./FiltroPeriodo";
import { FiltroUnidade } from "./FiltroUnidade";
import { FiltroSelect } from "./FiltroSelect";
import { BotoesExportar, type FormatoExportacao } from "./BotoesExportar";
import { PreviaRegistros } from "./PreviaRegistros";

/** Férias que cruzam o período, agrupadas por unidade, em PDF ou XLSX. */
export function RelatorioFeriasCard() {
  const [periodo, setPeriodo] = useState(periodoMesAtual);
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [gerando, setGerando] = useState<FormatoExportacao | null>(null);

  const filtros = { inicio: periodo.inicio, fim: periodo.fim, unidadeId, status };
  const valido = periodoValido(periodo.inicio, periodo.fim);
  const { data: linhas = [], isLoading, isError } = useFeriasRelatorio(filtros);
  const unidadeNome = useNomeUnidadeSelecionada(unidadeId);

  useEffect(() => {
    if (isError) toast.error("Não foi possível consultar as férias do período.");
  }, [isError]);

  const handleExportar = async (formato: FormatoExportacao) => {
    if (linhas.length === 0) return;
    setGerando(formato);
    try {
      if (formato === "pdf") {
        await gerarRelatorioFerias(linhas, {
          inicio: periodo.inicio,
          fim: periodo.fim,
          unidadeNome,
          statusLabel: status ? rotuloStatusFerias(status) : undefined,
        });
      } else {
        exportarPlanilhaXlsx(linhas.map(linhaFeriasParaPlanilha), "relatorio-ferias", "Férias");
      }
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório de férias:", error);
      toast.error("Erro ao gerar o relatório de férias.");
    } finally {
      setGerando(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Férias</CardTitle>
            <CardDescription>Servidores em férias no período, por unidade, com subtotal de dias</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FiltroPeriodo inicio={periodo.inicio} fim={periodo.fim} onChange={(inicio, fim) => setPeriodo({ inicio, fim })} />
        <FiltroUnidade unidadeId={unidadeId} onChange={setUnidadeId} />
        <FiltroSelect label="Status" valor={status} opcoes={FERIAS_STATUS_LABELS} onChange={setStatus} rotuloTodos="Todos os status" />

        <div className="p-3 bg-muted/50 rounded-lg">
          <PreviaRegistros
            filtrosInvalidos={!valido}
            carregando={isLoading}
            erro={isError}
            total={linhas.length}
            detalhe={`${somar(linhas, (l) => l.dias_gozados)} dias`}
          />
        </div>

        <BotoesExportar onExportar={handleExportar} gerando={gerando} desabilitado={!valido || isLoading || linhas.length === 0} />
      </CardContent>
    </Card>
  );
}
