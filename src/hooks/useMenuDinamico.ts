/**
 * Hook para montar menu dinâmico baseado em permissões
 * 
 * Combina a configuração estática do menu (adminMenuConfig)
 * com as permissões do usuário para filtrar itens visíveis.
 * 
 * O menu só exibe itens que o usuário tem permissão para acessar.
 */

import { useMemo } from 'react';
import { usePermissoesUsuario } from './usePermissoesUsuario';
import { 
  adminMenuConfig, 
  type AdminMenuItem, 
  type AdminMenuSection 
} from '@/config/adminMenu';

export interface MenuItemComPermissao extends AdminMenuItem {
  permissaoCodigo?: string;
  children?: MenuItemComPermissao[];
}

export interface MenuSectionComPermissao extends Omit<AdminMenuSection, 'items'> {
  items: MenuItemComPermissao[];
}

interface UseMenuDinamicoReturn {
  menuFiltrado: MenuSectionComPermissao[];
  loading: boolean;
  error: string | null;
  totalItensVisiveis: number;
}

/**
 * Mapeamento de IDs de menu para códigos de permissão
 * 
 * Este mapeamento conecta a configuração estática do menu
 * com os códigos de função no banco de dados.
 * 
 * Formato: { 'id-do-menu': 'codigo.da.funcao' }
 */
const MENU_PERMISSAO_MAP: Record<string, string> = {
  // Dashboard - geralmente acessível a todos autenticados
  'admin-home': 'admin.dashboard.visualizar',
  
  // Estrutura Organizacional
  'organograma': 'estrutura.organograma.visualizar',
  'gestao-organograma': 'estrutura.organograma.editar',
  'cargos': 'estrutura.cargos.visualizar',
  'lotacoes': 'estrutura.lotacoes.visualizar',
  'designacoes': 'rh.designacoes.visualizar',
  'portarias-rh': 'rh.portarias.visualizar',
  
  // Unidades Locais
  'gestao-unidades': 'unidades.gestao.visualizar',
  'relatorios-unidades': 'unidades.relatorios.visualizar',
  'cedencia-unidades': 'unidades.cedencia.visualizar',
  
  // Documentos
  'documentos': 'admin.documentos.visualizar',
  
  // Pessoas
  'pre-cadastros': 'rh.precadastros.visualizar',
  'reunioes': 'admin.reunioes.visualizar',
  'lista-servidores': 'rh.servidores.visualizar',
  'novo-servidor': 'rh.servidores.criar',
  'aniversariantes': 'rh.aniversariantes.visualizar',
  'ferias': 'rh.ferias.visualizar',
  'licencas': 'rh.licencas.visualizar',
  'frequencia': 'rh.frequencia.visualizar',
  'viagens': 'rh.viagens.visualizar',
  'modelos-documentos': 'rh.modelos.visualizar',
  'usuarios-servidores': 'admin.usuarios.visualizar',
  'usuarios-tecnicos': 'admin.usuarios.tecnicos',
  'gestao-folha': 'folha.gestao.visualizar',
  'configuracao-folha': 'folha.configuracao.visualizar',
  
  // Processos
  'compras': 'processos.compras.visualizar',
  'diarias': 'processos.diarias.visualizar',
  'patrimonio': 'processos.patrimonio.visualizar',
  'convenios': 'processos.convenios.visualizar',
  'almoxarifado': 'processos.almoxarifado.visualizar',
  'veiculos': 'processos.veiculos.visualizar',
  'pagamentos': 'processos.pagamentos.visualizar',
  
  // Governança
  'lei-criacao': 'governanca.lei.visualizar',
  'decreto': 'governanca.decreto.visualizar',
  'regimento': 'governanca.regimento.visualizar',
  'portarias': 'governanca.portarias.visualizar',
  'matriz-raci': 'governanca.raci.visualizar',
  'relatorio-governanca': 'governanca.relatorio.visualizar',
  
  // Integridade
  'denuncias': 'integridade.denuncias.visualizar',
  'gestao-denuncias': 'integridade.denuncias.gerenciar',
  
  // Transparência
  'cargos-remuneracao': 'transparencia.cargos.visualizar',
  
  // Programas
  'federacoes': 'programas.federacoes.visualizar',
  'bolsa-atleta': 'programas.bolsa.visualizar',
  'juventude-cidada': 'programas.juventude.visualizar',
  'esporte-comunidade': 'programas.esporte.visualizar',
  'jovem-empreendedor': 'programas.empreendedor.visualizar',
  'jogos-escolares': 'programas.jogos.visualizar',
  
  // ASCOM
  'demandas-ascom': 'ascom.demandas.visualizar',
  'nova-demanda-ascom': 'ascom.demandas.criar',
  
  // Relatórios
  'relatorios-rh': 'relatorios.rh.visualizar',
  'exportacao': 'relatorios.exportacao.visualizar',
  'pendencias': 'relatorios.pendencias.visualizar',
  
  // Sistema
  'aprovacoes': 'admin.aprovacoes.visualizar',
  'gestao-perfis': 'admin.perfis.visualizar',
  'controle-acesso': 'admin.acesso.visualizar',
  'auditoria': 'admin.auditoria.visualizar',
  'database': 'admin.database.visualizar',
  'backup': 'admin.backup.visualizar',
  'disaster-recovery': 'admin.disaster.visualizar',
  'ajuda': 'admin.ajuda.visualizar',
};

/**
 * IDs de menu que são sempre visíveis (não requerem permissão específica)
 */
const ITENS_SEMPRE_VISIVEIS = new Set([
  'admin-home', // Dashboard sempre acessível
]);

/**
 * IDs de seções que são sempre visíveis se tiverem pelo menos um item
 */
const SECOES_SEMPRE_VISIVEIS = new Set([
  'dashboard',
]);

export function useMenuDinamico(): UseMenuDinamicoReturn {
  const { permissoes, loading, error, temPermissao } = usePermissoesUsuario();

  const menuFiltrado = useMemo(() => {
    // Se não há permissões carregadas e está carregando, retorna vazio
    if (loading) {
      return [];
    }

    // Função para verificar se um item deve ser visível
    const itemVisivel = (item: AdminMenuItem): boolean => {
      // Itens sempre visíveis
      if (ITENS_SEMPRE_VISIVEIS.has(item.id)) {
        return true;
      }

      // Busca o código de permissão mapeado
      const codigoPermissao = MENU_PERMISSAO_MAP[item.id];
      
      // Se não tem mapeamento, assume visível (para não quebrar)
      if (!codigoPermissao) {
        return true;
      }

      // Verifica se usuário tem a permissão
      return temPermissao(codigoPermissao);
    };

    // Função para filtrar item e seus filhos recursivamente
    const filtrarItem = (item: AdminMenuItem): MenuItemComPermissao | null => {
      // Se tem filhos, filtra recursivamente
      if (item.children && item.children.length > 0) {
        const filhosFiltrados = item.children
          .map(filtrarItem)
          .filter((f): f is MenuItemComPermissao => f !== null);

        // Se nenhum filho visível, não mostra o pai
        if (filhosFiltrados.length === 0) {
          return null;
        }

        return {
          ...item,
          permissaoCodigo: MENU_PERMISSAO_MAP[item.id],
          children: filhosFiltrados,
        };
      }

      // Item sem filhos - verifica permissão
      if (!itemVisivel(item)) {
        return null;
      }

      return {
        ...item,
        permissaoCodigo: MENU_PERMISSAO_MAP[item.id],
      };
    };

    // Filtra todas as seções
    const secoesFiltradas: MenuSectionComPermissao[] = [];

    adminMenuConfig.forEach((section) => {
      const itensFiltrados = section.items
        .map(filtrarItem)
        .filter((item): item is MenuItemComPermissao => item !== null);

      // Só inclui seção se tem itens ou é sempre visível
      if (itensFiltrados.length > 0 || SECOES_SEMPRE_VISIVEIS.has(section.id)) {
        secoesFiltradas.push({
          ...section,
          items: itensFiltrados,
        });
      }
    });

    return secoesFiltradas;
  }, [permissoes, loading, temPermissao]);

  // Conta total de itens visíveis
  const totalItensVisiveis = useMemo(() => {
    let total = 0;
    
    const contarItens = (items: MenuItemComPermissao[]) => {
      items.forEach(item => {
        if (item.children) {
          contarItens(item.children);
        } else if (item.href) {
          total++;
        }
      });
    };

    menuFiltrado.forEach(section => contarItens(section.items));
    
    return total;
  }, [menuFiltrado]);

  return {
    menuFiltrado,
    loading,
    error,
    totalItensVisiveis,
  };
}
