import { tabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

export interface LinhaEstruturaOrganizacional {
  nome: string;
  sigla?: string | null;
  /** Sigla da unidade a que esta se vincula. */
  siglaSuperior?: string | null;
  email?: string | null;
}

export interface DadosEstruturaOrganizacional {
  titulo?: string;
  subtitulo?: string;
  /** Sigla do órgão impressa na 1ª coluna (informada na tela). */
  orgaoSigla: string;
  unidades: LinhaEstruturaOrganizacional[];
}

export const estruturaOrganizacional: DocumentoModelo<DadosEstruturaOrganizacional> = {
  tipo: 'relatorios-estrutura-organizacional',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: (d) => d.titulo || 'Relatório de estrutura organizacional',
  subtitulo: (d) => [d.subtitulo, `Total de registros: ${d.unidades.length}`].filter(Boolean).join(' · '),
  nomeArquivo: () => `relatorio-estrutura-organizacional-${new Date().toISOString().slice(0, 10)}.pdf`,
  blocos: (d) => [
    tabela({
      colunas: [
        { chave: 'orgao', titulo: 'Órgão (sigla)', peso: 1.2 },
        { chave: 'nome', titulo: 'Nome da unidade', peso: 3.5 },
        { chave: 'sigla', titulo: 'Sigla', peso: 1.2 },
        { chave: 'siglaSuperior', titulo: 'Unidade vinculada', peso: 1.5 },
        { chave: 'email', titulo: 'E-mail', peso: 2.2 },
      ],
      // Mesma ordem do relatório antigo: por nome, sem distinguir maiúsculas e acentos.
      linhas: [...d.unidades]
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
        .map((u) => ({ ...u, orgao: d.orgaoSigla })),
    }),
  ],
};
