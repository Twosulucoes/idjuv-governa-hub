import { useEffect, useId, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { useFrequenciaResumo } from "@/hooks/useFrequencia";
import { useNomeUnidadeSelecionada } from "@/hooks/useRelatoriosRH";
import { generateRelatorioFrequenciaGeral, type FrequenciaServidor } from "@/lib/pdfRelatorioFrequencia";
import { linhaFrequenciaParaPlanilha } from "@/lib/relatoriosRHRegras";
import { exportarParaExcel as exportarPlanilhaXlsx } from "@/export/exportExcel";
import { FiltroCompetencia } from "./FiltroCompetencia";
import { FiltroUnidade } from "./FiltroUnidade";
import { BotoesExportar, type FormatoExportacao } from "./BotoesExportar";
import { PreviaRegistros } from "./PreviaRegistros";

/**
 * Frequência consolidada da competência (servidores ativos — limitação de `useFrequenciaResumo`),
 * com filtro de unidade no cliente e agrupamento opcional por unidade no PDF.
 */
export function RelatorioFrequenciaCard() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [unidadeId, setUnidadeId] = useState<string | undefined>();
  const [agruparPorUnidade, setAgruparPorUnidade] = useState(true);
  const [gerando, setGerando] = useState<FormatoExportacao | null>(null);
  const idAgrupar = useId();

  const { data: resumo = [], isLoading, isError } = useFrequenciaResumo(ano, mes);
  const unidadeNome = useNomeUnidadeSelecionada(unidadeId);

  // Filtro de unidade no cliente (o hook compartilhado não filtra) e remoção do CPF (LGPD).
  const servidores: FrequenciaServidor[] = useMemo(
    () =>
      resumo
        .filter((s) => !unidadeId || s.servidor_unidade_id === unidadeId)
        .map(({ servidor_cpf: _cpf, servidor_unidade_id: _uid, ...resto }) => resto),
    [resumo, unidadeId],
  );

  useEffect(() => {
    if (isError) toast.error("Não foi possível consultar a frequência da competência.");
  }, [isError]);

  const competencia = `${String(mes).padStart(2, "0")}/${ano}`;

  const handleExportar = async (formato: FormatoExportacao) => {
    if (servidores.length === 0) return;
    setGerando(formato);
    try {
      if (formato === "pdf") {
        await generateRelatorioFrequenciaGeral({
          competencia,
          servidores,
          dataGeracao: hoje.toLocaleDateString("pt-BR"),
          filtroUnidade: unidadeNome,
          agruparPorUnidade,
        });
      } else {
        exportarPlanilhaXlsx(
          servidores.map((s) => linhaFrequenciaParaPlanilha(s)),
          `relatorio-frequencia-${ano}-${String(mes).padStart(2, "0")}`,
          "Frequência",
        );
      }
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório de frequência:", error);
      toast.error("Erro ao gerar o relatório de frequência.");
    } finally {
      setGerando(null);
    }
  };

  const totalFaltas = servidores.reduce((acc, s) => acc + s.faltas, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Frequência</CardTitle>
            <CardDescription>Consolidado mensal de presença dos servidores ativos</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FiltroCompetencia ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
        <FiltroUnidade unidadeId={unidadeId} onChange={setUnidadeId} />

        <div className="flex items-center space-x-2">
          <Checkbox id={idAgrupar} checked={agruparPorUnidade} onCheckedChange={(c) => setAgruparPorUnidade(c === true)} />
          <Label htmlFor={idAgrupar} className="text-sm font-normal cursor-pointer">
            Agrupar por unidade no PDF
          </Label>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <PreviaRegistros
            carregando={isLoading}
            erro={isError}
            total={servidores.length}
            substantivo={["servidor", "servidores"]}
            detalhe={`${totalFaltas} falta${totalFaltas === 1 ? "" : "s"}`}
          />
        </div>

        <BotoesExportar onExportar={handleExportar} gerando={gerando} desabilitado={isLoading || servidores.length === 0} />
      </CardContent>
    </Card>
  );
}
