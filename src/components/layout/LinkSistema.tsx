import * as React from "react";
import { Link } from "react-router-dom";
import { MODO_SITE, urlDoSistema } from "@/core/modo-app";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string };

/**
 * Link para uma tela do sistema interno. No build normal é um <Link> do roteador; no build `site` o sistema
 * está em outro endereço (VITE_APP_URL), então vira um <a> comum com a URL absoluta.
 */
export const LinkSistema = React.forwardRef<HTMLAnchorElement, Props>(({ to, ...resto }, ref) =>
  MODO_SITE ? <a ref={ref} href={urlDoSistema(to)} {...resto} /> : <Link ref={ref} to={to} {...resto} />,
);
LinkSistema.displayName = "LinkSistema";
