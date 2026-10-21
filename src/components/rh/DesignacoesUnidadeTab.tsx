import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Building2, Loader2, Pencil } from "lucide-react";
import {
  TipoAtoNomeacao,
  TIPO_ATO_LABELS,
  STATUS_NOMEACAO_LABELS,
  STATUS_NOMEACAO_COLORS,
} from "@/types/unidadesLocais";
import {
  type DesignacaoChefia,
  useDesignacoesChefiaServidor,
  useUnidadesLocaisAtivas,
  useRegistrarDesignacaoChefia,
  useAtualizarRegistroSeiDesignacao,
} from "@/hooks/useDesignacoesChefiaUnidade";
import {
  CAMPOS_SEI_VAZIOS,
  type CamposSei,
  aguardandoSei,
  registroSeiDesignacaoSchema,
} from "@/lib/registroSei";
import { CamposAtoSei } from "@/components/unidades/CamposAtoSei";

interface DesignacoesUnidadeTabProps {
  servidorId: string;
}

const dataBR = (d?: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR") : "");

// O ato de designação é feito no SEI: aqui se registra a designação e se acompanha o ciclo do ato
// (processo SEI, número, assinatura, publicação e DOE). Sem número, a designação fica "aguardando SEI".
export function DesignacoesUnidadeTab({ servidorId }: DesignacoesUnidadeTabProps) {
  const { data: designacoes = [], isLoading } = useDesignacoesChefiaServidor(servidorId);
  const { data: unidades = [] } = useUnidadesLocaisAtivas();
  const registrar = useRegistrarDesignacaoChefia();
  const atualizar = useAtualizarRegistroSeiDesignacao();

  const [showForm, setShowForm] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");
  const [formData, setFormData] = useState({ data_inicio: "", observacoes: "" });

  // Ato no SEI (registro e edição usam o mesmo formulário)
  const [tipoAto, setTipoAto] = useState<TipoAtoNomeacao>("portaria");
  const [dataPublicacao, setDataPublicacao] = useState("");
  const [sei, setSei] = useState<CamposSei>(CAMPOS_SEI_VAZIOS);
  const [editando, setEditando] = useState<DesignacaoChefia | null>(null);

  function resetForm() {
    setSelectedUnidade("");
    setFormData({ data_inicio: "", observacoes: "" });
    setTipoAto("portaria");
    setDataPublicacao("");
    setSei(CAMPOS_SEI_VAZIOS);
  }

  function abrirEdicao(d: DesignacaoChefia) {
    setEditando(d);
    setTipoAto(d.ato_nomeacao_tipo);
    setDataPublicacao(d.ato_data_publicacao || "");
    setSei({
      processoSei: d.processo_sei || "",
      numero: d.ato_numero || "",
      dataAssinatura: d.ato_data_assinatura || "",
      doeNumero: d.ato_doe_numero || "",
      doeData: d.ato_doe_data || "",
    });
  }

  function fecharEdicao() {
    setEditando(null);
    resetForm();
  }

  /** Valida o bloco do SEI; devolve os campos prontos ou null (já avisou o erro). */
  function validarSei() {
    const validacao = registroSeiDesignacaoSchema.safeParse({ ...sei, dataPublicacao });
    if (!validacao.success) {
      toast.error(validacao.error.issues[0]?.message || "Verifique os campos do SEI");
      return null;
    }
    return { ...validacao.data, tipoAto };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnidade) {
      toast.error("Selecione uma unidade local");
      return;
    }
    const dadosSei = validarSei();
    if (!dadosSei) return;

    try {
      await registrar.mutateAsync({
        servidorId,
        unidadeId: selectedUnidade,
        dataInicio: formData.data_inicio,
        observacoes: formData.observacoes,
        sei: dadosSei,
      });
      toast.success(
        dadosSei.numero
          ? "Designação registrada com o número do ato no SEI."
          : "Designação registrada como aguardando SEI.",
      );
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao registrar designação:", error);
      toast.error((error as { message?: string })?.message || "Erro ao registrar designação");
    }
  }

  async function handleSalvarEdicao() {
    if (!editando) return;
    const dadosSei = validarSei();
    if (!dadosSei) return;
    try {
      await atualizar.mutateAsync({ id: editando.id, sei: dadosSei });
      toast.success("Registro do SEI atualizado.");
      fecharEdicao();
    } catch (error) {
      console.error("Erro ao atualizar designação:", error);
      toast.error((error as { message?: string })?.message || "Erro ao atualizar designação");
    }
  }

  // Campos do ato (tipo, SEI e publicação), comuns ao registro e à edição
  const camposAto = (prefixo: string) => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de Ato *</Label>
          <Select value={tipoAto} onValueChange={(v) => setTipoAto(v as TipoAtoNomeacao)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_ATO_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefixo}-publicacao`}>Data de Publicação</Label>
          <Input
            id={`${prefixo}-publicacao`}
            type="date"
            value={dataPublicacao}
            onChange={(e) => setDataPublicacao(e.target.value)}
          />
        </div>
      </div>
      <CamposAtoSei valores={sei} onChange={setSei} rotuloNumero="Número do ato no SEI" idPrefixo={prefixo} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Designações de Chefia em Unidades Locais
        </h3>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Designação
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : designacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma designação de chefia registrada para este servidor
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade Local</TableHead>
                  <TableHead>Ato (SEI)</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designacoes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{d.unidade?.nome_unidade}</p>
                        <p className="text-xs text-muted-foreground">{d.unidade?.municipio}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {aguardandoSei(d.ato_numero) ? (
                          <p className="text-muted-foreground italic">
                            {TIPO_ATO_LABELS[d.ato_nomeacao_tipo]}: aguardando SEI
                          </p>
                        ) : (
                          <p>{TIPO_ATO_LABELS[d.ato_nomeacao_tipo]} nº {d.ato_numero}</p>
                        )}
                        {d.processo_sei && <p className="text-muted-foreground">Proc. {d.processo_sei}</p>}
                        {d.ato_data_assinatura && (
                          <p className="text-muted-foreground">Assinado em {dataBR(d.ato_data_assinatura)}</p>
                        )}
                        {d.ato_doe_numero ? (
                          <p className="text-muted-foreground">
                            DOE nº {d.ato_doe_numero}
                            {d.ato_doe_data && ` de ${dataBR(d.ato_doe_data)}`}
                          </p>
                        ) : (
                          d.ato_data_publicacao && (
                            <p className="text-muted-foreground">Publicado em {dataBR(d.ato_data_publicacao)}</p>
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>Início: {dataBR(d.data_inicio)}</p>
                        {d.data_fim && (
                          <p className="text-muted-foreground">Fim: {dataBR(d.data_fim)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_NOMEACAO_COLORS[d.status]}>
                        {STATUS_NOMEACAO_LABELS[d.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEdicao(d)}
                        aria-label="Editar registro do SEI"
                        title="Editar registro do SEI"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Nova Designação */}
      <Dialog open={showForm} onOpenChange={(aberto) => { setShowForm(aberto); if (!aberto) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Designação de Chefia</DialogTitle>
            <DialogDescription>
              Designe este servidor como chefe de uma unidade local. O chefe anterior será automaticamente
              encerrado. O ato é feito no SEI: informe o processo e o número quando houver.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Unidade Local *</Label>
                <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade local..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome_unidade} - {u.municipio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="designacao-inicio">Data Início Efetivo *</Label>
                <Input
                  id="designacao-inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  required
                />
              </div>
            </div>

            {camposAto("designacao-nova")}

            <div className="space-y-2">
              <Label htmlFor="designacao-observacoes">Observações</Label>
              <Textarea
                id="designacao-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
                maxLength={1000}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} disabled={registrar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={registrar.isPending || !selectedUnidade}>
                {registrar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Designação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição do registro do SEI */}
      <Dialog open={!!editando} onOpenChange={(aberto) => !aberto && fecharEdicao()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registro do SEI da designação</DialogTitle>
            <DialogDescription>
              {editando?.unidade?.nome_unidade} — início em {dataBR(editando?.data_inicio)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {camposAto("designacao-edicao")}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={fecharEdicao} disabled={atualizar.isPending}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSalvarEdicao} disabled={atualizar.isPending}>
                {atualizar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
