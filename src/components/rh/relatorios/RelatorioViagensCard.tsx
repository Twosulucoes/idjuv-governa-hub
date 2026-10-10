import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";
import { toast } from "sonner";
import { VIAGEM_STATUS_LABELS } from "@/types/rh";
import { useViagensRelatorio, useNomeUnidadeSelecionada } from "@/hooks/useRelatoriosRH";
import { gerarRelatorioViagens } from "@/lib/pdfRelatoriosAfastamentos";
import {
  ONUS_LABELS,
  linhaViagemParaPlanilha,
  periodoValido,
  rotuloOnus,
  rotuloStatusViagem,
  somar,
  valorTotalViagem,
  periodoMesAtual,
} from "@/lib/relatoriosRHRegras";
import { formatCurrency } from "@/lib/pdfTemplate";
import { exportarParaExcel as exportarPlanilhaXlsx } from "@/export/exportExcel";
import { FiltroPeriodo } from "./FiltroPeriodo";
import { FiltroUnidade } from "./FiltroUnidade";
import { FiltroSelect } from "./FiltroSelect";
import { BotoesExportar, type FormatoExportacao } from "./BotoesExportar";
import { PreviaRegistros } from "./PreviaRegistros";

/** Viagens e diárias no período, por unidade, com totais de diárias e valor (PDF em paisagem). */
export function RelatorioViagensCard() {
  const [periodo, setPeriodo] = useState(periodoMesAtual);
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [tipoOnus, setTipoOnus] = useState<string | undefined>();
  const [gerando, setGerando] = useState<FormatoExportacao | null>(null);

  const filtros = { inicio: periodo.inicio, fim: periodo.fim, unidadeId, status, tipoOnus };
  const valido = periodoValido(periodo.inicio, periodo.fim);
  const { data: linhas = [], isLoading, isError } = useViagensRelatorio(filtros);
  const unidadeNome = useNomeUnidadeSelecionada(unidadeId);

  useEffect(() => {
    if (isError) toast.error("Não foi possível consultar as viagens do período.");
  }, [isError]);

  const handleExportar = async (formato: FormatoExportacao) => {
    if (linhas.length === 0) return;
    setGerando(formato);
    try {
      if (formato === "pdf") {
        await gerarRelatorioViagens(linhas, {
          inicio: periodo.inicio,
          fim: periodo.fim,
          unidadeNome,
          statusLabel: status ? rotuloStatusViagem(status) : undefined,
          onusLabel: tipoOnus ? rotuloOnus(tipoOnus) : undefined,
        });
      } else {
        exportarPlanilhaXlsx(linhas.map(linhaViagemParaPlanilha), "relatorio-viagens", "Viagens");
      }
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório de viagens:", error);
      toast.error("Erro ao gerar o relatório de viagens.");
    } finally {
      setGerando(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plane className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Viagens e Diárias</CardTitle>
            <CardDescription>Viagens no período, por unidade, com totais de diárias e valores</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FiltroPeriodo inicio={periodo.inicio} fim={periodo.fim} onChange={(inicio, fim) => setPeriodo({ inicio, fim })} />
        <FiltroUnidade unidadeId={unidadeId} onChange={setUnidadeId} />
        <div className="grid grid-cols-2 gap-3">
          <FiltroSelect label="Status" valor={status} opcoes={VIAGEM_STATUS_LABELS} onChange={setStatus} rotuloTodos="Todos" />
          <FiltroSelect label="Ônus" valor={tipoOnus} opcoes={ONUS_LABELS} onChange={setTipoOnus} rotuloTodos="Todos" />
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <PreviaRegistros
            filtrosInvalidos={!valido}
            carregando={isLoading}
            erro={isError}
            total={linhas.length}
            substantivo={["viagem", "viagens"]}
            detalhe={formatCurrency(somar(linhas, valorTotalViagem))}
          />
        </div>

        <BotoesExportar onExportar={handleExportar} gerando={gerando} desabilitado={!valido || isLoading || linhas.length === 0} />
      </CardContent>
    </Card>
  );
}
