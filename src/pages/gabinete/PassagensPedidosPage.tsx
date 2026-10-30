/**
 * Passagens aéreas: pedidos (um por processo SEI) com passageiros, situação e valor emitido, e o saldo do contrato
 * da agência (emitido, faturado e pago). As faturas ficam em Faturas e saldo (/gabinete/passagens/faturas).
 * Spec: docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Banknote, FileSignature, Plane, Plus, Receipt, Users, Wallet } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContratoCadastroDialog } from "@/components/contratos/passagens/ContratoCadastroDialog";
import { PedidoFormDialog } from "@/components/contratos/passagens/PedidoFormDialog";
import { TOM_PEDIDO } from "@/components/contratos/passagens/tons";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { saldoContratoCompleto } from "@/lib/passagens/faturas";
import { resumoPedido } from "@/lib/passagens/regras";
import { useContratosPassagens, usePedidos, useSalvarPedido } from "@/hooks/usePassagens";
import { useFaturas } from "@/hooks/usePassagensFaturas";
import { SITUACOES_PEDIDO, rotuloSituacaoPedido, type PedidoResumo } from "@/types/passagens";

const TODOS = "todos";

export default function PassagensPedidosPage() {
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("contratos.passagens.editar");
  // o contrato é da tabela contratos: cadastrar ou ligar um exige também a permissão de contratos
  const podeCadastrarContrato = podeEditar && hasPermission("contratos.criar");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const pedidos = usePedidos();
  const contratos = useContratosPassagens();
  const salvar = useSalvarPedido();
  const [novo, setNovo] = useState(false);
  const [novoContrato, setNovoContrato] = useState(false);
  const [situacao, setSituacao] = useState(TODOS);
  const [contratoId, setContratoId] = useState<string | null>(null);

  // Atalho do menu "Novo pedido" (/gabinete/passagens?novo=1)
  useEffect(() => {
    if (params.get("novo") && podeEditar) {
      setNovo(true);
      setParams({}, { replace: true });
    }
  }, [params, podeEditar, setParams]);

  const lista = useMemo(() => pedidos.data ?? [], [pedidos.data]);
  const contrato = useMemo(() => {
    const todos = contratos.data ?? [];
    return todos.find((c) => c.id === contratoId) ?? todos.find((c) => lista.some((p) => p.contrato_id === c.id)) ?? todos[0] ?? null;
  }, [contratos.data, contratoId, lista]);
  const faturas = useFaturas(contrato?.id);
  const saldo = useMemo(
    () => (contrato
      ? saldoContratoCompleto(
          contrato.valor_atual,
          lista.filter((p) => p.contrato_id === contrato.id).flatMap((p) => p.passageiros.flatMap((x) => x.trechos)),
          faturas.data ?? [],
        )
      : null),
    [contrato, lista, faturas.data],
  );
  const filtrados = lista.filter((p) => situacao === TODOS || p.situacao === situacao);

  const colunas: ColunaTabela<PedidoResumo>[] = [
    {
      id: "sei",
      cabecalho: "Processo SEI",
      celula: (p) => <span className="whitespace-nowrap font-medium">{p.numero_sei}</span>,
      ordenarPor: (p) => p.numero_sei,
      buscarPor: (p) => p.numero_sei,
      mobile: "titulo",
    },
    {
      id: "solicitante",
      cabecalho: "Quem pediu",
      celula: (p) => p.solicitante_nome ?? "—",
      ordenarPor: (p) => p.solicitante_nome,
      buscarPor: (p) => `${p.solicitante_nome ?? ""} ${p.passageiros.map((x) => x.nome).join(" ")}`,
      className: "min-w-[10rem]",
    },
    {
      id: "evento",
      cabecalho: "Evento",
      celula: (p) => (
        <span className="line-clamp-2">
          {p.evento ?? p.finalidade}
          {p.data_inicio && <span className="block text-xs text-muted-foreground">{formatDateBR(p.data_inicio)}{p.destino_cidade ? ` · ${p.destino_cidade}` : ""}</span>}
        </span>
      ),
      buscarPor: (p) => `${p.evento ?? ""} ${p.finalidade} ${p.destino_cidade ?? ""}`,
      className: "min-w-[12rem]",
    },
    {
      id: "passageiros",
      cabecalho: "Passageiros",
      celula: (p) => p.passageiros.length,
      ordenarPor: (p) => p.passageiros.length,
      alinhamento: "direita",
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      celula: (p) => <StatusBadge tom={TOM_PEDIDO[p.situacao] ?? "neutro"} icone={false}>{rotuloSituacaoPedido(p.situacao)}</StatusBadge>,
      ordenarPor: (p) => SITUACOES_PEDIDO.findIndex((s) => s.value === p.situacao),
    },
    {
      id: "valor",
      cabecalho: "Emitido",
      celula: (p) => <span className="tabular-nums">{formatCurrency(resumoPedido(p.passageiros).valor)}</span>,
      ordenarPor: (p) => resumoPedido(p.passageiros).valor,
      alinhamento: "direita",
    },
  ];

  return (
    <ModuleLayout module="gabinete">
      <div className="space-y-6">
        <PageHeader
          titulo="Passagens aéreas"
          descricao="Pedidos por processo SEI, passageiros, emissão e saldo do contrato da agência"
          migalhas={[{ rotulo: "Gabinete", href: "/gabinete" }, { rotulo: "Passagens aéreas" }]}
          acoes={
            <>
              <Button variant="outline" onClick={() => navigate("/gabinete/passagens/faturas")}>
                <Receipt className="h-4 w-4" aria-hidden="true" />
                Faturas e saldo
              </Button>
              <Button variant="outline" onClick={() => navigate("/gabinete/passagens/beneficiarios")}>
                <Users className="h-4 w-4" aria-hidden="true" />
                Beneficiários
              </Button>
              {podeEditar && (
                <Button onClick={() => setNovo(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Novo pedido
                </Button>
              )}
            </>
          }
        />

        {contrato && saldo ? (
          <section aria-label="Saldo do contrato" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">
                Contrato {contrato.numero_contrato}/{contrato.ano}
                <span className="block text-sm font-normal text-muted-foreground">
                  {contrato.fornecedor?.nome_fantasia ?? contrato.fornecedor?.razao_social ?? "—"} · vigência até {formatDateBR(contrato.data_fim_atual ?? contrato.data_fim)}
                </span>
              </h2>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {(contratos.data?.length ?? 0) > 1 && (
                <Select value={contrato.id} onValueChange={setContratoId}>
                  <SelectTrigger className="w-full sm:w-56" aria-label="Contrato"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contratos.data!.map((c) => <SelectItem key={c.id} value={c.id}>Contrato {c.numero_contrato}/{c.ano}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {podeCadastrarContrato && <Button variant="outline" onClick={() => setNovoContrato(true)}>Outro contrato</Button>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard rotulo="Valor do contrato" valor={formatCurrency(saldo.valor)} icone={FileSignature} />
              <KpiCard rotulo="Emitido" valor={formatCurrency(saldo.emitido)} detalhe="bilhetes com localizador, com multas e reembolsos" icone={Plane} />
              <KpiCard rotulo="Faturado" valor={formatCurrency(saldo.faturado)} detalhe={`a faturar ${formatCurrency(saldo.aFaturar)}`} icone={Receipt} carregando={faturas.isLoading} />
              <KpiCard rotulo="Pago" valor={formatCurrency(saldo.pago)} detalhe="notas pagas (com OB)" icone={Banknote} carregando={faturas.isLoading} />
              <KpiCard
                rotulo="Saldo"
                valor={formatCurrency(saldo.saldo)}
                detalhe={saldo.saldo < 0 ? "faturado e a faturar passaram do contrato" : "valor menos faturado e a faturar"}
                icone={Wallet}
              />
            </div>
          </section>
        ) : (
          !contratos.isLoading && (
            <Card>
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {podeCadastrarContrato
                    ? "Nenhum contrato da agência ligado às passagens. Cadastre ou escolha o contrato para acompanhar o saldo."
                    : "Nenhum contrato da agência ligado às passagens. O setor de Contratos liga o contrato da agência para o saldo aparecer aqui."}
                </p>
                {podeCadastrarContrato && <Button variant="outline" onClick={() => setNovoContrato(true)}>Cadastrar contrato</Button>}
              </CardContent>
            </Card>
          )
        )}

        <DataTable
          rotulo="Pedidos de passagem"
          dados={filtrados}
          colunas={colunas}
          chaveLinha={(p) => p.id}
          carregando={pedidos.isLoading}
          erro={pedidos.isError ? "Não foi possível carregar os pedidos." : null}
          aoTentarNovamente={() => pedidos.refetch()}
          busca={{ placeholder: "Buscar por nº SEI, solicitante, passageiro ou evento" }}
          filtros={
            <Select value={situacao} onValueChange={setSituacao}>
              <SelectTrigger className="w-full sm:w-52" aria-label="Situação"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Situação: todas</SelectItem>
                {SITUACOES_PEDIDO.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          }
          aoClicarLinha={(p) => navigate(`/gabinete/passagens/${p.id}`)}
          vazio={{
            icone: Plane,
            titulo: "Nenhum pedido de passagem",
            descricao: podeEditar ? "Registre o primeiro pedido com o nº do processo SEI." : "Ainda não há pedidos registrados.",
          }}
        />
      </div>

      <PedidoFormDialog
        open={novo}
        onOpenChange={setNovo}
        salvando={salvar.isPending}
        podeCadastrar={podeEditar}
        onSalvar={async (dados) => {
          const p = await salvar.mutateAsync(dados);
          navigate(`/gabinete/passagens/${p.id}`);
        }}
      />
      <ContratoCadastroDialog open={novoContrato} onOpenChange={setNovoContrato} aoCadastrar={setContratoId} />
    </ModuleLayout>
  );
}
