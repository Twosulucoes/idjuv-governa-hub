/**
 * Gera os templates de e-mail do Supabase Auth (GoTrue) de cada tenant.
 *
 * Os e-mails seguem o design system (docs/superpowers/specs/2026-10-09-design-system-design.md):
 *   - neutros e estados  → lidos de src/index.css (:root e .dark), sem cópia manual;
 *   - marca              → paleta do tenant (tenants/<slug>/tenant.config.ts);
 *   - identidade/rodapé  → identidade, endereço e contato do tenant.
 *
 * Saída: tenants/<slug>/emails/*.html + docker-compose.emails.yml (assuntos e URLs para a VPS).
 * Os botões levam direto à tela /auth do app com {{ .TokenHash }} (a tela chama
 * verifyOtp), em vez do {{ .ConfirmationURL }} do GoTrue: o token só é gasto quando a
 * pessoa abre a página, não quando um antivírus de e-mail "visita" o link.
 * Os placeholders {{ .TokenHash }}, {{ .Token }} etc. são do GoTrue e
 * passam intactos. Guia de aplicação: docs/EMAILS_AUTH.md.
 *
 * Uso:  bun scripts/emails/gerar-templates-email.ts            (todos os tenants)
 *       bun scripts/emails/gerar-templates-email.ts idjuv      (um tenant)
 *       bun scripts/emails/gerar-templates-email.ts --check    (falha se a saída estiver desatualizada)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TENANTS } from '../../tenants/index';
import type { TenantConfig } from '../../src/core/tenant/types';

const URL_BASE_TEMPLATES = 'http://kong:8000/storage/v1/object/public/emails';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── Tokens ──────────────────────────────────────────────────────────────────

/** Lê `--nome: H S% L%;` de um bloco do index.css (`:root {` ou `.dark {`). */
function lerBloco(css: string, seletor: string): Record<string, string> {
  const inicio = css.indexOf(`${seletor} {`);
  if (inicio < 0) throw new Error(`bloco ${seletor} não encontrado em src/index.css`);
  // Conta chaves para achar o fim do bloco, sem depender da indentação.
  let fim = css.indexOf('{', inicio), nivel = 0;
  for (; fim < css.length; fim++) {
    if (css[fim] === '{') nivel++;
    else if (css[fim] === '}' && --nivel === 0) break;
  }
  if (nivel !== 0) throw new Error(`bloco ${seletor} sem fechamento em src/index.css`);
  const tokens: Record<string, string> = {};
  const bloco = css.slice(inicio, fim).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of bloco.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

function hslParaHex(hsl: string): string {
  const m = hsl.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) throw new Error(`HSL inválido: "${hsl}"`);
  const h = Number(m[1]), s = Number(m[2]) / 100, l = Number(m[3]) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

interface Cores {
  fundo: string; cartao: string; texto: string; textoSuave: string; borda: string; caixa: string;
  marca: string; marcaTexto: string; destaque: string; aviso: string;
}

function cores(css: string, tenant: TenantConfig, modo: 'light' | 'dark'): Cores {
  const base = lerBloco(css, modo === 'light' ? ':root' : '.dark');
  const marca = tenant.marca.paleta[modo];
  const hex = (v: string | undefined, nome: string) => {
    if (!v) throw new Error(`token ${nome} ausente (${modo})`);
    return hslParaHex(v);
  };
  return {
    fundo: hex(base.background, 'background'),
    cartao: hex(base.card, 'card'),
    texto: hex(base.foreground, 'foreground'),
    textoSuave: hex(base['muted-foreground'], 'muted-foreground'),
    borda: hex(base.border, 'border'),
    caixa: hex(base.muted, 'muted'),
    marca: hex(marca.primary, 'primary'),
    marcaTexto: hex(marca.primaryForeground, 'primary-foreground'),
    destaque: hex(marca.highlight, 'highlight'),
    aviso: hex(marca.warningText ?? base['warning-text'], 'warning-text'),
  };
}

/** Mesma régua do gate (WCAG AA): texto 4,5:1. */
function validarContraste(c: Cores, modo: string, slug: string) {
  const pares: [string, string, string][] = [
    ['texto/cartão', c.texto, c.cartao],
    ['texto suave/cartão', c.textoSuave, c.cartao],
    ['texto suave/fundo (rodapé)', c.textoSuave, c.fundo],
    ['texto da marca/marca', c.marcaTexto, c.marca],
    ['aviso/cartão', c.aviso, c.cartao],
    ['texto/caixa', c.texto, c.caixa],
  ];
  for (const [nome, a, b] of pares) {
    const r = contraste(a, b);
    if (r < 4.5) throw new Error(`[${slug}/${modo}] contraste ${nome} = ${r.toFixed(2)}:1 (< 4,5:1)`);
  }
}

/** Escapa texto do perfil do tenant e recusa `{{`, que o GoTrue leria como template. */
function esc(valor: string): string {
  if (valor.includes('{{')) throw new Error(`valor do tenant com "{{": ${valor}`);
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Layout ──────────────────────────────────────────────────────────────────

const FONTE = "'IBM Plex Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

interface Email {
  arquivo: string;
  /** Sufixo da variável GOTRUE_MAILER_{TEMPLATES,SUBJECTS}_<CHAVE>. */
  chave: string;
  assunto: string;
  preheader: string;
  titulo: string;
  /** Parágrafos de abertura (HTML confiável, com placeholders do GoTrue). */
  corpo: string[];
  botao?: string;
  /** `type` do verifyOtp na tela /auth (obrigatório quando há botão). */
  tipo?: 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change';
  /** Mostra o código de uso único ({{ .Token }}). */
  codigo?: boolean;
  aviso: string;
}

function emails(t: TenantConfig): Email[] {
  const nome = esc(t.identidade.nomeCurto);
  // Sem artigo ("do"/"da"): o nome do tenant pode ser masculino ou feminino.
  const sistema = `Sistema de Gestão ${nome}`;
  const ola = 'Olá{{ if .Data.full_name }}, {{ .Data.full_name }}{{ end }}.';
  const naoSolicitou = 'Se você não fez esse pedido, ignore este e-mail: nada muda na sua conta.';
  return [
    {
      arquivo: 'confirmacao.html', chave: 'CONFIRMATION', tipo: 'signup',
      assunto: `Confirme seu e-mail · ${nome}`,
      preheader: `Falta um passo para ativar seu acesso ao ${sistema}.`,
      titulo: 'Confirme seu e-mail',
      corpo: [ola, `Recebemos um cadastro no ${sistema} com o endereço <strong>{{ .Email }}</strong>. Confirme que ele é seu para ativar o acesso.`],
      botao: 'Confirmar e-mail',
      aviso: naoSolicitou,
    },
    {
      arquivo: 'convite.html', chave: 'INVITE', tipo: 'invite',
      assunto: `Convite para o ${sistema}`,
      preheader: `Você recebeu acesso ao ${sistema}. Defina sua senha para entrar.`,
      titulo: 'Você foi convidado',
      corpo: [ola, `Um administrador criou seu acesso ao ${sistema} com o e-mail <strong>{{ .Email }}</strong>. Aceite o convite para definir sua senha e entrar.`],
      botao: 'Aceitar convite',
      aviso: 'Se você não esperava este convite, ignore este e-mail ou avise o suporte.',
    },
    {
      arquivo: 'link-magico.html', chave: 'MAGIC_LINK', tipo: 'magiclink',
      assunto: `Seu link de acesso · ${nome}`,
      preheader: 'Entre no sistema com um clique, sem digitar a senha.',
      titulo: 'Seu link de acesso',
      corpo: [ola, `Use o botão abaixo para entrar no ${sistema}. O link vale uma única vez e por tempo limitado.`],
      botao: 'Entrar no sistema',
      aviso: naoSolicitou,
    },
    {
      arquivo: 'recuperacao-senha.html', chave: 'RECOVERY', tipo: 'recovery',
      assunto: `Redefinição de senha · ${nome}`,
      preheader: 'Recebemos um pedido para redefinir sua senha.',
      titulo: 'Redefina sua senha',
      corpo: [ola, `Recebemos um pedido para redefinir a senha da conta <strong>{{ .Email }}</strong> no ${sistema}. O link vale uma única vez e por tempo limitado.`],
      botao: 'Criar nova senha',
      aviso: 'Se você não pediu a redefinição, ignore este e-mail: sua senha atual continua valendo.',
    },
    {
      arquivo: 'troca-email.html', chave: 'EMAIL_CHANGE', tipo: 'email_change',
      assunto: `Confirme a troca de e-mail · ${nome}`,
      preheader: 'Confirme o novo endereço de e-mail da sua conta.',
      titulo: 'Confirme a troca de e-mail',
      corpo: [ola, 'Foi pedida a troca do e-mail da sua conta de <strong>{{ .Email }}</strong> para <strong>{{ .NewEmail }}</strong>. Confirme para concluir a alteração.'],
      botao: 'Confirmar novo e-mail',
      aviso: 'Se você não pediu essa troca, não clique no botão e avise o suporte imediatamente.',
    },
    {
      arquivo: 'reautenticacao.html', chave: 'REAUTHENTICATION',
      assunto: `Código de confirmação · ${nome}`,
      preheader: 'Use este código para confirmar sua identidade.',
      titulo: 'Confirme sua identidade',
      corpo: [ola, `Para concluir uma ação sensível no ${sistema}, digite o código abaixo. Ele vale por tempo limitado.`],
      codigo: true,
      aviso: 'Se você não iniciou essa ação, ignore este e-mail e troque sua senha.',
    },
  ];
}

function rodape(t: TenantConfig): string {
  const e: Partial<NonNullable<TenantConfig["endereco"]>> = t.endereco ?? {};
  const endereco = [
    [e.logradouro, e.numero].filter(Boolean).join(', '),
    e.complemento, e.bairro, [e.cidade, e.uf].filter(Boolean).join('/'), e.cep && `CEP ${e.cep}`,
  ].filter(Boolean).join(' · ');
  const suporte = t.contato?.emailSuporte || t.contato?.email;
  return [
    `<strong>${esc(t.identidade.nomeOficial)}</strong>`,
    t.entidadeSuperior?.nome && esc(t.entidadeSuperior.nome),
    esc(endereco),
    `Mensagem automática, não responda.${suporte ? ` Dúvidas: <a href="mailto:${esc(suporte)}" class="link-suave" style="color:inherit;text-decoration:underline;">${esc(suporte)}</a>` : ''}`,
  ].filter(Boolean).join('<br>');
}

/** Link do botão: tela de acesso do app, que valida o token (ver src/pages/AuthPage.tsx). */
function link(m: Email): string {
  if (!m.tipo) throw new Error(`${m.arquivo}: botão sem tipo de verificação`);
  return `{{ .SiteURL }}/auth?token_hash={{ .TokenHash }}&amp;type=${m.tipo}`;
}

function render(t: TenantConfig, m: Email, c: Cores, d: Cores): string {
  const url = m.botao ? link(m) : '';
  const p = (html: string) =>
    `<p class="texto" style="margin:0 0 16px;font-size:16px;line-height:24px;color:${c.texto};">${html}</p>`;

  const botao = m.botao ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
                <tr>
                  <td class="botao" bgcolor="${c.marca}" style="border-radius:8px;background:${c.marca};mso-padding-alt:14px 28px;">
                    <a href="${url}" target="_blank" class="botao-link" style="display:inline-block;padding:14px 28px;font-family:${FONTE};font-size:16px;line-height:20px;font-weight:600;color:${c.marcaTexto};text-decoration:none;border-radius:8px;">${m.botao}</a>
                  </td>
                </tr>
              </table>` : '';

  const codigo = m.codigo ? `
              ${p('Seu código:')}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                <tr>
                  <td class="caixa" bgcolor="${c.caixa}" style="border-radius:8px;background:${c.caixa};padding:12px 20px;">
                    <span class="texto" style="font-family:${MONO};font-size:28px;line-height:36px;font-weight:600;letter-spacing:6px;color:${c.texto};">{{ .Token }}</span>
                  </td>
                </tr>
              </table>` : '';

  const linkAlternativo = m.botao ? `
              <p class="texto-suave" style="margin:0 0 24px;font-size:14px;line-height:20px;color:${c.textoSuave};">Se o botão não funcionar, copie e cole este endereço no navegador:<br><a href="${url}" class="link-suave" style="color:${c.textoSuave};text-decoration:underline;word-break:break-all;">${url}</a></p>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${esc(m.assunto)}</title>
  <!-- Gerado por scripts/emails/gerar-templates-email.ts — não edite à mão (ver docs/EMAILS_AUTH.md). -->
  <style>
    body { margin:0; padding:0; width:100%; -webkit-text-size-adjust:100%; }
    a { color:inherit; }
    @media (max-width: 620px) {
      .container { width:100% !important; }
      .miolo { padding:24px 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .fundo { background:${d.fundo} !important; }
      .cartao { background:${d.cartao} !important; border-color:${d.borda} !important; }
      .cabecalho { background:${d.marca} !important; }
      .cabecalho-texto { color:${d.marcaTexto} !important; }
      .texto { color:${d.texto} !important; }
      .texto-suave, .link-suave { color:${d.textoSuave} !important; }
      .aviso { color:${d.aviso} !important; border-color:${d.borda} !important; }
      .caixa { background:${d.caixa} !important; }
      .botao { background:${d.marca} !important; }
      .botao-link { color:${d.marcaTexto} !important; }
    }
  </style>
</head>
<body class="fundo" style="margin:0;padding:0;background:${c.fundo};font-family:${FONTE};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${m.preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="fundo" style="background:${c.fundo};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container cartao" style="width:600px;max-width:600px;background:${c.cartao};border:1px solid ${c.borda};border-radius:8px;overflow:hidden;">
          <tr>
            <td class="cabecalho" bgcolor="${c.marca}" style="background:${c.marca};padding:20px 32px;border-bottom:4px solid ${c.destaque};">
              <span class="cabecalho-texto" style="font-family:${FONTE};font-size:20px;line-height:28px;font-weight:700;letter-spacing:0.5px;color:${c.marcaTexto};">${esc(t.identidade.sigla)}</span>
              <span class="cabecalho-texto" style="font-family:${FONTE};font-size:14px;line-height:20px;color:${c.marcaTexto};">&nbsp;·&nbsp;Sistema de gestão</span>
            </td>
          </tr>
          <tr>
            <td class="miolo" style="padding:32px;font-family:${FONTE};">
              <h1 class="texto" style="margin:0 0 16px;font-size:24px;line-height:32px;font-weight:600;color:${c.texto};">${m.titulo}</h1>
              ${m.corpo.map(p).join('\n              ')}${botao}${codigo}${linkAlternativo}
              <p class="aviso" style="margin:0;padding-top:16px;border-top:1px solid ${c.borda};font-size:14px;line-height:20px;color:${c.aviso};">${m.aviso}</p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;">
          <tr>
            <td class="texto-suave" style="padding:20px 32px 0;font-family:${FONTE};font-size:12px;line-height:18px;color:${c.textoSuave};text-align:center;">
              ${rodape(t)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/** Override do docker-compose do Supabase self-hosted: assuntos + URL de cada template. */
function composeOverride(t: TenantConfig, lista: Email[]): string {
  const linhas = [
    `# Templates de e-mail do Supabase Auth — tenant "${t.slug}".`,
    '# Gerado por scripts/emails/gerar-templates-email.ts — não edite à mão. Ver docs/EMAILS_AUTH.md.',
    '#',
    '# Uso na VPS, na pasta do docker-compose do Supabase:',
    '#   docker compose -f docker-compose.yml -f docker-compose.emails.yml up -d auth',
    '#',
    '# O GoTrue busca cada template por HTTP. As URLs apontam para o bucket público "emails"',
    '# do próprio Storage, lido pela rede interna do Docker (kong:8000), sem sair para a internet.',
    'services:',
    '  auth:',
    '    environment:',
  ];
  for (const m of lista) {
    // Assunto como string JSON (YAML válido) e `$` dobrado (o compose interpola `$`).
    linhas.push(`      GOTRUE_MAILER_SUBJECTS_${m.chave}: ${JSON.stringify(m.assunto.replace(/&amp;/g, '&')).replace(/\$/g, '$$$$')}`);
    linhas.push(`      GOTRUE_MAILER_TEMPLATES_${m.chave}: "${URL_BASE_TEMPLATES}/${m.arquivo}"`);
  }
  return linhas.join('\n') + '\n';
}

// ── Execução ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const checar = args.includes('--check');
const slugs = args.filter((a) => !a.startsWith('--'));
const desconhecidos = slugs.filter((s) => !(s in TENANTS));
if (desconhecidos.length) {
  console.error(`tenant desconhecido: ${desconhecidos.join(', ')} (ver tenants/index.ts)`);
  process.exit(1);
}
const css = readFileSync(join(RAIZ, 'src/index.css'), 'utf8');
let desatualizados = 0;

for (const [slug, tenant] of Object.entries(TENANTS)) {
  if (slugs.length && !slugs.includes(slug)) continue;
  const claro = cores(css, tenant, 'light');
  const escuro = cores(css, tenant, 'dark');
  validarContraste(claro, 'claro', slug);
  validarContraste(escuro, 'escuro', slug);

  const pasta = join(RAIZ, 'tenants', slug, 'emails');
  const lista = emails(tenant);
  const saidas: [string, string][] = [
    ...lista.map((m) => [m.arquivo, render(tenant, m, claro, escuro)] as [string, string]),
    ['docker-compose.emails.yml', composeOverride(tenant, lista)],
  ];

  for (const [arquivo, conteudo] of saidas) {
    const caminho = join(pasta, arquivo);
    if (checar) {
      if (!existsSync(caminho) || readFileSync(caminho, 'utf8') !== conteudo) {
        console.error(`desatualizado: tenants/${slug}/emails/${arquivo}`);
        desatualizados++;
      }
      continue;
    }
    mkdirSync(pasta, { recursive: true });
    writeFileSync(caminho, conteudo);
  }
  if (!checar) console.log(`✔ tenants/${slug}/emails/ (${saidas.length} arquivos)`);
}

if (checar && desatualizados) {
  console.error('Rode: bun scripts/emails/gerar-templates-email.ts');
  process.exit(1);
}
