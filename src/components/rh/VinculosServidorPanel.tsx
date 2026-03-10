/**
 * Painel de Vínculos do Servidor
 * Exibe e gerencia múltiplos vínculos simultâneos
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useVinculosServidor,
  useVinculoMutations,
  TIPO_VINCULO_LABELS,
  TIPO_DERIVADO_COLORS,
  ORIGEM_LABELS,
  type TipoVinculoServidor,
  type OrigemVinculo,
  type VinculoServidor,
} from "@/hooks/useVinculosServidor";
import {
  Plus,
  Link2,
  Building2,
  Calendar,
  XCircle,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface VinculosServidorPanelProps {
  servidorId: string;
  servidorNome: string;
  readOnly?: boolean;
}

export function VinculosServidorPanel({
  servidorId,
  servidorNome,
  readOnly = false,
}: VinculosServidorPanelProps) {
  const { data: vinculos = [], isLoading } = useVinculosServidor(servidorId);
  const { criar, encerrar } = useVinculoMutations(servidorId);
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [showEncerrarId, setShowEncerrarId] = useState<string | null>(null);
  const [dataEncerramento, setDataEncerramento] = useState("");

  const vinculosAtivos = vinculos.filter((v) => v.ativo);
  const vinculosInativos = vinculos.filter((v) => !v.ativo);

  const handleEncerrar = () => {
    if (showEncerrarId && dataEncerramento) {
      encerrar.mutate(
        { id: showEncerrarId, dataFim: dataEncerramento },
        { onSuccess: () => { setShowEncerrarId(null); setDataEncerramento(""); } }
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-primary" />
            Vínculos Funcionais
            <Badge variant="secondary" className="ml-2">{vinculosAtivos.length} ativo(s)</Badge>
          </CardTitle>
          {!readOnly && (
            <Button size="sm" onClick={() => setShowNovoDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo Vínculo
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {vinculosAtivos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum vínculo ativo registrado.
            </p>
          )}

          {vinculosAtivos.map((v) => (
            <VinculoCard
              key={v.id}
              vinculo={v}
              onEncerrar={readOnly ? undefined : () => setShowEncerrarId(v.id)}
            />
          ))}

          {vinculosInativos.length > 0 && (
            <>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Histórico ({vinculosInativos.length})
              </p>
              {vinculosInativos.map((v) => (
                <VinculoCard key={v.id} vinculo={v} inativo />
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Novo Vínculo */}
      <NovoVinculoDialog
        open={showNovoDialog}
        onClose={() => setShowNovoDialog(false)}
        servidorId={servidorId}
        onSave={(data) => criar.mutate(data, { onSuccess: () => setShowNovoDialog(false) })}
        loading={criar.isPending}
      />

      {/* Dialog Encerrar */}
      <Dialog open={!!showEncerrarId} onOpenChange={() => setShowEncerrarId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar Vínculo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Data de Encerramento</Label>
            <Input
              type="date"
              value={dataEncerramento}
              onChange={(e) => setDataEncerramento(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEncerrarId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!dataEncerramento || encerrar.isPending}
              onClick={handleEncerrar}
            >
              Encerrar Vínculo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente individual do vínculo
function VinculoCard({
  vinculo,
  onEncerrar,
  inativo,
}: {
  vinculo: VinculoServidor;
  onEncerrar?: () => void;
  inativo?: boolean;
}) {
  const colorClass = TIPO_DERIVADO_COLORS[vinculo.tipo] || TIPO_DERIVADO_COLORS.nao_classificado;

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${inativo ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={colorClass}>
            {TIPO_VINCULO_LABELS[vinculo.tipo]}
          </Badge>
          <Badge variant="outline">{ORIGEM_LABELS[vinculo.origem]}</Badge>
          {vinculo.orgao_nome && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {vinculo.orgao_nome}
            </span>
          )}
        </div>
        {onEncerrar && !inativo && (
          <Button variant="ghost" size="sm" onClick={onEncerrar}>
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {vinculo.cargo && (
          <div>
            <span className="text-xs text-muted-foreground">Cargo</span>
            <p className="font-medium flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {vinculo.cargo.nome}
            </p>
          </div>
        )}
        {vinculo.unidade && (
          <div>
            <span className="text-xs text-muted-foreground">Lotação</span>
            <p className="font-medium">{vinculo.unidade.sigla || vinculo.unidade.nome}</p>
          </div>
        )}
        <div>
          <span className="text-xs text-muted-foreground">Início</span>
          <p className="font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {vinculo.data_inicio ? format(new Date(vinculo.data_inicio + "T00:00:00"), "dd/MM/yyyy") : "-"}
          </p>
        </div>
        {vinculo.data_fim && (
          <div>
            <span className="text-xs text-muted-foreground">Fim</span>
            <p className="font-medium">{format(new Date(vinculo.data_fim + "T00:00:00"), "dd/MM/yyyy")}</p>
          </div>
        )}
      </div>

      {vinculo.onus && (
        <p className="text-xs text-muted-foreground">
          Ônus: {vinculo.onus === "origem" ? "Órgão de Origem" : vinculo.onus === "destino" ? "Órgão de Destino" : "Compartilhado"}
        </p>
      )}
    </div>
  );
}

// Dialog para criar novo vínculo
function NovoVinculoDialog({
  open,
  onClose,
  servidorId,
  onSave,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  servidorId: string;
  onSave: (data: any) => void;
  loading: boolean;
}) {
  const [tipo, setTipo] = useState<TipoVinculoServidor>("comissionado");
  const [origem, setOrigem] = useState<OrigemVinculo>("idjuv");
  const [orgaoNome, setOrgaoNome] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [onus, setOnus] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const needsOrgao = origem !== "idjuv";
  const needsOnus = tipo === "cedido_entrada" || tipo === "requisitado" || tipo === "federal";

  // Cargos
  const { data: cargos = [] } = useQuery({
    queryKey: ["cargos-vinculo"],
    queryFn: async () => {
      const { data } = await supabase.from("cargos").select("id, nome, sigla").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  // Unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-vinculo"],
    queryFn: async () => {
      const { data } = await supabase.from("estrutura_organizacional").select("id, nome, sigla").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const handleSave = () => {
    onSave({
      servidor_id: servidorId,
      tipo,
      origem,
      orgao_nome: needsOrgao ? orgaoNome : null,
      cargo_id: cargoId || null,
      unidade_id: unidadeId || null,
      data_inicio: dataInicio,
      onus: needsOnus && onus ? onus : null,
      observacoes: observacoes || null,
      ativo: true,
    });
  };

  const canSave = tipo && origem && dataInicio && (!needsOrgao || orgaoNome);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Vínculo Funcional</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Vínculo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoVinculoServidor)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_VINCULO_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem *</Label>
              <Select value={origem} onValueChange={(v) => setOrigem(v as OrigemVinculo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ORIGEM_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsOrgao && (
            <div>
              <Label>Nome do Órgão *</Label>
              <Input value={orgaoNome} onChange={(e) => setOrgaoNome(e.target.value)} placeholder="Ex: SEED, SESAU..." />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cargo</Label>
              <Select value={cargoId} onValueChange={setCargoId}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {cargos.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unidade/Lotação</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {unidades.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.sigla || u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Início *</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            {needsOnus && (
              <div>
                <Label>Ônus</Label>
                <Select value={onus} onValueChange={setOnus}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="origem">Órgão de Origem</SelectItem>
                    <SelectItem value="destino">Órgão de Destino</SelectItem>
                    <SelectItem value="compartilhado">Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!canSave || loading} onClick={handleSave}>
            {loading ? "Salvando..." : "Salvar Vínculo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
