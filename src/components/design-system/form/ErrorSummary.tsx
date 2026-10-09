import * as React from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErroCampo {
  campo: string;
  mensagem: string;
}

/** Achata os erros do react-hook-form (inclusive aninhados e arrays) em `campo.sub.0`. */
function achatar(erros: FieldErrors, prefixo = ""): ErroCampo[] {
  const lista: ErroCampo[] = [];
  for (const [chave, valor] of Object.entries(erros)) {
    // `ref`/`type`/`types` são metadados do erro, não campos (o `ref` é um nó do DOM).
    if (!valor || (prefixo && (chave === "ref" || chave === "type" || chave === "types"))) continue;
    const campo = prefixo ? `${prefixo}.${chave}` : chave;
    if (typeof valor === "object" && "message" in valor && typeof valor.message === "string") {
      lista.push({ campo, mensagem: valor.message });
    } else if (typeof valor === "object") {
      lista.push(...achatar(valor as FieldErrors, campo));
    }
  }
  return lista;
}

export interface ErrorSummaryProps<T extends FieldValues> {
  /** `form.formState.errors` */
  erros: FieldErrors<T>;
  /** `form.formState.submitCount`: a cada envio com erro o resumo recebe o foco. */
  envios: number;
  /** Nome legível de cada campo (ex.: `{ cpf: "CPF" }`). Sem ele, usa a chave. */
  rotulos?: Partial<Record<string, string>>;
  titulo?: string;
  className?: string;
}

/**
 * Resumo de erros no topo do formulário: recebe o foco após um envio com erro
 * e cada item leva ao campo. Complementa (não substitui) o erro junto do campo.
 * No `useForm`, passe `shouldFocusError: false` para o foco ir ao resumo. Campos
 * sem `name` nativo (Select, Checkbox do Radix) precisam de `id` ou `data-campo`
 * igual ao nome do campo para o link funcionar.
 */
export function ErrorSummary<T extends FieldValues>({
  erros,
  envios,
  rotulos,
  titulo = "Corrija os campos abaixo para continuar",
  className,
}: ErrorSummaryProps<T>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const lista = achatar(erros as FieldErrors);
  const idTitulo = React.useId();

  // Foca uma vez por envio com erro. O react-hook-form pode atualizar
  // `submitCount` e `errors` em renders separados, por isso a dupla dependência.
  const focadoNoEnvio = React.useRef(0);
  const temErros = lista.length > 0;
  React.useEffect(() => {
    if (envios > 0 && temErros && focadoNoEnvio.current !== envios) {
      focadoNoEnvio.current = envios;
      // Próximo frame: o react-hook-form foca o 1º campo inválido depois do
      // commit; use `shouldFocusError: false` no useForm para evitar a disputa.
      const quadro = requestAnimationFrame(() => ref.current?.focus());
      return () => cancelAnimationFrame(quadro);
    }
  }, [envios, temErros]);

  if (lista.length === 0 || envios === 0) return null;

  // Procura o campo dentro do próprio formulário: por `name` (inputs nativos)
  // ou por `id`/`data-campo` (Select, Checkbox, datas — controles sem `name`).
  function irPara(campo: string) {
    const escopo: ParentNode = ref.current?.closest("form") ?? document;
    const nome = CSS.escape(campo);
    const alvo = escopo.querySelector<HTMLElement>(`[name="${nome}"], #${nome}, [data-campo="${nome}"]`);
    alvo?.focus();
    alvo?.scrollIntoView({ block: "center" });
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-labelledby={idTitulo}
      className={cn(
        "rounded-md border border-destructive/40 bg-destructive/10 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <p id={idTitulo} className="flex items-center gap-2 text-h3 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        {titulo}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-9 text-body">
        {lista.map(({ campo, mensagem }) =>
          campo === "root" || campo.startsWith("root.") ? (
            <li key={campo}>{mensagem}</li>
          ) : (
          <li key={campo}>
            <a
              href={`#${campo}`}
              onClick={(e) => {
                e.preventDefault();
                irPara(campo);
              }}
              className="text-destructive underline underline-offset-2 hover:no-underline"
            >
              {rotulos?.[campo] ? `${rotulos[campo]}: ` : ""}
              {mensagem}
            </a>
          </li>
          ),
        )}
      </ul>
    </div>
  );
}
