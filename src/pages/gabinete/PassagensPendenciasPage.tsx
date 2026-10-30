/**
 * Pendências da prestação de contas das passagens: quem voltou e ainda não entregou o cartão de embarque ou o
 * relatório, com o vencimento e os dias de atraso (pedidos emitidos). O administrador ajusta o prazo em dias.
 * Regras em src/lib/passagens/prestacao.ts; plano docs/superpowers/plans/2026-10-25-contratos-passagens-entrega2.md.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateBR } from "@/lib/formatters";
import { PRAZO_PADRAO_DIAS, ROTULO_PENDENCIA, pendenciasDoPedido, type PendenciaDoPedido } from "@/lib/passagens/prestacao";
import { usePedidosParaPendencias, usePrazoPrestacao, useRelatorioRh, useSalvarPrazoPrestacao } from "@/hooks/usePassagens";
import type { PedidoParaPendencias } from "@/types/passagens";

type Linha = PendenciaDoPedido & { pedido: PedidoParaPendencias; chave: string };

const hoje = () => new Date().toLocaleDateString("sv-SE");

function PrazoAdmin({ prazo }: { prazo: number }) {
  const salvar = useSalvarPrazoPrestacao();
  const [valor, setValor] = useState(String(prazo));
  useEffect(() => setValor(String(prazo)), [prazo]);
  const n = Number(valor);
  const valido = Number.isInteger(n) && n >= 1 && n <= 365;
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="prazo-dias">Prazo da prestação (dias corridos depois da volta)</Label>
          <Input id="prazo-dias" type="number" min={1} max={365} className="sm:w-32" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <Button variant="outline" disabled={!valido || n === prazo || salvar.isPending} onClick={() => salvar.mutate(n)}>
          Salvar prazo
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PassagensPendenciasPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const pedidos = usePedidosParaPendencias();
  const prazo = usePrazoPrestacao();
  const servidores = useMemo(
    () => (pedidos.data ?? []).flatMap((p) => p.passageiros.filter((x) => x.servidor_id && x.viagem_id).map((x) => x.id)),
    [pedidos.data],
  );
  const rh = useRelatorioRh(servidores);
  const [soAtrasados, setSoAtrasados] = useState(false);
  const prazoDias = prazo.data ?? PRAZO_PADRAO_DIAS;

  const linhas = useMemo<Linha[]>(() => {
    const ctx = { prazoDias, hoje: hoje(), relatorioRh: rh.data ?? {} };
    return (pedidos.data ?? [])
      .flatMap((p) => pendenciasDoPedido(p, ctx).map((x) => ({ ...x, pedido: p, chave: `${p.id}-${x.passageiroId ?? "grupo"}-${x.tipo}` })))
      .filter((l) => !soAtrasados || l.diasAtraso > 0)
      .sort((a, b) => b.diasAtraso - a.diasAtraso || a.vencimento.localeCompare(b.vencimento));
  }, [pedidos.data, rh.data, prazoDias, soAtrasados]);

  const colunas: ColunaTabela<Linha>[] = [
    {
      id: "passageiro",
      cabecalho: "Passageiro",
      celula: (l) => <span className="font-medium">{l.nome ?? "Grupo (responsável da delegação)"}</span>,
      ordenarPor: (l) => l.nome ?? "",
      buscarPor: (l) => `${l.nome ?? ""} ${l.pedido.numero_sei} ${l.pedido.evento ?? ""} ${l.pedido.solicitante_nome ?? ""}`,
      mobile: "titulo",
    },
    {
      id: "pedido",
      cabecalho: "Pedido",
      celula: (l) => (
        <span>
          {l.pedido.evento ?? "—"}
          <span className="block text-xs text-muted-foreground">Processo SEI {l.pedido.numero_sei}</span>
        </span>
      ),
      ordenarPor: (l) => l.pedido.numero_sei,
    },
    { id: "falta", cabecalho: "O que falta", celula: (l) => ROTULO_PENDENCIA[l.tipo], ordenarPor: (l) => l.tipo },
    { id: "vence", cabecalho: "Vence em", celula: (l) => <span className="tabular-nums">{formatDateBR(l.vencimento)}</span>, ordenarPor: (l) => l.vencimento },
    {
      id: "atraso",
      cabecalho: "Atraso",
      celula: (l) =>
        l.diasAtraso > 0
          ? <StatusBadge tom="erro">{l.diasAtraso} {l.diasAtraso === 1 ? "dia" : "dias"}</StatusBadge>
          : <StatusBadge tom="pendente">No prazo</StatusBadge>,
      ordenarPor: (l) => -l.diasAtraso,
      alinhamento: "direita",
    },
  ];

  return (
    <ModuleLayout module="gabinete">
      <div className="space-y-6">
        <PageHeader
          titulo="Pendências de passagens"
          descricao="Quem já voltou e ainda não entregou o cartão de embarque ou o relatório"
          migalhas={[
            { rotulo: "Gabinete", href: "/gabinete" },
            { rotulo: "Passagens aéreas", href: "/gabinete/passagens" },
            { rotulo: "Pendências" },
          ]}
        />
        {isSuperAdmin && !prazo.isLoading && <PrazoAdmin prazo={prazoDias} />}
        <DataTable
          rotulo="Pendências de passagens"
          dados={linhas}
          colunas={colunas}
          chaveLinha={(l) => l.chave}
          carregando={pedidos.isLoading || prazo.isLoading || (servidores.length > 0 && rh.isLoading)}
          erro={pedidos.isError || rh.isError ? "Não foi possível carregar as pendências." : null}
          aoTentarNovamente={() => { pedidos.refetch(); rh.refetch(); }}
          busca={{ placeholder: "Buscar por passageiro, processo ou evento" }}
          filtros={
            <div className="flex items-center gap-2">
              <Switch id="so-atrasados" checked={soAtrasados} onCheckedChange={setSoAtrasados} />
              <Label htmlFor="so-atrasados" className="font-normal">Só atrasados</Label>
            </div>
          }
          aoClicarLinha={(l) => navigate(`/gabinete/passagens/${l.pedido.id}?aba=prestacao`)}
          vazio={{
            icone: ClipboardCheck,
            titulo: soAtrasados ? "Nada atrasado" : "Nenhuma pendência",
            descricao: `Prazo atual: ${prazoDias} ${prazoDias === 1 ? "dia" : "dias"} depois da volta.`,
          }}
        />
      </div>
    </ModuleLayout>
  );
}
