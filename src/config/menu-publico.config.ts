/**
 * Menu do portal público (cabeçalho do site). Só entra aqui rota pública, com PublicPageGuard no App.tsx:
 * telas do sistema interno ficam no menu do sistema (menu.config.ts / module-menus.config.ts).
 * O teste menu-publico.config.test.ts reprova item que aponte para rota protegida.
 *
 * `chave` liga o item à tabela config_menu_publico (visibilidade controlada em /admin/menu-site).
 */
import { FileText, Scale, Eye, Link2, AlertTriangle, type LucideIcon } from "lucide-react";

export interface ItemMenuPublico {
  title: string;
  chave: string;
  icon: LucideIcon;
  href: string;
  items?: { title: string; href: string }[];
}

export const MENU_PUBLICO: ItemMenuPublico[] = [
  {
    title: "Editais",
    chave: "editais",
    icon: FileText,
    href: "/editais",
  },
  {
    title: "Base Legal",
    chave: "base_legal",
    icon: Scale,
    href: "/base-legal",
    items: [
      { title: "Lei de Criação", href: "/governanca/lei-criacao" },
      { title: "Decreto Regulamentador", href: "/governanca/decreto" },
    ],
  },
  {
    title: "Links Úteis",
    chave: "links_uteis",
    icon: Link2,
    href: "/links-uteis",
  },
  {
    title: "Canal de Denúncias",
    chave: "integridade",
    icon: AlertTriangle,
    href: "/integridade/denuncias",
  },
  {
    title: "Transparência",
    chave: "transparencia",
    icon: Eye,
    href: "/transparencia",
  },
];

/** Chaves de config_menu_publico que ainda existem no menu (as demais linhas da tabela não fazem efeito). */
export const CHAVES_MENU_PUBLICO = MENU_PUBLICO.map((item) => item.chave);
