/**
 * Convênios federais: propostas, emendas e convênios da instituição no Transferegov (antigo Siconv), com os prazos
 * de vigência e de prestação de contas. Só leitura; a rotina diária (GitHub Actions) troca o espelho.
 * Spec docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Handshake, Info, Landmark, Wallet, AlertTriangle } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BotaoAtualizarConvenios } from "@/components/financeiro/convenios/BotaoAtualizarConvenios";
import { MudancasConvenios } from "@/components/financeiro/convenios/MudancasConvenios";
import {
  useConveniosFederais,
  useUltimaSincronizacaoTransferegov,
  type PropostaComConvenio,
} from "@/hooks/useConveniosFederais";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { dataBR } from "@/lib/bancario/exibicao";
import { alertasConvenio, espelhoDesatualizado } from "@/lib/financeiro/conveniosFederais";
import { formatCurrency } from "@/lib/formatters";

const colunas: ColunaTabela<PropostaComConvenio>[] = [
  {
    id: "objeto",
    cabecalho: "Objeto",
    celula: (p) => (
      <span className="block max-w-[320px]">
        <span className="line-clamp-2" title={p.objeto ?? undefined}>{p.objeto ?? "—"}</span>
        <span className="block text-xs text-muted-foreground">{p.orgao_superior ?? p.orgao ?? ""}</span>
      </span>
    ),
    ordenarPor: (p) => p.objeto,
    buscarPor: (p) => `${p.objeto ?? ""} ${p.orgao_superior ?? ""} ${p.orgao ?? ""}`,
    mobile: "titulo",
  },
  {
    id: "numeros",
    cabecalho: "Proposta / convênio",
    celula: (p) => (
      <span className="font-mono text-xs">
        {p.numero}
        <span className="block text-muted-foreground">{p.convenio ? `Convênio ${p.convenio.numero}` : "Sem convênio"}</span>
      </span>
    ),
    ordenarPor: (p) => p.numero,
    buscarPor: (p) => `${p.numero} ${p.convenio?.numero ?? ""} ${p.emendas.map((e) => `${e.numero_emenda} ${e.parlamentar ?? ""}`).join(" ")}`,
  },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (p) => (
      <span className="block max-w-[220px] text-sm">{p.convenio?.situacao || p.situacao || "—"}</span>
    ),
    ordenarPor: (p) => p.convenio?.situacao || p.situacao,
  },
  {
    id: "valor",
    cabecalho: "Valor global",
    celula: (p) => <span className="tabular-nums">{formatCurrency(Number(p.convenio?.valor_global ?? p.valor_global ?? 0))}</span>,
    ordenarPor: (p) => Number(p.convenio?.valor_global ?? p.valor_global ?? 0),
    alinhamento: "direita",
  },
  {
    id: "recebido",
    cabecalho: "Recebido",
    celula: (p) => <span className="tabular-nums">{formatCurrency(Number(p.convenio?.valor_desembolsado ?? 0))}</span>,
    ordenarPor: (p) => Number(p.convenio?.valor_desembolsado ?? 0),
    alinhamento: "direita",
  },
  {
    id: "vigencia",
    cabecalho: "Fim da vigência",
    celula: (p) => dataBR(p.convenio?.fim_vigencia ?? p.fim_vigencia),
    ordenarPor: (p) => p.convenio?.fim_vigencia ?? p.fim_vigencia,
  },
  {
    id: "alertas",
    cabecalho: "Atenção",
    celula: (p) => {
      const alertas = alertasConvenio(p.convenio);
      if (!alertas.length) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="flex flex-col items-start gap-1">
          {alertas.map((a) => (
            <StatusBadge key={a.texto} tom={a.tom}>{a.texto}</StatusBadge>
          ))}
        </span>
      );
    },
    ordenarPor: (p) => alertasConvenio(p.convenio).length,
  },
];

export default function ConveniosFederaisPage() {
  const navigate = useNavigate();
  const { comExercicio } = useExercicioFinanceiro();
  const propostas = useConveniosFederais();
  const [aguardandoDesde, setAguardandoDesde] = useState<number | null>(null);
  const sincronizacao = useUltimaSincronizacaoTransferegov(aguardandoDesde !== null);
  const lista = propostas.data ?? [];
  const ultima = sincronizacao.data;

  const soma = (f: (p: PropostaComConvenio) => number | null | undefined) => lista.reduce((t, p) => t + Number(f(p) ?? 0), 0);
  const viraramConvenio = lista.filter((p) => p.convenio).length;
  const comAlerta = lista.filter((p) => alertasConvenio(p.convenio).length > 0).length;
  const carregando = propostas.isLoading;

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Convênios federais" }]}
          titulo="Convênios federais"
          descricao="Propostas, emendas e convênios com a União, lidos todo dia do Transferegov"
          acoes={
            <BotaoAtualizarConvenios
              ultimaExecutadaEm={ultima?.executada_em}
              aguardandoDesde={aguardandoDesde}
              aoMudarAguardando={setAguardandoDesde}
            />
          }
        />

        {!sincronizacao.isLoading && espelhoDesatualizado(ultima?.executada_em) && (
          <Alert>
            <Info className="h-4 w-4" aria-hidden />
            <AlertTitle>{ultima ? "Dados do Transferegov desatualizados" : "Ainda sem dados do Transferegov"}</AlertTitle>
            <AlertDescription>
              {ultima
                ? `A última leitura foi em ${dataBR(ultima.executada_em)}. A rotina roda todo dia às 9h; peça ao administrador do sistema para conferir a rotina "Convênios federais (Transferegov)".`
                : 'A rotina diária "Convênios federais (Transferegov)" ainda não rodou. O administrador do sistema precisa configurá-la uma vez.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard rotulo="Propostas" valor={lista.length} detalhe={viraramConvenio === 1 ? "1 virou convênio" : `${viraramConvenio} viraram convênio`} icone={Handshake} carregando={carregando} />
          <KpiCard rotulo="Valor global" valor={formatCurrency(soma((p) => p.convenio?.valor_global ?? p.valor_global))} icone={Landmark} carregando={carregando} />
          <KpiCard
            rotulo="Recebido da União"
            valor={formatCurrency(soma((p) => p.convenio?.valor_desembolsado))}
            detalhe={`Empenhado pela União: ${formatCurrency(soma((p) => p.convenio?.valor_empenhado))}`}
            icone={Wallet}
            carregando={carregando}
          />
          <KpiCard rotulo="Pedem atenção" valor={comAlerta} detalhe="Prazo perto ou sem assinatura" icone={AlertTriangle} carregando={carregando} />
        </div>

        <DataTable
          rotulo="Convênios federais"
          dados={lista}
          colunas={colunas}
          chaveLinha={(p) => String(p.id_proposta)}
          carregando={carregando}
          erro={propostas.isError ? "Verifique sua conexão e tente novamente." : null}
          aoTentarNovamente={() => propostas.refetch()}
          busca={{ placeholder: "Buscar por objeto, número, emenda, parlamentar..." }}
          aoClicarLinha={(p) => navigate(`/financeiro/convenios/${p.id_proposta}`)}
          vazio={{
            icone: Handshake,
            titulo: "Nenhuma proposta no Transferegov",
            descricao: ultima
              ? `A leitura de ${dataBR(ultima.data_carga ?? ultima.executada_em)} não achou propostas do CNPJ da instituição.`
              : "Os dados aparecem aqui depois da primeira leitura da rotina diária.",
          }}
          acoesLinha={(p) => (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/financeiro/convenios/${p.id_proposta}`} aria-label={`Ver proposta ${p.numero}`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        />

        <MudancasConvenios />

        {ultima && (
          <p className="text-xs text-muted-foreground">
            Fonte: Transferegov (dados abertos), carga de {dataBR(ultima.data_carga ?? ultima.executada_em)}. Lido pelo
            sistema em {new Date(ultima.executada_em).toLocaleString("pt-BR")}.
          </p>
        )}
      </div>
    </ModuleLayout>
  );
}
