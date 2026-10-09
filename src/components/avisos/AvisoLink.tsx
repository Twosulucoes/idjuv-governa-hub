/**
 * Link de um aviso: caminho interno (/...) vira navegação do app; https abre em nova aba.
 * Links fora da regra (//host, javascript:...) não são renderizados, mesmo que venham do banco.
 */

import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { linkAvisoValido } from "@/types/avisos";

interface AvisoLinkProps {
  href: string;
  className?: string;
  onClick?: () => void;
}

export function AvisoLink({ href, className, onClick }: AvisoLinkProps) {
  if (!linkAvisoValido(href)) return null;
  const classe = cn("inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline", className);
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={classe} onClick={onClick}>
        Ver detalhes
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classe} onClick={onClick}>
      Abrir link <ExternalLink className="h-3 w-3" />
    </a>
  );
}
