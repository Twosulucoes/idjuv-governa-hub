import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { LinhaPendenciaServidor } from '@/lib/documentos/modelos/rh/pendenciasServidores';

interface PendenciaItem {
  tipo: "elegibilidade" | "esocial" | "bancaria" | "pessoal";
  campo: string;
  descricao: string;
  obrigatorio: boolean;
}

interface ServidorCompleto {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula: string | null;
  situacao: string;
  tipo_servidor: string | null;
  cargo_nome: string | null;
  unidade_nome: string | null;
}

interface ServidorComPendencias {
  servidor: ServidorCompleto;
  pendencias: PendenciaItem[];
  temPendenciaElegibilidade: boolean;
  temPendenciaEsocial: boolean;
  temPendenciaBancaria: boolean;
  temPendenciaPessoal: boolean;
}

interface StatsData {
  total: number;
  comPendenciaElegibilidade: number;
  comPendenciaEsocial: number;
  comPendenciaBancaria: number;
  comPendenciaPessoal: number;
  completos: number;
  elegiveis: number;
}

function formatCPF(cpf: string): string {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/** Relatório de pendências de servidores, pelo motor único (`rh-pendencias-servidores`). */
export async function gerarPdfRelatorioPendenciasServidores(
  analise: ServidorComPendencias[],
  stats: StatsData,
  filtroAtivo?: string
): Promise<void> {
  const linhasDo = (tipo: PendenciaItem["tipo"], filtro: (a: ServidorComPendencias) => boolean): LinhaPendenciaServidor[] =>
    analise.filter(filtro).map((a) => ({
      nome: a.servidor.nome_completo,
      matricula: a.servidor.matricula,
      cpf: formatCPF(a.servidor.cpf),
      camposPendentes: a.pendencias.filter((p) => p.tipo === tipo).map((p) => p.descricao).join(", "),
    }));

  const d = await emitirDocumento('rh-pendencias-servidores', {
    filtro: filtroAtivo,
    resumo: {
      total: stats.total,
      elegibilidade: stats.comPendenciaElegibilidade,
      esocial: stats.comPendenciaEsocial,
      bancaria: stats.comPendenciaBancaria,
      pessoal: stats.comPendenciaPessoal,
      completos: stats.completos,
      elegiveis: stats.elegiveis,
    },
    elegibilidade: linhasDo("elegibilidade", (a) => a.temPendenciaElegibilidade),
    esocial: linhasDo("esocial", (a) => a.temPendenciaEsocial),
    bancaria: linhasDo("bancaria", (a) => a.temPendenciaBancaria),
    pessoal: linhasDo("pessoal", (a) => a.temPendenciaPessoal),
    completos: analise
      .filter((a) => !a.temPendenciaElegibilidade && !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal)
      .map((a) => ({
        nome: a.servidor.nome_completo,
        matricula: a.servidor.matricula,
        cpf: formatCPF(a.servidor.cpf),
        cargo: a.servidor.cargo_nome,
      })),
  });
  baixarDocumento(d);
}
