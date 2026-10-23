import { Link } from "react-router-dom";
import { CheckCircle2, CreditCard, DollarSign, FileText, Lock, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KpiCard } from "@/components/design-system";
import { formatCurrency } from "@/lib/formatters";
import type { ResumoExecucao } from "@/lib/financeiro/painelExecucao";

const percentual = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

interface Cartao {
  rotulo: string;
  valor: string;
  detalhe?: string;
  icone: LucideIcon;
  href: string;
}

interface CartoesExecucaoProps {
  resumo: ResumoExecucao | null;
  carregando: boolean;
  comExercicio: (href: string) => string;
}

export function CartoesExecucao({ resumo, carregando, comExercicio }: CartoesExecucaoProps) {
  // Sem dado mostra "—" em vez de um zero que parece real
  const moeda = (v: number | undefined) => (resumo ? formatCurrency(v ?? 0) : "—");
  const doAutorizado = (v: number | undefined) => (resumo ? `${percentual.format(v ?? 0)}% do autorizado` : undefined);

  const cartoes: Cartao[] = [
    { rotulo: "Autorizado", valor: moeda(resumo?.autorizado), icone: DollarSign, href: "/financeiro/qdd" },
    {
      rotulo: "Empenhado",
      valor: moeda(resumo?.empenhado),
      detalhe: doAutorizado(resumo?.pctEmpenhado),
      icone: FileText,
      href: "/financeiro/empenhos",
    },
    {
      rotulo: "Liquidado",
      valor: moeda(resumo?.liquidado),
      detalhe: doAutorizado(resumo?.pctLiquidado),
      icone: CheckCircle2,
      href: "/financeiro/liquidacoes",
    },
    {
      rotulo: "Pago",
      valor: moeda(resumo?.pago),
      detalhe: doAutorizado(resumo?.pctPago),
      icone: CreditCard,
      href: "/financeiro/pagamentos",
    },
    {
      rotulo: "Saldo para empenhar",
      valor: moeda(resumo?.saldoEmpenhar),
      detalhe: resumo ? "descontados bloqueio e PED" : undefined,
      icone: Wallet,
      href: "/financeiro/qdd",
    },
    {
      rotulo: "Reservado (PED)",
      valor: moeda(resumo?.reservado),
      detalhe: resumo ? `bloqueado: ${formatCurrency(resumo.bloqueado)}` : undefined,
      icone: Lock,
      href: "/financeiro/qdd",
    },
  ];

  return (
    <section aria-labelledby="fin-indicadores">
      <h2 id="fin-indicadores" className="sr-only">
        Números da execução
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cartoes.map((c) => (
          <li key={c.rotulo}>
            <Link
              to={comExercicio(c.href)}
              className="block h-full rounded-lg transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <KpiCard
                rotulo={c.rotulo}
                valor={c.valor}
                detalhe={c.detalhe}
                icone={c.icone}
                carregando={carregando}
                className="h-full"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
