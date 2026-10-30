/**
 * Beneficiários de passagem que não são servidores: busca por nome ou CPF (mascarado na lista), cadastro e
 * as viagens de cada um.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, UserRound } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BeneficiarioFormDialog } from "@/components/contratos/passagens/BeneficiarioFormDialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateBR } from "@/lib/formatters";
import { mascararCpf, somenteDigitos } from "@/lib/passagens/regras";
import { useBeneficiarios } from "@/hooks/usePassagens";
import { rotuloDocumento, rotuloSituacaoPedido, type PassagemBeneficiario } from "@/types/passagens";

type Linha = NonNullable<ReturnType<typeof useBeneficiarios>["data"]>[number];

export default function PassagensBeneficiariosPage() {
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("contratos.passagens.editar");
  const lista = useBeneficiarios();
  const [editar, setEditar] = useState<PassagemBeneficiario | null | undefined>(undefined);
  const [ver, setVer] = useState<Linha | null>(null);
  const dados = useMemo(() => lista.data ?? [], [lista.data]);

  const colunas: ColunaTabela<Linha>[] = [
    {
      id: "nome",
      cabecalho: "Nome",
      celula: (b) => <span className="font-medium">{b.nome}</span>,
      ordenarPor: (b) => b.nome,
      buscarPor: (b) => `${b.nome} ${b.cpf} ${somenteDigitos(b.cpf)}`,
      mobile: "titulo",
    },
    { id: "cpf", cabecalho: "CPF", celula: (b) => <span className="tabular-nums">{mascararCpf(b.cpf)}</span> },
    { id: "instituicao", cabecalho: "Instituição", celula: (b) => b.instituicao_nome ?? "—", buscarPor: (b) => b.instituicao_nome, ordenarPor: (b) => b.instituicao_nome },
    { id: "viagens", cabecalho: "Pedidos", celula: (b) => b.viagens.length, ordenarPor: (b) => b.viagens.length, alinhamento: "direita" },
    {
      id: "ativo",
      cabecalho: "Situação",
      celula: (b) => <StatusBadge tom={b.ativo ? "sucesso" : "neutro"} icone={false}>{b.ativo ? "Ativo" : "Inativo"}</StatusBadge>,
      ordenarPor: (b) => (b.ativo ? 0 : 1),
    },
  ];

  return (
    <ModuleLayout module="gabinete">
      <div className="space-y-6">
        <PageHeader
          titulo="Beneficiários de passagem"
          descricao="Pessoas de fora do quadro que viajam com passagem do órgão"
          migalhas={[
            { rotulo: "Gabinete", href: "/gabinete" },
            { rotulo: "Passagens aéreas", href: "/gabinete/passagens" },
            { rotulo: "Beneficiários" },
          ]}
          acoes={
            podeEditar && (
              <Button onClick={() => setEditar(null)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo beneficiário
              </Button>
            )
          }
        />
        <DataTable
          rotulo="Beneficiários de passagem"
          dados={dados}
          colunas={colunas}
          chaveLinha={(b) => b.id}
          carregando={lista.isLoading}
          erro={lista.isError ? "Não foi possível carregar os beneficiários." : null}
          aoTentarNovamente={() => lista.refetch()}
          busca={{ placeholder: "Buscar por nome, CPF ou instituição" }}
          aoClicarLinha={(b) => setVer(b)}
          vazio={{
            icone: UserRound,
            titulo: "Nenhum beneficiário cadastrado",
            descricao: podeEditar ? "Cadastre aqui ou direto ao incluir um passageiro no pedido." : "Ainda não há beneficiários.",
          }}
        />
      </div>

      <BeneficiarioFormDialog open={editar !== undefined} onOpenChange={(a) => !a && setEditar(undefined)} beneficiario={editar} />

      <Dialog open={!!ver} onOpenChange={(a) => !a && setVer(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ver?.nome}</DialogTitle>
            <DialogDescription>CPF {mascararCpf(ver?.cpf)}{ver?.instituicao_nome ? ` · ${ver.instituicao_nome}` : ""}</DialogDescription>
          </DialogHeader>
          {ver && (
            <div className="space-y-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Nascimento</dt><dd>{ver.data_nascimento ? formatDateBR(ver.data_nascimento) : "—"}</dd></div>
                <div><dt className="text-muted-foreground">Documento</dt><dd>{ver.documento_numero ? `${rotuloDocumento(ver.documento_tipo)} ${ver.documento_numero} ${ver.documento_orgao ?? ""}` : "—"}</dd></div>
                <div><dt className="text-muted-foreground">Telefone</dt><dd>{ver.telefone ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">E-mail</dt><dd className="break-all">{ver.email ?? "—"}</dd></div>
              </dl>
              <div>
                <h3 className="mb-2 font-medium">Pedidos</h3>
                {ver.viagens.length === 0 ? (
                  <p className="text-muted-foreground">Ainda não viajou com passagem do órgão.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {ver.viagens.filter((v) => v.pedido).map((v) => (
                      <li key={v.id}>
                        <Link to={`/gabinete/passagens/${v.pedido!.id}`} className="block px-3 py-2 hover:bg-muted">
                          <span className="font-medium">{v.pedido!.evento ?? `Processo ${v.pedido!.numero_sei}`}</span>
                          <span className="block text-xs text-muted-foreground">
                            {v.pedido!.numero_sei}{v.pedido!.data_inicio ? ` · ${formatDateBR(v.pedido!.data_inicio)}` : ""} · {rotuloSituacaoPedido(v.pedido!.situacao)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {podeEditar && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => { setEditar(ver); setVer(null); }}>Editar cadastro</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
