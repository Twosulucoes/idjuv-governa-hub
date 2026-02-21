import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useBancosCNAB } from "@/hooks/useFolhaPagamento";

interface ServidorBancario {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula?: string;
  banco_codigo?: string;
  banco_nome?: string;
  banco_agencia?: string;
  banco_conta?: string;
  banco_tipo_conta?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EdicaoLoteBancarioDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState<"individual" | "batch">("individual");
  const [batchData, setBatchData] = useState({
    banco_codigo: "",
    banco_agencia: "",
    banco_conta: "",
    banco_tipo_conta: "corrente",
  });
  const [individualEdits, setIndividualEdits] = useState<Record<string, Partial<ServidorBancario>>>({});

  const { data: bancos = [] } = useBancosCNAB(true);

  const { data: servidores = [], isLoading } = useQuery({
    queryKey: ["servidores-dados-bancarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          banco_codigo,
          banco_nome,
          banco_agencia,
          banco_conta,
          banco_tipo_conta
        `)
        .eq("ativo", true)
        .order("nome_completo");

      if (error) throw error;
      return data as ServidorBancario[];
    },
    enabled: open,
  });

  const semDadosBancarios = servidores.filter(
    (s) => !s.banco_codigo || !s.banco_agencia || !s.banco_conta
  );

  const mutation = useMutation({
    mutationFn: async (updates: { id: string; data: Partial<ServidorBancario> }[]) => {
      for (const update of updates) {
        const bancoInfo = bancos.find(b => b.codigo_banco === update.data.banco_codigo);
        const { error } = await supabase
          .from("servidores")
          .update({
            ...update.data,
            banco_nome: bancoInfo?.nome || update.data.banco_nome,
          })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servidores-dados-bancarios"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      queryClient.invalidateQueries({ queryKey: ["fichas-financeiras"] });
      toast.success("Dados bancários atualizados com sucesso!");
      setSelectedIds(new Set());
      setIndividualEdits({});
    },
    onError: (error) => {
      console.error("Erro ao atualizar dados bancários:", error);
      toast.error("Erro ao atualizar dados bancários");
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(semDadosBancarios.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleIndividualChange = (id: string, field: string, value: string) => {
    setIndividualEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveBatch = () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione ao menos um servidor");
      return;
    }
    if (!batchData.banco_codigo || !batchData.banco_agencia || !batchData.banco_conta) {
      toast.error("Preencha banco, agência e conta");
      return;
    }

    const updates = Array.from(selectedIds).map((id) => ({
      id,
      data: batchData,
    }));

    mutation.mutate(updates);
  };

  const handleSaveIndividual = () => {
    const updates = Object.entries(individualEdits)
      .filter(([_, data]) => data.banco_codigo && data.banco_agencia && data.banco_conta)
      .map(([id, data]) => ({ id, data }));

    if (updates.length === 0) {
      toast.error("Nenhum servidor com dados completos para salvar");
      return;
    }

    mutation.mutate(updates);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Edição de Dados Bancários
          </DialogTitle>
          <DialogDescription>
            {semDadosBancarios.length} servidor(es) sem dados bancários completos.
            Preencha as informações para incluí-los na remessa CNAB.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={editMode === "individual" ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode("individual")}
          >
            Edição Individual
          </Button>
          <Button
            variant={editMode === "batch" ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode("batch")}
          >
            Edição em Lote
          </Button>
        </div>

        {editMode === "batch" && (
          <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
            <p className="text-sm font-medium">
              Preencha os dados abaixo e selecione os servidores para aplicar em lote:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Select
                  value={batchData.banco_codigo}
                  onValueChange={(v) => setBatchData((p) => ({ ...p, banco_codigo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map((b) => (
                      <SelectItem key={b.id} value={b.codigo_banco}>
                        {b.codigo_banco} - {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input
                  placeholder="0000"
                  value={batchData.banco_agencia}
                  onChange={(e) => setBatchData((p) => ({ ...p, banco_agencia: e.target.value.replace(/[^0-9\-]/g, '') }))}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Input
                  placeholder="00000000-X"
                  value={batchData.banco_conta}
                  onChange={(e) => setBatchData((p) => ({ ...p, banco_conta: e.target.value.replace(/[^0-9\-X]/gi, '') }))}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={batchData.banco_tipo_conta}
                  onValueChange={(v) => setBatchData((p) => ({ ...p, banco_tipo_conta: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="salario">Salário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px] border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {editMode === "batch" && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === semDadosBancarios.length && semDadosBancarios.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Servidor</TableHead>
                  <TableHead>Status</TableHead>
                  {editMode === "individual" && (
                    <>
                      <TableHead>Banco</TableHead>
                      <TableHead>Agência</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Tipo</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {semDadosBancarios.map((servidor) => {
                  const edit = individualEdits[servidor.id] || {};
                  const temDados = servidor.banco_codigo && servidor.banco_agencia && servidor.banco_conta;
                  
                  return (
                    <TableRow key={servidor.id}>
                      {editMode === "batch" && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(servidor.id)}
                            onCheckedChange={(c) => handleSelect(servidor.id, !!c)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <p className="font-medium">{servidor.nome_completo}</p>
                          <p className="text-xs text-muted-foreground">
                            {servidor.matricula || formatCPF(servidor.cpf)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {temDados ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-300 text-orange-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Incompleto
                          </Badge>
                        )}
                      </TableCell>
                      {editMode === "individual" && (
                        <>
                          <TableCell>
                            <Select
                              value={edit.banco_codigo || servidor.banco_codigo || ""}
                              onValueChange={(v) => handleIndividualChange(servidor.id, "banco_codigo", v)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Banco" />
                              </SelectTrigger>
                              <SelectContent>
                                {bancos.map((b) => (
                                  <SelectItem key={b.id} value={b.codigo_banco}>
                                    {b.codigo_banco}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Agência"
                              value={edit.banco_agencia ?? servidor.banco_agencia ?? ""}
                              onChange={(e) => handleIndividualChange(servidor.id, "banco_agencia", e.target.value.replace(/[^0-9\-]/g, ''))}
                              className="w-24"
                              maxLength={10}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Conta"
                              value={edit.banco_conta ?? servidor.banco_conta ?? ""}
                              onChange={(e) => handleIndividualChange(servidor.id, "banco_conta", e.target.value.replace(/[^0-9\-X]/gi, ''))}
                              className="w-28"
                              maxLength={20}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={edit.banco_tipo_conta || servidor.banco_tipo_conta || "corrente"}
                              onValueChange={(v) => handleIndividualChange(servidor.id, "banco_tipo_conta", v)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="corrente">Corrente</SelectItem>
                                <SelectItem value="poupanca">Poupança</SelectItem>
                                <SelectItem value="salario">Salário</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {editMode === "batch" ? (
            <Button onClick={handleSaveBatch} disabled={mutation.isPending || selectedIds.size === 0}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Aplicar em {selectedIds.size} Servidor(es)
            </Button>
          ) : (
            <Button onClick={handleSaveIndividual} disabled={mutation.isPending || Object.keys(individualEdits).length === 0}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
