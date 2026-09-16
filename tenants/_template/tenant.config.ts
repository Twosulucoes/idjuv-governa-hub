/**
 * PERFIL DO TENANT — TEMPLATE
 *
 * Ponto de partida para uma instituição nova. Para provisionar um cliente:
 *
 *   cp -r tenants/_template tenants/<slug>
 *   # preencher os campos abaixo e trocar os assets em tenants/<slug>/assets/
 *   # registrar o slug em tenants/index.ts
 *   # apontar VITE_TENANT_SLUG=<slug> no .env do deploy
 *
 * Os valores aqui são NEUTROS de propósito: se alguém clonar o repositório sem
 * configurar nada, deve obter um sistema sem marca — nunca a marca de outro
 * cliente. Ver docs/WHITE_LABEL.md §3.
 */

import type { TenantConfig } from '@/core/tenant/types';

export const templateConfig: TenantConfig = {
  slug: '_template',

  identidade: {
    nomeOficial: 'Instituição',
    nomeCurto: 'Instituição',
    sigla: 'ORG',
    naturezaJuridica: '',
    tratamentoDirigente: 'O DIRIGENTE MÁXIMO DA INSTITUIÇÃO',
  },

  // Sem co-branding por padrão: nem todo cliente é vinculado a um ente superior.
  entidadeSuperior: undefined,

  marca: {
    // Azul-cinza neutro de produto — deliberadamente sem personalidade.
    corPrimariaHex: '#334155',

    paleta: {
      light: {
        primary: '215 25% 27%',
        primaryForeground: '0 0% 100%',
        secondary: '215 16% 47%',
        secondaryForeground: '0 0% 100%',
        accent: '215 20% 65%',
        accentForeground: '215 25% 27%',
        highlight: '43 96% 56%',
        highlightForeground: '215 25% 27%',
        success: '142 71% 45%',
        successForeground: '0 0% 100%',
        warning: '38 92% 50%',
        warningForeground: '215 25% 27%',
        info: '199 89% 48%',
        infoForeground: '0 0% 100%',
        ring: '215 25% 27%',
        sidebarBackground: '215 25% 27%',
        sidebarForeground: '210 20% 95%',
        sidebarPrimary: '215 20% 65%',
        sidebarPrimaryForeground: '0 0% 100%',
        sidebarAccent: '199 89% 48%',
        sidebarAccentForeground: '0 0% 100%',
        sidebarBorder: '215 20% 38%',
        sidebarRing: '215 20% 65%',
      },
      dark: {
        primary: '213 27% 84%',
        primaryForeground: '215 28% 17%',
        secondary: '215 20% 65%',
        secondaryForeground: '215 28% 17%',
        accent: '215 16% 47%',
        accentForeground: '210 20% 98%',
        highlight: '43 96% 62%',
        highlightForeground: '215 28% 17%',
        success: '142 69% 58%',
        successForeground: '215 28% 17%',
        warning: '38 92% 60%',
        warningForeground: '215 28% 17%',
        info: '199 89% 60%',
        infoForeground: '215 28% 17%',
        ring: '213 27% 84%',
        sidebarBackground: '215 28% 12%',
        sidebarForeground: '210 20% 96%',
        sidebarPrimary: '215 20% 65%',
        sidebarPrimaryForeground: '215 28% 17%',
        sidebarAccent: '215 20% 30%',
        sidebarAccentForeground: '210 20% 96%',
        sidebarBorder: '215 20% 20%',
        sidebarRing: '215 20% 65%',
      },
    },

    proporcaoLogo: {
      // Logo quadrada por padrão. Ajuste para a proporção real do arquivo,
      // senão os PDFs distorcem a imagem.
      orgao: 1,
    },
  },

  endereco: {},
  contato: {},
  legal: {},
  integracoes: {},

  // Comece pelo núcleo genérico. Módulos da vertical de esporte
  // (`organizacoes`, `arbitros`, `gestores_escolares`, `programas`) só fazem
  // sentido para institutos do ramo — adicione se o cliente contratou.
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
    'gabinete',
  ],

  verticais: ['generico'],

  features: {
    portalPublico: false,
    transparenciaLai: true,
    folhaPagamento: true,
    esocial: false,
    patrimonioMobile: false,
  },
};

export default templateConfig;
