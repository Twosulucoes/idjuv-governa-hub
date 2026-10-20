import { getTenantSnapshot } from '@/core/tenant';
import { baixarDocumento, emitirDocumento, localDaSede } from '@/lib/documentos';
import type { DadosRelatorioCargosVagas } from '@/lib/documentos/modelos/cargos/cargosVagas';
import type { DependenteFicha, ServidorFichaCadastral } from '@/lib/documentos/modelos/rh/fichaCadastral';

// Formulários administrativos (termo de demanda, ordem de missão, relatório de viagem, requisição de material,
// termo de responsabilidade) migraram para o motor único: `src/lib/formulariosAdministrativos.ts`.

// ============================================================
// RELATÓRIO DE CARGOS E VAGAS (motor único: modelo `cargos-relatorio-cargos-vagas`)
// ============================================================

/** Gera e baixa o relatório de cargos e vagas (GestaoCargosPage). */
export const generateRelatorioCargos = async (data: DadosRelatorioCargosVagas): Promise<void> => {
  baixarDocumento(await emitirDocumento('cargos-relatorio-cargos-vagas', data));
};

// ============================================================
// RELATÓRIO ANUAL DE GOVERNANÇA (motor único: modelo `governanca-relatorio-anual`)
// ============================================================

/** Gera e baixa o relatório anual de governança e integridade (RelatorioGovernancaPage). Números fixos, como no original. */
export const generateRelatorioGovernancaPDF = async (): Promise<void> => {
  const sigla = getTenantSnapshot().identidade.sigla?.trim() || 'órgão';
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const conformidade = [72, 75, 78, 80, 82, 85, 84, 86, 87, 87, 88, 87];
  const d = await emitirDocumento('governanca-relatorio-anual', {
    exercicio: '2025',
    indicadores: [
      { titulo: 'Conformidade', valor: '87%', meta: '90%' },
      { titulo: 'Processos', valor: '24', meta: '30' },
      { titulo: 'Capacitações', valor: '156', meta: '200' },
      { titulo: 'Riscos mitigados', valor: '18', meta: '22' },
    ],
    conformidadeMensal: meses.map((mes, i) => ({ mes, valor: conformidade[i] })),
    processosPorArea: [
      { area: 'Compras', quantidade: 8 },
      { area: 'RH', quantidade: 5 },
      { area: 'Patrimônio', quantidade: 4 },
      { area: 'Financeiro', quantidade: 4 },
      { area: 'Almoxarifado', quantidade: 3 },
    ],
    riscos: [
      { nivel: 'Baixo', quantidade: 12 },
      { nivel: 'Médio', quantidade: 8 },
      { nivel: 'Alto', quantidade: 4 },
      { nivel: 'Crítico', quantidade: 1 },
    ],
    acoes: [
      { titulo: 'Treinamento em Ética', situacao: 'Concluído' },
      { titulo: 'Código de Conduta', situacao: 'Concluído' },
      { titulo: 'Mapeamento de Riscos', situacao: 'Em andamento' },
      { titulo: 'Canal de Denúncias', situacao: 'Concluído' },
      { titulo: 'Auditoria Interna', situacao: 'Em andamento' },
    ],
    resumoExecutivo: [
      `O ${sigla} alcançou 87% de conformidade em 2025, superando o resultado de 2024.`,
      'Foram mapeados 24 processos administrativos e 156 servidores capacitados.',
      'O Canal de Denúncias está operacional com garantia de anonimato.',
      'A Matriz de Riscos institucional foi aprovada e publicada.',
    ],
    anoMetas: '2026',
    metas: [
      'Atingir 95% de conformidade nos processos críticos',
      'Mapear 100% dos processos institucionais (30 processos)',
      'Capacitar 100% dos servidores em integridade',
      'Obter certificação ISO 37001 (Antissuborno)',
    ],
  });
  baixarDocumento(d);
};

// ============================================================
// FICHA CADASTRAL DO SERVIDOR (motor único: modelo `rh-ficha-cadastral`)
// ============================================================

/** Dados vindos do cadastro (linha de `servidores` + cargo/lotação); `dependentes` é o JSON da coluna. */
export type FichaCadastralData = Omit<ServidorFichaCadastral, 'dependentes'> & { dependentes?: unknown };

/** Só itens com nome: o JSON de dependentes é livre e pode vir com lixo de cadastro antigo. */
function dependentesDaFicha(json: unknown): DependenteFicha[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object' && typeof (d as { nome?: unknown }).nome === 'string' && (d as { nome: string }).nome.trim() !== '')
    .map((d) => ({
      nome: String(d.nome),
      data_nascimento: typeof d.data_nascimento === 'string' ? d.data_nascimento : null,
      cpf: typeof d.cpf === 'string' ? d.cpf : null,
      parentesco: typeof d.parentesco === 'string' ? d.parentesco : null,
    }));
}

export const generateFichaCadastral = async (data: FichaCadastralData): Promise<void> => {
  const servidor: ServidorFichaCadastral = { ...data, dependentes: dependentesDaFicha(data.dependentes) };
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  baixarDocumento(await emitirDocumento('rh-ficha-cadastral', { servidor, local: localDaSede(), data: hoje }));
};

// ============================================================
// FICHA CADASTRAL EM BRANCO: o mesmo modelo, sem servidor (rótulos com linha para preencher)
// ============================================================

export const generateFichaCadastralModelo = async (): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-ficha-cadastral', { local: localDaSede() }));
};
