import { CalendarClock, FileUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type TomStatus } from "@/components/design-system";
import { ROTULOS_FREQUENCIA, type ItemRotina, type SituacaoRotina } from "@/lib/financeiro/rotinaAtualizacao";

const data = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

const SELO: Record<SituacaoRotina, { rotulo: string; tom: TomStatus }> = {
  em_dia: { rotulo: "Em dia", tom: "sucesso" },
  atrasado: { rotulo: "Atrasado", tom: "pendente" },
  nunca: { rotulo: "Nunca importado", tom: "erro" },
  sob_demanda: { rotulo: "Sob demanda", tom: "neutro" },
};

/** "fechada: setembro de 2026" (mensal) ou "importado em 23/10/2026" */
function textoUltima(item: ItemRotina, ultima: string | null): string {
  if (!ultima) return item.frequencia === "mensal" ? "Nenhum mês fechado" : "Nenhuma importação neste exercício";
  if (item.frequencia === "mensal") {
    const [ano, mes] = ultima.split("-").map(Number);
    return `Último mês fechado: ${mesAno.format(new Date(ano, mes - 1, 1))}`;
  }
  return `Última importação: ${data.format(new Date(ultima))}`;
}

interface CartaoRotinaProps {
  item: ItemRotina;
  ultima: string | null;
  situacao: SituacaoRotina;
  /** O usuário pode abrir o importador (ou a tela) deste item */
  podeAtualizar: boolean;
}

export function CartaoRotina({ item, ultima, situacao, podeAtualizar }: CartaoRotinaProps) {
  const selo = SELO[situacao];
  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-h3">{item.titulo}</CardTitle>
          <StatusBadge tom={selo.tom}>{selo.rotulo}</StatusBadge>
        </div>
        <CardDescription>{item.serve}</CardDescription>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="font-medium text-foreground">{ROTULOS_FREQUENCIA[item.frequencia]}</span>
          <span aria-hidden="true">·</span>
          <span>{textoUltima(item, ultima)}</span>
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <h3 className="mb-2 text-body font-medium text-foreground">Como fazer</h3>
        <ol className="list-decimal space-y-1 pl-5 text-body text-muted-foreground">
          {item.passos.map((passo) => (
            <li key={passo}>{passo}</li>
          ))}
        </ol>
      </CardContent>
      <CardFooter>
        {podeAtualizar ? (
          <Button asChild>
            <Link to={item.destino}>
              <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
              {item.rotuloBotao}
            </Link>
          </Button>
        ) : (
          <p className="text-caption text-muted-foreground">Você não tem permissão para atualizar este item.</p>
        )}
      </CardFooter>
    </Card>
  );
}
