import { formatCPF } from "@/lib/formatters";
import type { PreCadastro } from "@/types/preCadastro";
import { baixarDocumento, emitirDocumento } from "@/lib/documentos";
import type { LinhaPendenciaPreCadastro } from "@/lib/documentos/modelos/rh/pendenciasPreCadastros";

interface PendenciaItem {
  tipo: "esocial" | "bancaria" | "pessoal" | "opcional";
  campo: string;
  descricao: string;
  obrigatorio: boolean;
}

interface PreCadastroComPendencias {
  preCadastro: PreCadastro;
  pendencias: PendenciaItem[];
  temPendenciaEsocial: boolean;
  temPendenciaBancaria: boolean;
  temPendenciaPessoal: boolean;
  temPendenciaOpcional: boolean;
}

interface StatsData {
  total: number;
  comPendenciaEsocial: number;
  comPendenciaBancaria: number;
  comPendenciaPessoal: number;
  comPendenciaOpcional: number;
  completos: number;
}

/** Relatório de pendências de pré-cadastros, pelo motor único (`rh-pendencias-pre-cadastros`). */
export async function gerarPdfRelatorioPendencias(
  analise: PreCadastroComPendencias[],
  stats: StatsData,
  filtroAtivo?: string
): Promise<void> {
  const linhasDo = (tipo: PendenciaItem["tipo"], filtro: (a: PreCadastroComPendencias) => boolean): LinhaPendenciaPreCadastro[] =>
    analise.filter(filtro).map((a) => ({
      nome: a.preCadastro.nome_completo,
      cpf: a.preCadastro.cpf ? formatCPF(a.preCadastro.cpf) : "",
      status: a.preCadastro.status === "aprovado" ? "Aprovado" : "Enviado",
      camposPendentes: a.pendencias.filter((p) => p.tipo === tipo).map((p) => p.descricao).join(", "),
    }));

  const d = await emitirDocumento("rh-pendencias-pre-cadastros", {
    filtro: filtroAtivo,
    resumo: {
      total: stats.total,
      esocial: stats.comPendenciaEsocial,
      bancaria: stats.comPendenciaBancaria,
      pessoal: stats.comPendenciaPessoal,
      completos: stats.completos,
    },
    esocial: linhasDo("esocial", (a) => a.temPendenciaEsocial),
    bancaria: linhasDo("bancaria", (a) => a.temPendenciaBancaria),
    pessoal: linhasDo("pessoal", (a) => a.temPendenciaPessoal),
    completos: analise
      .filter((a) => !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal)
      .map((a) => ({ nome: a.preCadastro.nome_completo, cpf: a.preCadastro.cpf ? formatCPF(a.preCadastro.cpf) : "" })),
  });
  baixarDocumento(d);
}
