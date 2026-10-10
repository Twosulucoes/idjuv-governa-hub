import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { abrirArquivoArbitro, useArquivoArbitro } from "@/hooks/useArquivoArbitro";

// Arquivos do bucket privado arbitros-docs: imagem e link com URL assinada (ver useArquivoArbitro).

export function ImagemArbitro({ referencia, className, alt = "Foto" }: { referencia: string; className?: string; alt?: string }) {
  const { data: src, isLoading } = useArquivoArbitro(referencia);
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)} aria-label={alt}>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} />;
}

export function LinkArquivoArbitro({ referencia, className, children }: { referencia: string; className?: string; children: React.ReactNode }) {
  async function abrir() {
    try {
      await abrirArquivoArbitro(referencia);
    } catch (e) {
      toast.error("Não foi possível abrir o arquivo: " + (e as Error).message);
    }
  }
  return (
    <button type="button" onClick={abrir} className={cn("text-left", className)}>
      {children}
    </button>
  );
}
