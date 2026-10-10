// Link "Pular para o conteúdo" (WCAG 2.4.1): primeiro item da tabulação nas telas públicas.
// O alvo precisa de id e tabIndex={-1} (ex.: <main id="conteudo" tabIndex={-1}>).
export interface SkipLinkProps {
  /** id do elemento que recebe o foco. Padrão: "conteudo". */
  alvo?: string;
  rotulo?: string;
}

export function SkipLink({ alvo = "conteudo", rotulo = "Pular para o conteúdo" }: SkipLinkProps) {
  return (
    <a
      href={`#${alvo}`}
      onClick={(e) => {
        // Foca o alvo sem mexer no hash da URL (rotas do react-router)
        e.preventDefault();
        document.getElementById(alvo)?.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {rotulo}
    </a>
  );
}
