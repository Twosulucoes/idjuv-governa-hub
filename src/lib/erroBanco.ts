/**
 * Mensagem para o usuário a partir de qualquer erro (do Supabase/PostgREST, do Postgres ou do JavaScript).
 * Toda falha de gravação ou de relatório do RH mostra esta mensagem, nunca só "Erro" (teste do RH de
 * 06/11/2026, item 24: a licença, a designação e a transferência falhavam sem dizer por quê).
 *
 * Regra do banco (P0001, RAISE da trigger/RPC) chega com o texto em português e passa direto.
 */
interface ErroLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

/** Campo de data mandado vazio, chave estrangeira etc.: o nome técnico vira texto legível. */
const CAMPOS: Record<string, string> = {
  lotacao_id: 'lotação',
  servidor_id: 'servidor',
  cargo_id: 'cargo',
  unidade_id: 'unidade',
  unidade_destino_id: 'unidade de destino',
  unidade_origem_id: 'unidade de origem',
};

function campoDaRestricao(texto: string): string | null {
  const m = texto.match(/_([a-z_]+?_id)_fkey/) ?? texto.match(/Key \(([a-z_]+)\)/);
  if (!m) return null;
  return CAMPOS[m[1]] ?? m[1].replace(/_id$/, '').replace(/_/g, ' ');
}

export function mensagemDeErro(erro: unknown): string {
  if (!erro) return 'Erro desconhecido.';
  if (typeof erro === 'string') return erro;
  const e = erro as ErroLike;
  const msg = (e.message ?? '').trim();
  switch (e.code) {
    case 'P0001':
    case 'RHS01':
      return [msg || 'Operação recusada por regra do sistema.', e.hint].filter(Boolean).join(' ');
    case '42501':
      return /row-level security/i.test(msg) || !msg
        ? 'Seu usuário não tem permissão para gravar este registro.'
        : msg;
    case '23503': {
      const campo = campoDaRestricao(`${msg} ${e.details ?? ''}`);
      return campo
        ? `O(a) ${campo} informado(a) não existe mais ou não está ativo(a). Recarregue a página e escolha de novo.`
        : 'Um dos itens escolhidos não existe mais. Recarregue a página e escolha de novo.';
    }
    case '23505':
      return 'Já existe um registro com esses dados.';
    case '23502': {
      const col = msg.match(/column "([a-z_]+)"/)?.[1];
      return col ? `Preencha o campo obrigatório "${col.replace(/_/g, ' ')}".` : 'Preencha os campos obrigatórios.';
    }
    case '23514':
      return msg && !/violates check constraint/i.test(msg)
        ? msg
        : 'Um dos valores não é aceito pela regra do cadastro. Revise os campos.';
    case '22007':
    case '22008':
      return 'Há uma data vazia ou inválida no formulário. Preencha a data ou deixe o campo em branco.';
    case '22P02':
      return 'Há um campo com valor em formato inválido. Revise o formulário.';
    case 'PGRST116':
      return 'Nenhum registro encontrado (ou sem permissão para vê-lo).';
    case '42703':
    case 'PGRST200':
    case 'PGRST201':
      return `Erro interno de consulta (${e.code}). Avise o suporte.`;
    case '57014':
      return 'A operação demorou demais e foi interrompida. Tente de novo.';
    default:
      if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
      if (msg) return e.code ? `${msg} (código ${e.code})` : msg;
      return e.code ? `Erro no banco (código ${e.code}).` : 'Erro inesperado.';
  }
}

/** Converte "" em null nas chaves informadas (campo de data/uuid opcional deixado em branco no formulário). */
export function vazioParaNulo<T extends object>(dados: T, chaves: (keyof T)[]): T {
  const copia = { ...dados };
  for (const k of chaves) {
    if (typeof copia[k] === 'string' && (copia[k] as string).trim() === '') (copia as Record<keyof T, unknown>)[k] = null;
  }
  return copia;
}
