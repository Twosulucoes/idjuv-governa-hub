import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TenantConfig } from '@/core/tenant';

export function parseData(iso: string): Date {
  const d = new Date(`${iso}T00:00:00`);
  if (!iso || !isValid(d)) throw new Error(`Data inválida: "${iso}"`);
  return d;
}

export const dataExtenso = (iso: string): string => format(parseData(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

/** "PORTARIA Nº 12/<numeração do tenant>/2026 DE 05 DE OUTUBRO DE 2026". */
export function tituloPortaria(t: TenantConfig, numero: string, dataIso: string): string {
  const data = parseData(dataIso);
  const ano = format(data, 'yyyy');
  const numeroLimpo = numero.split('/')[0];
  const sufixo = t.legal?.numeracaoAtos ? `/${t.legal.numeracaoAtos}` : '';
  const dataCaixaAlta = `${format(data, 'dd')} DE ${format(data, 'MMMM', { locale: ptBR }).toUpperCase()} DE ${ano}`;
  return `PORTARIA Nº ${numeroLimpo}${sufixo}/${ano} DE ${dataCaixaAlta}`;
}

export function preambulo(t: TenantConfig): string {
  const lei = t.legal?.leiCriacao ? ` pela ${t.legal.leiCriacao},` : '';
  return `${t.identidade.tratamentoDirigente}, no uso das atribuições legais que lhe são conferidas${lei} e demais normas aplicáveis,`;
}

export function assinaturaDirigente(t: TenantConfig): { nome: string; cargo: string } {
  const cargo = t.legal?.dirigenteCargo ? `${t.legal.dirigenteCargo} do ${t.identidade.nomeCurto}` : t.identidade.nomeCurto;
  return { nome: (t.legal?.dirigenteNome ?? '').toUpperCase(), cargo };
}

export function localDoAto(t: TenantConfig): string {
  const { cidade, uf } = t.endereco ?? {};
  return [cidade, uf].filter(Boolean).join(' – ');
}

export function formatarCPF(cpf: string): string {
  const n = String(cpf ?? '').replace(/\D/g, '');
  return n.length === 11 ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : String(cpf ?? '');
}
