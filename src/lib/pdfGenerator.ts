import { baixarDocumento, emitirDocumento, localDaSede } from '@/lib/documentos';
import type { DadosRelatorioCargosVagas } from '@/lib/documentos/modelos/cargos/cargosVagas';
import type { DadosRelatorioGovernanca } from '@/lib/documentos/modelos/governanca/relatorioAnual';
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

/**
 * Gera e baixa o relatório anual de governança e integridade (RelatorioGovernancaPage) com os dados do
 * cadastro montados por `useRelatorioGovernanca`. Sem cadastro, o modelo imprime só o aviso.
 */
export const generateRelatorioGovernancaPDF = async (dados: DadosRelatorioGovernanca): Promise<void> => {
  baixarDocumento(await emitirDocumento('governanca-relatorio-anual', dados));
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
