/**
 * Modelos do Gerador de relatórios: prontos (do sistema), meus e do setor (relatorios_modelos).
 */

import { FileText, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModeloPronto } from "@/config/relatoriosDinamicos";
import type { ModeloRelatorio } from "@/hooks/useRelatoriosDinamicos";
import { cn } from "@/lib/utils";

interface ListaModelosProps {
  prontos: ModeloPronto[];
  salvos: ModeloRelatorio[];
  carregando: boolean;
  usuarioId: string | undefined;
  podeApagarDeOutros: boolean;
  selecionado: string | null;
  aoAbrirPronto: (m: ModeloPronto) => void;
  aoAbrirSalvo: (m: ModeloRelatorio) => void;
  aoApagar: (m: ModeloRelatorio) => void;
}

function Grupo({ titulo, vazio, children }: { titulo: string; vazio?: string; children: React.ReactNode[] }) {
  return (
    <section className="space-y-1.5">
      <h3 className="px-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h3>
      {children.length > 0 ? <ul className="space-y-0.5">{children}</ul> : <p className="px-2 text-caption text-muted-foreground">{vazio}</p>}
    </section>
  );
}

function Item({ ativo, titulo, detalhe, aoAbrir, acao }: { ativo: boolean; titulo: string; detalhe?: string; aoAbrir: () => void; acao?: React.ReactNode }) {
  return (
    <li className="group flex items-start gap-1">
      <button
        type="button"
        onClick={aoAbrir}
        aria-current={ativo ? "true" : undefined}
        className={cn(
          "flex-1 rounded-md px-2 py-1.5 text-left text-body transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          ativo && "bg-primary/10 font-medium text-primary",
        )}
      >
        <span className="block">{titulo}</span>
        {detalhe && <span className="block text-caption text-muted-foreground">{detalhe}</span>}
      </button>
      {acao}
    </li>
  );
}

export function ListaModelos({
  prontos,
  salvos,
  carregando,
  usuarioId,
  podeApagarDeOutros,
  selecionado,
  aoAbrirPronto,
  aoAbrirSalvo,
  aoApagar,
}: ListaModelosProps) {
  const meus = salvos.filter((m) => m.criado_por === usuarioId);
  const doSetor = salvos.filter((m) => m.criado_por !== usuarioId);
  const botaoApagar = (m: ModeloRelatorio) =>
    m.criado_por === usuarioId || podeApagarDeOutros ? (
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => aoApagar(m)} aria-label={`Apagar o modelo ${m.nome}`}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    ) : undefined;

  return (
    <nav aria-label="Modelos de relatório" className="space-y-5">
      <Grupo titulo="Prontos">
        {prontos.map((m) => (
          <Item key={m.id} ativo={selecionado === `pronto:${m.id}`} titulo={m.nome} detalhe={m.descricao} aoAbrir={() => aoAbrirPronto(m)} />
        ))}
      </Grupo>
      <Grupo titulo="Meus modelos" vazio={carregando ? "Carregando…" : "Nenhum ainda. Monte um relatório e clique em Salvar modelo."}>
        {meus.map((m) => (
          <Item
            key={m.id}
            ativo={selecionado === m.id}
            titulo={m.nome}
            detalhe={m.compartilhado ? "Compartilhado com o setor" : "Só seu"}
            aoAbrir={() => aoAbrirSalvo(m)}
            acao={botaoApagar(m)}
          />
        ))}
      </Grupo>
      <Grupo titulo="Do setor" vazio={carregando ? "Carregando…" : "Nenhum modelo compartilhado."}>
        {doSetor.map((m) => (
          <Item key={m.id} ativo={selecionado === m.id} titulo={m.nome} detalhe={m.descricao ?? undefined} aoAbrir={() => aoAbrirSalvo(m)} acao={botaoApagar(m)} />
        ))}
      </Grupo>
      <p className="flex items-start gap-1.5 px-2 text-caption text-muted-foreground">
        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Modelo do setor: quem tem acesso ao Financeiro vê e usa; só quem criou altera.
      </p>
      <p className="flex items-start gap-1.5 px-2 text-caption text-muted-foreground">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        O modelo guarda só a montagem. Os dados são sempre os de agora.
      </p>
    </nav>
  );
}
