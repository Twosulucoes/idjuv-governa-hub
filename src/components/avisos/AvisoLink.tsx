/**
 * Link de um aviso: caminho interno (/...) vira navegação do app; https abre em nova aba.
 * O formato é garantido pelo CHECK da tabela e pelo formulário.
 */

import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvisoLinkProps {
  href: string;
  className?: string;
  onClick?: () => void;
}

export function AvisoLink({ href, className, onClick }: AvisoLinkProps) {
  const classe = cn("inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline", className);
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={classe} onClick={onClick}>
        Ver detalhes
      </Link>
    );
  }
  if (!href.startsWith("https://")) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classe} onClick={onClick}>
      Abrir link <ExternalLink className="h-3 w-3" />
    </a>
  );
}
