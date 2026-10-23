import { CalendarClock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const data = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** QDD com mais de 7 dias fica em amarelo: o painel pode estar desatualizado. */
const DIAS_ALERTA = 7;

interface FaixaAtualizacaoProps {
  qdd: string | null;
  fip614: string | null;
  hoje: Date;
  /** Exercício já terminado: os dados não envelhecem mais, então não há aviso de atraso */
  encerrado?: boolean;
}

export function FaixaAtualizacao({ qdd, fip614, hoje, encerrado = false }: FaixaAtualizacaoProps) {
  const diasQdd = qdd ? Math.floor((hoje.getTime() - new Date(qdd).getTime()) / 86_400_000) : null;
  const atrasado = !encerrado && diasQdd !== null && diasQdd > DIAS_ALERTA;
  const Icone = atrasado ? AlertTriangle : CalendarClock;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-body",
        atrasado ? "border-warning bg-warning/10 text-warning" : "border-border bg-muted/40 text-muted-foreground",
      )}
      role="status"
    >
      <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {qdd ? `Dados do FIPLAN de ${data.format(new Date(qdd))} (QDD)` : "QDD ainda não importado neste exercício"}
        {" · "}
        {fip614 ? `empenhos de ${data.format(new Date(fip614))} (FIP 614)` : "FIP 614 ainda não importado"}
        {atrasado && ` · o QDD tem ${diasQdd} dias`}
      </span>
      <Link to="/admin/importacoes" className="font-medium underline underline-offset-2 hover:text-foreground">
        Atualizar na Central de Importações
      </Link>
    </div>
  );
}
