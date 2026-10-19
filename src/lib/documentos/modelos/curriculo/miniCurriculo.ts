import { DOCUMENTOS_CHECKLIST, type PreCadastro } from '@/types/preCadastro';
import { assinaturas, camposChaveValor, localData, paragrafo, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { formatarCPF, formatarData } from '../rh/formatos';

/** Marcações do checklist de documentos entregues (`doc_rg`, `doc_cpf`…). */
type ChaveChecklist = Extract<keyof PreCadastro, `doc_${string}`>;

/** Campos do pré-cadastro que a ficha imprime (os mesmos do gerador antigo). */
export type CandidatoMiniCurriculo = Partial<
  Pick<
    PreCadastro,
    | 'codigo_acesso'
    | 'nome_completo'
    | 'nome_social'
    | 'data_nascimento'
    | 'sexo'
    | 'estado_civil'
    | 'nacionalidade'
    | 'naturalidade_cidade'
    | 'naturalidade_uf'
    | 'cpf'
    | 'rg'
    | 'rg_orgao_expedidor'
    | 'rg_uf'
    | 'rg_data_emissao'
    | 'titulo_eleitor'
    | 'titulo_zona'
    | 'titulo_secao'
    | 'certificado_reservista'
    | 'email'
    | 'telefone_celular'
    | 'endereco_logradouro'
    | 'endereco_numero'
    | 'endereco_bairro'
    | 'endereco_cidade'
    | 'endereco_uf'
    | 'endereco_cep'
    | 'pis_pasep'
    | 'escolaridade'
    | 'formacao_academica'
    | 'instituicao_ensino'
    | 'ano_conclusao'
    | 'registro_conselho'
    | 'conselho_numero'
    | 'cnh_numero'
    | 'cnh_categoria'
    | 'cnh_validade'
    | 'banco_nome'
    | 'banco_agencia'
    | 'banco_conta'
    | 'banco_tipo_conta'
    | 'habilidades'
    | 'idiomas'
    | 'experiencia_resumo'
    | 'dependentes'
    | ChaveChecklist
  >
>;

export interface DadosMiniCurriculo {
  candidato: CandidatoMiniCurriculo;
  /** Cidade/UF da assinatura (vem do cadastro da instituição). Ausente: só a data. */
  local?: string;
  /** Data por extenso da assinatura ("19 de outubro de 2026"). */
  data: string;
}

/** "Cidade/UF" sem barra solta quando falta um dos lados. */
const juntar = (...partes: (string | null | undefined)[]): string => partes.filter((p) => p && p.trim()).join('/');

/** Grupos do checklist que a ficha sempre imprimiu (o antigo não listava previdenciários nem bancários). */
const GRUPOS_CHECKLIST: { titulo: string; itens: { key: string; label: string }[] }[] = [
  { titulo: 'Documentos pessoais', itens: DOCUMENTOS_CHECKLIST.pessoais },
  { titulo: 'Escolaridade / habilitação', itens: DOCUMENTOS_CHECKLIST.escolaridade },
  { titulo: 'Certidões', itens: DOCUMENTOS_CHECKLIST.certidoes },
  { titulo: 'Declarações', itens: DOCUMENTOS_CHECKLIST.declaracoes },
];

const DECLARACAO =
  'Declaro que as informações acima prestadas são verdadeiras e assumo a responsabilidade pela sua exatidão, ' +
  'sob pena de incorrer nas sanções previstas em lei.';

export const fichaMiniCurriculo: DocumentoModelo<DadosMiniCurriculo> = {
  tipo: 'curriculo-mini-curriculo',
  familia: 'ficha',
  titulo: () => 'Formulário de pré-cadastro',
  subtitulo: (d) => (d.candidato.codigo_acesso ? `Código de acesso: ${d.candidato.codigo_acesso}` : undefined),
  nomeArquivo: (d) => `pre-cadastro-${d.candidato.codigo_acesso || 'rascunho'}.pdf`,
  blocos: (d) => {
    const c = d.candidato;
    const blocos: Bloco[] = [
      secao({ texto: '1. Dados pessoais' }),
      camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Nome completo', valor: c.nome_completo }] }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Nome social', valor: c.nome_social },
          { rotulo: 'Data de nascimento', valor: formatarData(c.data_nascimento) },
          { rotulo: 'Sexo', valor: c.sexo },
          { rotulo: 'Estado civil', valor: c.estado_civil },
          { rotulo: 'Nacionalidade', valor: c.nacionalidade },
          { rotulo: 'Naturalidade', valor: juntar(c.naturalidade_cidade, c.naturalidade_uf) },
        ],
      }),

      secao({ texto: '2. Documentos pessoais' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'CPF', valor: formatarCPF(c.cpf) },
          { rotulo: 'RG', valor: c.rg },
          { rotulo: 'Órgão expedidor/UF', valor: juntar(c.rg_orgao_expedidor, c.rg_uf) },
          { rotulo: 'Emissão do RG', valor: formatarData(c.rg_data_emissao) },
          { rotulo: 'Título de eleitor', valor: c.titulo_eleitor },
          { rotulo: 'Zona/seção', valor: juntar(c.titulo_zona, c.titulo_secao) },
          { rotulo: 'Certificado de reservista', valor: c.certificado_reservista },
        ],
      }),

      secao({ texto: '3. Contato e endereço' }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'E-mail', valor: c.email },
          { rotulo: 'Celular', valor: c.telefone_celular },
          { rotulo: 'Logradouro', valor: c.endereco_logradouro },
          { rotulo: 'Número', valor: c.endereco_numero },
        ],
      }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Bairro', valor: c.endereco_bairro },
          { rotulo: 'Cidade/UF', valor: juntar(c.endereco_cidade, c.endereco_uf) },
          { rotulo: 'CEP', valor: c.endereco_cep },
        ],
      }),

      secao({ texto: '4. Documentos previdenciários' }),
      camposChaveValor({ colunas: 3, campos: [{ rotulo: 'NIS / PIS / PASEP', valor: c.pis_pasep }] }),

      secao({ texto: '5. Escolaridade / habilitação' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Escolaridade', valor: c.escolaridade },
          { rotulo: 'Formação', valor: c.formacao_academica },
          { rotulo: 'Ano de conclusão', valor: c.ano_conclusao },
          { rotulo: 'Instituição de ensino', valor: c.instituicao_ensino },
          { rotulo: 'Conselho profissional', valor: c.registro_conselho },
          { rotulo: 'Nº do registro', valor: c.conselho_numero },
          { rotulo: 'CNH nº', valor: c.cnh_numero },
          { rotulo: 'Categoria', valor: c.cnh_categoria },
          { rotulo: 'Validade', valor: formatarData(c.cnh_validade) },
        ],
      }),

      secao({ texto: '6. Dados bancários' }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Banco', valor: c.banco_nome },
          { rotulo: 'Agência', valor: c.banco_agencia },
          { rotulo: 'Conta', valor: c.banco_conta },
          { rotulo: 'Tipo de conta', valor: c.banco_tipo_conta },
        ],
      }),

      secao({ texto: '7. Aptidões e habilidades' }),
      camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Habilidades', valor: (c.habilidades ?? []).filter(Boolean).join(', ') }] }),
    ];

    // Como no antigo: idiomas e resumo de experiência só saem quando preenchidos.
    const idiomas = (c.idiomas ?? []).filter((i) => i?.idioma).map((i) => (i.nivel ? `${i.idioma} (${i.nivel})` : i.idioma));
    if (idiomas.length > 0) blocos.push(camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Idiomas', valor: idiomas.join(', ') }] }));
    if (c.experiencia_resumo?.trim()) {
      blocos.push(camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Resumo de experiência', valor: c.experiencia_resumo }] }));
    }

    blocos.push(
      secao({ texto: '8. Checklist de documentos' }),
      tabela({
        colunas: [
          { chave: 'grupo', titulo: 'Grupo', peso: 1.6 },
          { chave: 'documento', titulo: 'Documento', peso: 4 },
          { chave: 'entregue', titulo: 'Entregue', peso: 0.9, alinhamento: 'centro' },
        ],
        linhas: GRUPOS_CHECKLIST.flatMap((g) =>
          g.itens.map((item) => ({ grupo: g.titulo, documento: item.label, entregue: c[item.key as ChaveChecklist] ? 'Sim' : 'Não' })),
        ),
      }),
    );

    const dependentes = (c.dependentes ?? []).filter(Boolean);
    if (dependentes.length > 0) {
      blocos.push(
        secao({ texto: '9. Dependentes' }),
        tabela({
          colunas: [
            { chave: 'nome', titulo: 'Nome', peso: 3 },
            { chave: 'cpf', titulo: 'CPF', peso: 1.5 },
            { chave: 'parentesco', titulo: 'Parentesco', peso: 1.5 },
          ],
          linhas: dependentes.map((dep) => ({ nome: dep.nome, cpf: formatarCPF(dep.cpf), parentesco: dep.parentesco })),
        }),
      );
    }

    blocos.push(
      paragrafo({ texto: DECLARACAO, alinhamento: 'justificado' }),
      assinaturas({
        assinantes: [
          c.nome_completo?.trim()
            ? { nome: c.nome_completo.trim(), cargo: 'Assinatura do(a) candidato(a)' }
            : { nome: 'Assinatura do(a) candidato(a)' },
        ],
      }),
      d.local?.trim() ? localData({ local: d.local.trim(), data: d.data }) : paragrafo({ texto: `${d.data}.` }),
    );
    return blocos;
  },
};
