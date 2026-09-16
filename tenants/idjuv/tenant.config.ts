/**
 * PERFIL DO TENANT — IDJUV
 *
 * Instituto de Desporto, Juventude e Lazer do Estado de Roraima.
 *
 * Fase 0 do White Label: este arquivo ESPELHA o estado atual do sistema. Os
 * valores foram extraídos de:
 *   - paleta        → src/index.css (blocos :root e .dark)
 *   - legal/contato → src/hooks/useDadosOficiais.ts (FALLBACK_DATA)
 *   - redes sociais → src/pages/portal/components/PortalFooter.tsx
 *   - proporções    → src/lib/pdfLogos.ts (LOGO_ASPECTOS)
 *   - módulos       → src/shared/config/modules.config.ts (MODULOS)
 *
 * Nenhum valor foi alterado — trocar qualquer um aqui muda o comportamento.
 */

import type { TenantConfig } from '@/core/tenant/types';

// Imagens da instituição. O bundler resolve cada import numa URL final com
// hash — é assim que o núcleo consome marca sem conhecer caminho de cliente.
import logoLight from './assets/logo-light.png';
import logoDark from './assets/logo-dark.png';
import entidadeSuperiorLight from './assets/entidade-superior.jpg';
import entidadeSuperiorDark from './assets/entidade-superior-dark.png';
import favicon from './assets/favicon.png';
import appleTouchIcon from './assets/apple-touch-icon.png';
import pwa192 from './assets/pwa-192x192.png';
import pwa512 from './assets/pwa-512x512.png';

export const idjuvConfig: TenantConfig = {
  slug: 'idjuv',

  identidade: {
    nomeOficial:
      'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv',
    nomeCurto: 'IDJuv',
    sigla: 'IDJUV',
    naturezaJuridica: 'Autarquia Estadual',
    tratamentoDirigente:
      'O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv',
  },

  entidadeSuperior: {
    nome: 'Governo do Estado de Roraima',
    exibirEmDocumentos: true,
  },

  marca: {
    assets: {
      logoLight,
      logoDark,
      entidadeSuperiorLight,
      entidadeSuperiorDark,
      favicon,
      appleTouchIcon,
      pwa192,
      pwa512,
    },

    /**
     * COR INSTITUCIONAL CANÔNICA: azul #164069 (hsl 210 65% 25%).
     *
     * Este é o desempate das três paletas divergentes que existiam:
     *   - src/index.css `--primary: 210 65% 25%`  → azul  (ADOTADA)
     *   - src/lib/pdfTemplate.ts `CORES.primaria` → #004444 verde-petróleo
     *   - index.html `theme-color`                → #1e40af azul (outro tom)
     *
     * PDFs e metadados ainda usam os valores antigos: migrá-los é a Fase 4,
     * porque muda o visual de documentos já emitidos. A partir daqui, o azul
     * abaixo é a única fonte de verdade da cor institucional.
     */
    corPrimariaHex: '#164069',

    paleta: {
      light: {
        primary: '210 65% 25%',
        primaryForeground: '0 0% 100%',
        secondary: '120 50% 38%',
        secondaryForeground: '0 0% 100%',
        accent: '200 85% 50%',
        accentForeground: '0 0% 100%',
        highlight: '48 95% 50%',
        highlightForeground: '210 50% 18%',
        success: '120 50% 38%',
        successForeground: '0 0% 100%',
        warning: '48 95% 50%',
        warningForeground: '210 50% 18%',
        info: '200 85% 50%',
        infoForeground: '0 0% 100%',
        ring: '210 65% 25%',
        sidebarBackground: '210 65% 25%',
        sidebarForeground: '200 15% 95%',
        sidebarPrimary: '120 50% 45%',
        sidebarPrimaryForeground: '0 0% 100%',
        sidebarAccent: '200 85% 50%',
        sidebarAccentForeground: '0 0% 100%',
        sidebarBorder: '210 50% 35%',
        sidebarRing: '120 50% 45%',
      },
      dark: {
        primary: '200 85% 55%',
        primaryForeground: '210 30% 8%',
        secondary: '120 55% 50%',
        secondaryForeground: '210 30% 8%',
        accent: '200 90% 60%',
        accentForeground: '210 30% 8%',
        highlight: '48 95% 55%',
        highlightForeground: '210 30% 8%',
        success: '120 60% 50%',
        successForeground: '210 30% 8%',
        warning: '48 95% 55%',
        warningForeground: '210 30% 8%',
        info: '200 90% 60%',
        infoForeground: '210 30% 8%',
        ring: '200 85% 55%',
        sidebarBackground: '210 30% 10%',
        sidebarForeground: '200 20% 96%',
        sidebarPrimary: '120 55% 50%',
        sidebarPrimaryForeground: '210 30% 8%',
        sidebarAccent: '200 50% 35%',
        sidebarAccentForeground: '200 20% 96%',
        sidebarBorder: '210 20% 18%',
        sidebarRing: '120 55% 50%',
      },
    },

    proporcaoLogo: {
      orgao: 1.55,
      entidadeSuperior: 3.69,
    },
  },

  endereco: {
    logradouro: 'Av. Brigadeiro Eduardo Gomes',
    numero: '3232',
    complemento: 'Anexo IDJuv',
    bairro: 'Estados',
    cep: '69.305-455',
    cidade: 'Boa Vista',
    uf: 'RR',
    pais: 'Brasil',
  },

  contato: {
    email: 'idjuv.gab@gmail.com',
    telefone: '(95) 9133-0044',
    emailSuporte: 'ti@idjuv.rr.gov.br',
    redesSociais: {
      instagram: 'idjuv_rr',
      facebook: 'idjuvrr',
      youtube: '@idjuv_rr',
      twitter: 'idjuv_rr',
    },
  },

  legal: {
    cnpj: '64.689.510/0001-09',
    dataCriacao: '29/12/2025',
    atividadePrincipal: '84.11-6-00 - Administração pública em geral',
    vinculacao: 'Secretaria de Estado da Educação e Desporto – SEED',
    leiCriacao: 'Lei nº 2.301, de 29 de dezembro de 2025',
    decretoRegulamentacao: 'Decreto nº 39.840-E, de 23 de janeiro de 2026',
    dirigenteNome: 'Marcelo de Magalhães Nunes',
    dirigenteCargo: 'Presidente',
    dirigenteDecretoNomeacao: 'Decreto nº 86-P, de 12 de janeiro de 2026',
  },

  integracoes: {
    diarioOficialUrl: 'https://diario.rr.gov.br',
    portalTransparenciaUrl: 'https://transparencia.rr.gov.br',
  },

  // Estado atual: todos os 17 módulos habilitados.
  // O guard por módulo entra na Fase 6 — hoje esta lista é informativa.
  modulos: [
    'admin',
    'rh',
    'workflow',
    'compras',
    'contratos',
    'financeiro',
    'patrimonio',
    'governanca',
    'integridade',
    'transparencia',
    'comunicacao',
    'programas',
    'gestores_escolares',
    'organizacoes',
    'gabinete',
    'patrimonio_mobile',
    'arbitros',
  ],

  verticais: ['esporte'],

  features: {
    portalPublico: true,
    transparenciaLai: true,
    folhaPagamento: true,
    esocial: true,
    patrimonioMobile: true,
  },
};

export default idjuvConfig;
