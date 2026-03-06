import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { MODALIDADES_ESPORTIVAS } from "../../modalidadesEsportivas";
import type { ArbitroCadastro } from "../arbitrosAdminService";

interface Props {
  arbitro: ArbitroCadastro;
  onClose: () => void;
  onSave: (dados: Partial<ArbitroCadastro>) => void;
  loading: boolean;
}

export function AdminEditModal({ arbitro, onClose, onSave, loading }: Props) {
  const [form, setForm] = useState({
    nome: arbitro.nome,
    email: arbitro.email,
    celular: arbitro.celular,
    categoria: arbitro.categoria,
    modalidade: arbitro.modalidade,
    sexo: arbitro.sexo,
    uf: arbitro.uf || "",
    cidade: arbitro.cidade || "",
    endereco: arbitro.endereco || "",
    bairro: arbitro.bairro || "",
    cep: arbitro.cep || "",
    local_trabalho: arbitro.local_trabalho || "",
    funcao: arbitro.funcao || "",
    esfera: arbitro.esfera || "",
    banco: arbitro.banco || "",
    agencia: arbitro.agencia || "",
    conta_corrente: arbitro.conta_corrente || "",
    status: arbitro.status,
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const changes: Record<string, unknown> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== (arbitro as any)[k]) changes[k] = v || null;
    });
    if (Object.keys(changes).length === 0) { onClose(); return; }
    onSave(changes as Partial<ArbitroCadastro>);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cadastro — {arbitro.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Dados Pessoais */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-primary">Dados Pessoais</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Nome Completo" value={form.nome} onChange={v => update("nome", v)} />
              <div className="space-y-1">
                <Label className="text-xs">Sexo</Label>
                <Select value={form.sexo} onValueChange={v => update("sexo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={form.categoria} onValueChange={v => update("categoria", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estadual">Estadual</SelectItem>
                    <SelectItem value="nacional">Nacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Modalidade</Label>
                <Select value={form.modalidade} onValueChange={v => update("modalidade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {MODALIDADES_ESPORTIVAS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>

          {/* Contato */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-primary">Contato</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="E-mail" value={form.email} onChange={v => update("email", v)} type="email" />
              <FormField label="Celular" value={form.celular} onChange={v => update("celular", v)} />
            </div>
          </fieldset>

          {/* Endereço */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-primary">Endereço</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="CEP" value={form.cep} onChange={v => update("cep", v)} />
              <FormField label="UF" value={form.uf} onChange={v => update("uf", v)} />
              <FormField label="Cidade" value={form.cidade} onChange={v => update("cidade", v)} />
              <FormField label="Bairro" value={form.bairro} onChange={v => update("bairro", v)} />
            </div>
            <FormField label="Endereço" value={form.endereco} onChange={v => update("endereco", v)} />
          </fieldset>

          {/* Profissional */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-primary">Dados Profissionais</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Local de Trabalho" value={form.local_trabalho} onChange={v => update("local_trabalho", v)} />
              <FormField label="Função" value={form.funcao} onChange={v => update("funcao", v)} />
              <FormField label="Esfera" value={form.esfera} onChange={v => update("esfera", v)} />
            </div>
          </fieldset>

          {/* Bancário */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-primary">Dados Bancários</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Banco" value={form.banco} onChange={v => update("banco", v)} />
              <FormField label="Agência" value={form.agencia} onChange={v => update("agencia", v)} />
              <FormField label="Conta Corrente" value={form.conta_corrente} onChange={v => update("conta_corrente", v)} />
            </div>
          </fieldset>

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={loading} className="flex-1 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </Button>
            <Button onClick={onClose} variant="outline" disabled={loading}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
