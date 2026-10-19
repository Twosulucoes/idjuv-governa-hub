import { SITUACAO_LABELS, VINCULO_LABELS } from '@/types/rh';
import { assinaturas, camposChaveValor, localData, paragrafo, secao, tabela, type Campo } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { moeda } from './comum';
import { formatarCPF, formatarData } from './formatos';

/**
 * Ficha cadastral do servidor: uma só para a versão preenchida (dados do cadastro) e para a em branco
 * (sem `servidor`, rótulos com linha para preencher à mão). Une as três cópias antigas de
 * `pdfGenerator`/`pdfModelos`; imprime só campos que alguma versão preenchida já imprimia (LGPD).
 */

export interface DependenteFicha {
  nome?: string | null;
  data_nascimento?: string | null;
  cpf?: string | null;
  parentesco?: string | null;
}

export interface ServidorFichaCadastral {
  // Identificação
  nome_completo: string;
  nome_social?: string | null;
  cpf?: string | null;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  rg_uf?: string | null;
  rg_data_emissao?: string | null;
  data_nascimento?: string | null;
  sexo?: string | null;
  estado_civil?: string | null;
  nacionalidade?: string | null;
  naturalidade_cidade?: string | null;
  naturalidade_uf?: string | null;
  // Documentos
  titulo_eleitor?: string | null;
  titulo_zona?: string | null;
  titulo_secao?: string | null;
  pis_pasep?: string | null;
  ctps_numero?: string | null;
  ctps_serie?: string | null;
  ctps_uf?: string | null;
  cnh_numero?: string | null;
  cnh_categoria?: string | null;
  cnh_validade?: string | null;
  certificado_reservista?: string | null;
  // Contato
  email_pessoal?: string | null;
  email_institucional?: string | null;
  telefone_fixo?: string | null;
  telefone_celular?: string | null;
  telefone_emergencia?: string | null;
  contato_emergencia_nome?: string | null;
  contato_emergencia_parentesco?: string | null;
  // Endereço
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
  // Dados funcionais
  matricula?: string | null;
  vinculo?: string | null;
  situacao?: string | null;
  cargo_nome?: string | null;
  cargo_sigla?: string | null;
  unidade_nome?: string | null;
  unidade_sigla?: string | null;
  carga_horaria?: number | null;
  regime_juridico?: string | null;
  data_admissao?: string | null;
  data_posse?: string | null;
  data_exercicio?: string | null;
  // Formação
  escolaridade?: string | null;
  formacao_academica?: string | null;
  instituicao_ensino?: string | null;
  ano_conclusao?: number | null;
  cursos_especializacao?: string[] | null;
  // Dados bancários
  banco_codigo?: string | null;
  banco_nome?: string | null;
  banco_agencia?: string | null;
  banco_conta?: string | null;
  banco_tipo_conta?: string | null;
  // Remuneração
  remuneracao_bruta?: number | null;
  gratificacoes?: number | null;
  descontos?: number | null;
  // Declarações
  acumula_cargo?: boolean | null;
  acumulo_descricao?: string | null;
  declaracao_bens_data?: string | null;
  declaracao_acumulacao_data?: string | null;
  dependentes?: DependenteFicha[] | null;
  observacoes?: string | null;
}

export interface DadosFichaCadastral {
  /** Ausente = ficha em branco, para imprimir e preencher à mão. */
  servidor?: ServidorFichaCadastral;
  /** Protocolo do RH (RH-AAAA-NNNNNN), quando houver. */
  protocolo?: string | null;
  /** "Cidade/UF" da sede, para o local e data acima das assinaturas. */
  local?: string;
  /** Data por extenso da ficha preenchida; a em branco deixa a data para preencher. */
  data?: string;
}

/**
 * Linha para preencher à mão: sublinhados que cabem na coluna mesmo na letra grande
 * (traço de 11,5 pt ≈ 2,3 mm em colunas de 170, 82 e 52 mm).
 */
const LINHA_A_PREENCHER: Record<1 | 2 | 3, string> = { 1: '_'.repeat(74), 2: '_'.repeat(35), 3: '_'.repeat(22) };

const DEPENDENTES_EM_BRANCO = 5;

const juntar = (partes: (string | null | undefined)[], sep: string): string => partes.filter((p) => p && String(p).trim()).join(sep);

const comSigla = (nome?: string | null, sigla?: string | null): string => (nome ? (sigla ? `${nome} (${sigla})` : nome) : '');

const rotuloDe = (labels: Record<string, string>, codigo?: string | null): string => (codigo ? labels[codigo] || codigo : '');

const sexo = (s?: string | null): string => (s === 'M' ? 'Masculino' : s === 'F' ? 'Feminino' : s || '');

const entregue = (data?: string | null): string => (data ? `Entregue em ${formatarData(data)}` : 'Não entregue');

/** Monta a grade: na ficha em branco, todo valor vira linha para preencher. */
function grade(emBranco: boolean, colunas: 1 | 2 | 3, campos: Campo[]): Bloco {
  return camposChaveValor({
    colunas,
    campos: emBranco ? campos.map((c) => ({ rotulo: c.rotulo, valor: LINHA_A_PREENCHER[colunas] })) : campos,
  });
}

function dependentes(emBranco: boolean, lista: DependenteFicha[]): Bloco[] {
  const colunas = [
    { chave: 'nome', titulo: 'Nome', peso: 3 },
    { chave: 'nascimento', titulo: 'Data de nascimento', peso: 1.4 },
    { chave: 'cpf', titulo: 'CPF', peso: 1.5 },
    { chave: 'parentesco', titulo: 'Parentesco', peso: 1.4 },
  ];
  if (emBranco) {
    const vazia = { nome: '_'.repeat(34), nascimento: '_'.repeat(13), cpf: '_'.repeat(14), parentesco: '_'.repeat(13) };
    return [secao({ texto: 'Dependentes' }), tabela({ colunas, linhas: Array.from({ length: DEPENDENTES_EM_BRANCO }, () => vazia) })];
  }
  if (lista.length === 0) return [secao({ texto: 'Dependentes' }), paragrafo({ texto: 'Nenhum dependente cadastrado.' })];
  return [
    secao({ texto: 'Dependentes' }),
    tabela({
      colunas,
      linhas: lista.map((d) => ({
        nome: d.nome,
        nascimento: formatarData(d.data_nascimento),
        cpf: formatarCPF(d.cpf),
        parentesco: d.parentesco,
      })),
    }),
  ];
}

const DECLARACAO =
  'Declaro, sob as penas da lei, que as informações prestadas nesta ficha são verdadeiras e de minha inteira ' +
  'responsabilidade, comprometendo-me a comunicar ao setor de gestão de pessoas qualquer alteração nos dados aqui declarados.';

export const fichaCadastral: DocumentoModelo<DadosFichaCadastral> = {
  tipo: 'rh-ficha-cadastral',
  familia: 'ficha',
  titulo: () => 'Ficha cadastral do servidor',
  subtitulo: (d) => d.servidor?.nome_completo || 'Modelo para preenchimento',
  protocolo: (d) => d.protocolo || undefined,
  nomeArquivo: (d) =>
    d.servidor ? `Ficha_Cadastral_${d.servidor.nome_completo.replace(/\s+/g, '_').substring(0, 30)}.pdf` : 'Modelo_Ficha_Cadastral.pdf',
  blocos: (d) => {
    const emBranco = !d.servidor;
    const s: Partial<ServidorFichaCadastral> = d.servidor ?? {};
    const g = (colunas: 1 | 2 | 3, campos: Campo[]) => grade(emBranco, colunas, campos);

    const blocos: Bloco[] = [
      secao({ texto: 'Identificação do servidor' }),
      g(1, [{ rotulo: 'Nome completo', valor: s.nome_completo }]),
    ];
    // Como na versão preenchida antiga, nome social só aparece se houver; na em branco, sempre.
    if (emBranco || s.nome_social) blocos.push(g(1, [{ rotulo: 'Nome social (se houver)', valor: s.nome_social }]));
    blocos.push(
      g(3, [
        { rotulo: 'CPF', valor: formatarCPF(s.cpf) },
        { rotulo: 'Matrícula', valor: s.matricula },
        { rotulo: 'Data de nascimento', valor: formatarData(s.data_nascimento) },
        { rotulo: 'RG', valor: s.rg },
        { rotulo: 'Órgão expedidor/UF', valor: juntar([s.rg_orgao_expedidor, s.rg_uf], '/') },
        { rotulo: 'Data de emissão do RG', valor: formatarData(s.rg_data_emissao) },
        { rotulo: 'Sexo', valor: sexo(s.sexo) },
        { rotulo: 'Estado civil', valor: s.estado_civil },
        { rotulo: 'Nacionalidade', valor: s.nacionalidade },
      ]),
      g(1, [{ rotulo: 'Naturalidade (cidade/UF)', valor: juntar([s.naturalidade_cidade, s.naturalidade_uf], '/') }]),

      secao({ texto: 'Documentos' }),
      g(3, [
        { rotulo: 'Título de eleitor', valor: s.titulo_eleitor },
        { rotulo: 'Zona', valor: s.titulo_zona },
        { rotulo: 'Seção', valor: s.titulo_secao },
        { rotulo: 'PIS/PASEP', valor: s.pis_pasep },
        { rotulo: 'Certificado de reservista', valor: s.certificado_reservista },
        { rotulo: 'CTPS (número)', valor: s.ctps_numero },
        { rotulo: 'CTPS (série/UF)', valor: juntar([s.ctps_serie, s.ctps_uf], '/') },
        { rotulo: 'CNH (número)', valor: s.cnh_numero },
        { rotulo: 'CNH (categoria/validade)', valor: juntar([s.cnh_categoria, formatarData(s.cnh_validade)], ' - ') },
      ]),

      secao({ texto: 'Endereço' }),
      g(1, [{ rotulo: 'Logradouro', valor: s.endereco_logradouro }]),
      g(3, [
        { rotulo: 'Número', valor: s.endereco_numero },
        { rotulo: 'Complemento', valor: s.endereco_complemento },
        { rotulo: 'Bairro', valor: s.endereco_bairro },
        { rotulo: 'Cidade', valor: s.endereco_cidade },
        { rotulo: 'UF', valor: s.endereco_uf },
        { rotulo: 'CEP', valor: s.endereco_cep },
      ]),

      secao({ texto: 'Contato' }),
      g(2, [
        { rotulo: 'E-mail pessoal', valor: s.email_pessoal },
        { rotulo: 'E-mail institucional', valor: s.email_institucional },
      ]),
      g(3, [
        { rotulo: 'Telefone fixo', valor: s.telefone_fixo },
        { rotulo: 'Celular', valor: s.telefone_celular },
        { rotulo: 'Telefone de emergência', valor: s.telefone_emergencia },
      ]),
      g(2, [
        { rotulo: 'Contato de emergência', valor: s.contato_emergencia_nome },
        { rotulo: 'Parentesco', valor: s.contato_emergencia_parentesco },
      ]),

      secao({ texto: 'Dados funcionais' }),
      g(3, [
        { rotulo: 'Vínculo', valor: rotuloDe(VINCULO_LABELS, s.vinculo) },
        { rotulo: 'Situação', valor: rotuloDe(SITUACAO_LABELS, s.situacao) },
        { rotulo: 'Regime jurídico', valor: s.regime_juridico },
      ]),
      g(2, [
        { rotulo: 'Cargo/função', valor: comSigla(s.cargo_nome, s.cargo_sigla) },
        { rotulo: 'Carga horária', valor: s.carga_horaria ? `${s.carga_horaria}h/semana` : '' },
      ]),
      g(1, [{ rotulo: 'Lotação', valor: comSigla(s.unidade_nome, s.unidade_sigla) }]),
      g(3, [
        { rotulo: 'Data de admissão', valor: formatarData(s.data_admissao) },
        { rotulo: 'Data de posse', valor: formatarData(s.data_posse) },
        { rotulo: 'Data de exercício', valor: formatarData(s.data_exercicio) },
      ]),

      secao({ texto: 'Formação acadêmica' }),
      g(3, [
        { rotulo: 'Escolaridade', valor: s.escolaridade },
        { rotulo: 'Formação/curso', valor: s.formacao_academica },
        { rotulo: 'Ano de conclusão', valor: s.ano_conclusao },
      ]),
      g(1, [{ rotulo: 'Instituição de ensino', valor: s.instituicao_ensino }]),
      g(1, [{ rotulo: 'Especializações e cursos complementares', valor: (s.cursos_especializacao ?? []).join('; ') }]),

      secao({ texto: 'Dados bancários' }),
      g(2, [
        { rotulo: 'Banco', valor: s.banco_nome ? juntar([s.banco_codigo && `(${s.banco_codigo})`, s.banco_nome], ' ') : '' },
        { rotulo: 'Agência', valor: s.banco_agencia },
        { rotulo: 'Conta', valor: s.banco_conta },
        { rotulo: 'Tipo de conta', valor: s.banco_tipo_conta },
      ]),

      ...dependentes(emBranco, s.dependentes ?? []),
    );

    // Remuneração, entrega das declarações e observações são controle do RH: só na ficha preenchida
    // (nenhum modelo em branco os tinha). O texto da declaração fecha a seção Declarações nas duas versões.
    if (!emBranco) {
      const liquido = (s.remuneracao_bruta || 0) + (s.gratificacoes || 0) - (s.descontos || 0);
      const temValor = (v?: number | null) => v !== null && v !== undefined;
      blocos.push(
        secao({ texto: 'Remuneração' }),
        g(2, [
          { rotulo: 'Remuneração bruta', valor: temValor(s.remuneracao_bruta) ? moeda(s.remuneracao_bruta) : '' },
          { rotulo: 'Gratificações', valor: temValor(s.gratificacoes) ? moeda(s.gratificacoes) : '' },
          { rotulo: 'Descontos', valor: temValor(s.descontos) ? moeda(s.descontos) : '' },
          { rotulo: 'Líquido', valor: liquido > 0 ? moeda(liquido) : '' },
        ]),
      );
      if (s.observacoes?.trim()) blocos.push(secao({ texto: 'Observações' }), paragrafo({ texto: s.observacoes }));
      blocos.push(
        secao({ texto: 'Declarações' }),
        g(1, [{ rotulo: 'Exerce outro cargo, emprego ou função pública?', valor: s.acumula_cargo ? 'Sim' : 'Não' }]),
      );
      if (s.acumula_cargo) blocos.push(g(1, [{ rotulo: 'Descrição do acúmulo', valor: s.acumulo_descricao }]));
      blocos.push(
        g(2, [
          { rotulo: 'Declaração de bens', valor: entregue(s.declaracao_bens_data) },
          { rotulo: 'Declaração de acumulação', valor: entregue(s.declaracao_acumulacao_data) },
        ]),
      );
    } else {
      blocos.push(
        secao({ texto: 'Declarações' }),
        camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Exerce outro cargo, emprego ou função pública?', valor: '(   ) Sim     (   ) Não' }] }),
        g(1, [{ rotulo: 'Se sim, especificar', valor: '' }]),
      );
    }

    blocos.push(
      paragrafo({ texto: DECLARACAO, alinhamento: 'justificado' }),
      localData({
        local: d.local || '_'.repeat(30),
        data: emBranco || !d.data ? '____/____/________' : d.data,
      }),
      assinaturas({
        assinantes: [
          emBranco ? { nome: 'Assinatura do(a) servidor(a)' } : { nome: s.nome_completo ?? '', cargo: 'Assinatura do(a) servidor(a)' },
          { nome: 'Responsável pelo recebimento', cargo: 'Gestão de pessoas (carimbo e assinatura)' },
        ],
      }),
    );
    return blocos;
  },
};
