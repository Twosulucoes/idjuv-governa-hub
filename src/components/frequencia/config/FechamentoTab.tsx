import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock, Save } from "lucide-react";
import { useConfigFechamento, useSalvarFechamento } from "@/hooks/useParametrizacoesFrequencia";
import { MESES } from "@/types/folha";
import { STATUS_FECHAMENTO_LABELS, type StatusFechamento } from "@/types/frequencia";

export function FechamentoTab() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  
  const { data: config, isLoading } = useConfigFechamento(ano, mes);
  const salvar = useSalvarFechamento();
  
  const [editando, setEditando] = useState<{
    data_limite_servidor?: string;
    data_limite_chefia?: string;
    data_limite_rh?: string;
    status?: StatusFechamento;
    permite_reabertura?: boolean;
    prazo_reabertura_dias?: number;
    reabertura_exige_justificativa?: boolean;
    servidor_pode_fechar?: boolean;
    chefia_pode_fechar?: boolean;
    rh_pode_fechar?: boolean;
  }>({});

  // Sincronizar editando com config quando carregar
  useState(() => {
    if (config) {
      setEditando({
        data_limite_servidor: config.data_limite_servidor || undefined,
        data_limite_chefia: config.data_limite_chefia || undefined,
        data_limite_rh: config.data_limite_rh || undefined,
        status: config.status,
        permite_reabertura: config.permite_reabertura,
        prazo_reabertura_dias: config.prazo_reabertura_dias,
        reabertura_exige_justificativa: config.reabertura_exige_justificativa,
        servidor_pode_fechar: config.servidor_pode_fechar,
        chefia_pode_fechar: config.chefia_pode_fechar,
        rh_pode_fechar: config.rh_pode_fechar,
      });
    }
  });

  const handleSalvar = async () => {
    await salvar.mutateAsync({
      ano,
      mes,
      ...editando,
    });
  };

  const anos = Array.from({ length: 3 }, (_, i) => anoAtual + 1 - i);
  const statusOptions: StatusFechamento[] = ['aberto', 'fechado_servidor', 'fechado_chefia', 'consolidado'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Configure prazos de fechamento, consolidação e reabertura de frequência.
        </p>
        <div className="flex items-center gap-2">
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Datas Limite
            </CardTitle>
            <CardDescription>
              Até quando cada perfil pode atuar na frequência de {MESES[mes - 1]}/{ano}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Limite para Servidor</Label>
              <Input
                type="date"
                value={editando.data_limite_servidor || config?.data_limite_servidor || ''}
                onChange={(e) => setEditando({ ...editando, data_limite_servidor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Limite para Chefia</Label>
              <Input
                type="date"
                value={editando.data_limite_chefia || config?.data_limite_chefia || ''}
                onChange={(e) => setEditando({ ...editando, data_limite_chefia: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Limite para RH</Label>
              <Input
                type="date"
                value={editando.data_limite_rh || config?.data_limite_rh || ''}
                onChange={(e) => setEditando({ ...editando, data_limite_rh: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status e Permissões</CardTitle>
            <CardDescription>
              Controle de quem pode fechar a frequência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status do Período</Label>
              <Select
                value={editando.status || config?.status || 'aberto'}
                onValueChange={(v) => setEditando({ ...editando, status: v as StatusFechamento })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_FECHAMENTO_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editando.servidor_pode_fechar ?? config?.servidor_pode_fechar ?? true}
                  onCheckedChange={(v) => setEditando({ ...editando, servidor_pode_fechar: v })}
                />
                <Label>Servidor pode fechar</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editando.chefia_pode_fechar ?? config?.chefia_pode_fechar ?? true}
                  onCheckedChange={(v) => setEditando({ ...editando, chefia_pode_fechar: v })}
                />
                <Label>Chefia pode fechar</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editando.rh_pode_fechar ?? config?.rh_pode_fechar ?? true}
                  onCheckedChange={(v) => setEditando({ ...editando, rh_pode_fechar: v })}
                />
                <Label>RH pode fechar</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Reabertura</CardTitle>
            <CardDescription>
              Regras para reabertura de frequências já fechadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editando.permite_reabertura ?? config?.permite_reabertura ?? true}
                  onCheckedChange={(v) => setEditando({ ...editando, permite_reabertura: v })}
                />
                <Label>Permite reabertura</Label>
              </div>
              <div className="space-y-2">
                <Label>Prazo máximo (dias)</Label>
                <Input
                  type="number"
                  value={editando.prazo_reabertura_dias ?? config?.prazo_reabertura_dias ?? 5}
                  onChange={(e) => setEditando({ ...editando, prazo_reabertura_dias: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={editando.reabertura_exige_justificativa ?? config?.reabertura_exige_justificativa ?? true}
                  onCheckedChange={(v) => setEditando({ ...editando, reabertura_exige_justificativa: v })}
                />
                <Label>Exige justificativa</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={salvar.isPending}>
          {salvar.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuração
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
