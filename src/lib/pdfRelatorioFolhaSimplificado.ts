import { baixarDocumento, emitirDocumento } from '@/lib/documentos';

// ================================================================
// RELATÓRIO SIMPLIFICADO DE FOLHA — pelo motor único (`relatorios-folha-simplificada`)
// Campos: Nº, NOME COMPLETO, CPF, CARGO, CÓDIGO, VALORES
// ================================================================

interface DadosServidor {
  numero?: number;
  nome_completo?: string;
  cpf?: string;
  cargo_nome?: string;
  cargo_sigla?: string;
  matricula?: string;
  vencimento_base?: number;
  valor_total?: number;
  [key: string]: unknown;
}

interface ConfigRelatorioFolha {
  titulo?: string;
  subtitulo?: string;
  mesReferencia?: string;
  /** Sem efeito: os logos são do cabeçalho padrão do motor. Mantido pela assinatura da tela. */
  incluirLogos?: boolean;
}

function formatarCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return cpf;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

export async function gerarRelatorioFolhaSimplificado(
  dados: DadosServidor[],
  config: ConfigRelatorioFolha = {}
): Promise<void> {
  const d = await emitirDocumento('relatorios-folha-simplificada', {
    titulo: config.titulo,
    subtitulo: config.subtitulo,
    mesReferencia: config.mesReferencia,
    linhas: dados.map((s) => ({
      nome: s.nome_completo,
      cpf: formatarCPF(s.cpf),
      cargo: s.cargo_nome,
      codigo: s.cargo_sigla || s.matricula,
      valor: s.valor_total ?? s.vencimento_base ?? 0,
    })),
  });
  baixarDocumento(d);
}
