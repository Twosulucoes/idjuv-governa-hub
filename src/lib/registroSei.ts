/**
 * REGISTRO DE ATO FEITO NO SEI (termo de cessão e designação de chefia de unidade local)
 *
 * O sistema não redige o ato: o texto, a numeração e a assinatura são do SEI. Aqui ficam a
 * validação do que se registra (processo SEI, número do ato, assinatura e DOE) e a etapa do
 * ciclo que esse registro representa. Mesmo critério do registro de portaria
 * (NovaPortariaSimplificada): sem número oficial, o ato está "aguardando SEI".
 */
import { z } from 'zod';
import type { StatusTermoCessao } from '@/types/unidadesLocais';

/** Texto opcional do formulário: aparado; vazio vira null (para gravar/limpar no banco). */
export const textoOuNulo = (v?: string | null): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

/** Sem número do ato, o registro ainda espera o SEI. */
export const aguardandoSei = (numero?: string | null): boolean => !textoOuNulo(numero);

const dataOpcional = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Data inválida');

const camposSei = z.object({
  processoSei: z.string().trim().max(60, 'Processo SEI muito longo'),
  numero: z.string().trim().max(30, 'Número do ato muito longo'),
  dataAssinatura: dataOpcional,
  doeNumero: z.string().trim().max(20, 'Número do DOE muito longo'),
  doeData: dataOpcional,
});

/** Estado do formulário (campos de texto; vazio = não informado). */
export interface CamposSei {
  processoSei: string;
  numero: string;
  dataAssinatura: string;
  doeNumero: string;
  doeData: string;
}

/** O que os hooks gravam: os campos validados pelo schema (vazio ou ausente = nulo no banco). */
export type RegistroSei = Partial<CamposSei>;

export const CAMPOS_SEI_VAZIOS: CamposSei = {
  processoSei: '',
  numero: '',
  dataAssinatura: '',
  doeNumero: '',
  doeData: '',
};

/** Regras comuns: assinatura e DOE só com o número do ato; DOE com número e data juntos. */
function validarCiclo(v: RegistroSei, ctx: z.RefinementCtx) {
  if (!!v.doeNumero !== !!v.doeData) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe o número e a data do DOE juntos', path: ['doeNumero'] });
  }
  if (!v.numero && (v.dataAssinatura || v.doeNumero)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Para registrar assinatura ou publicação, informe o número do ato no SEI',
      path: ['numero'],
    });
  }
  if (v.dataAssinatura && v.doeData && v.doeData < v.dataAssinatura) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A data do DOE não pode ser anterior à assinatura', path: ['doeData'] });
  }
}

export const registroSeiTermoSchema = camposSei
  .extend({ cancelado: z.boolean() })
  .superRefine(validarCiclo);

export const registroSeiDesignacaoSchema = camposSei
  .extend({ dataPublicacao: dataOpcional })
  .superRefine((v, ctx) => {
    validarCiclo(v, ctx);
    if (!v.numero && v.dataPublicacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para registrar a publicação, informe o número do ato no SEI',
        path: ['numero'],
      });
    }
  });

/**
 * Etapa do termo de cessão conforme o que já aconteceu no SEI: sem número, "pendente" (aguardando
 * SEI); numerado, "emitido" (aguardando assinatura); com a data da assinatura, "assinado".
 */
export function statusTermoPeloSei(v: { numero?: string | null; dataAssinatura?: string | null; cancelado?: boolean }): StatusTermoCessao {
  if (v.cancelado) return 'cancelado';
  if (aguardandoSei(v.numero)) return 'pendente';
  return textoOuNulo(v.dataAssinatura) ? 'assinado' : 'emitido';
}

/** Número do termo para exibir: o do SEI como foi digitado; o interno antigo (só dígitos) com o ano. */
export function numeroTermoExibicao(numero: string | null | undefined, ano: number): string | null {
  const n = textoOuNulo(numero);
  if (!n) return null;
  return /^\d+$/.test(n) ? `${n}/${ano}` : n;
}
