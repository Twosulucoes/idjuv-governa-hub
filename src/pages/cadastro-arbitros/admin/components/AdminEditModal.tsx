/**
 * Modal de Edição Completa de Árbitro (Admin)
 * Suporta múltiplas modalidades, seguindo o padrão do formulário público
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, Trash2, Trophy, Upload, X, FileText } from "lucide-react";
import { MODALIDADES_ESPORTIVAS } from "../../modalidadesEsportivas";
import { syncModalidades, type ModalidadeInput } from "../arbitrosAdminService";
import type { ArbitroCadastro } from "../arbitrosAdminService";

interface Props {
  arbitro: ArbitroCadastro;
  onClose: () => void;
  onSave: (dados: Partial<ArbitroCadastro>) => void;
  loading: boolean;
}

export function AdminEditModal({ arbitro, onClose, onSave, loading: externalLoading }: Props) {
  const [saving, setSaving] = useState(false);
  const loading = externalLoading || saving;

  const [form, setForm] = useState({
    nome: arbitro.nome,
    email: arbitro.email,
    celular: arbitro.celular,
    sexo: arbitro.sexo,
    cpf: arbitro.cpf,
    rg: arbitro.rg || "",
    rne: arbitro.rne || "",
    nacionalidade: arbitro.nacionalidade || "brasileira",
    data_nascimento: arbitro.data_nascimento || "",
    tipo_sanguineo: arbitro.tipo_sanguineo || "",
    fator_rh: arbitro.fator_rh || "",
    pis_pasep: arbitro.pis_pasep || "",
    uf: arbitro.uf || "",
    cidade: arbitro.cidade || "",
    endereco: arbitro.endereco || "",
    bairro: arbitro.bairro || "",
    cep: arbitro.cep || "",
    complemento: arbitro.complemento || "",
    local_trabalho: arbitro.local_trabalho || "",
    funcao: arbitro.funcao || "",
    esfera: arbitro.esfera || "",
    banco: arbitro.banco || "",
    agencia: arbitro.agencia || "",
    conta_corrente: arbitro.conta_corrente || "",
    status: arbitro.status,
  });

  // Inicializar modalidades a partir dos dados existentes
  const [modalidades, setModalidades] = useState<ModalidadeInput[]>(() => {
    if (arbitro.modalidades_lista && arbitro.modalidades_lista.length > 0) {
      return arbitro.modalidades_lista.map(m => ({
        id: m.id,
        modalidade: m.modalidade,
        categoria: m.categoria,
        documentos_urls: m.documentos_urls || [],
      }));
    }
    // Fallback: usar campo texto legado
    if (arbitro.modalidade) {
      return arbitro.modalidade.split(",").map(m => ({
        modalidade: m.trim(),
        categoria: arbitro.categoria || "estadual",
        documentos_urls: [],
      }));
    }
    return [];
  });

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const usedModalidades = modalidades.map(m => m.modalidade);
  const availableModalidades = MODALIDADES_ESPORTIVAS.filter(m => !usedModalidades.includes(m));

  function addModalidade() {
    setModalidades(prev => [...prev, { modalidade: "", categoria: "", documentos_urls: [] }]);
  }

  function removeModalidade(index: number) {
    setModalidades(prev => prev.filter((_, i) => i !== index));
  }

  function updateModalidade(index: number, field: keyof ModalidadeInput, value: any) {
    setModalidades(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleDocUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploadingIndex(index);

    const newUrls = [...modalidades[index].documentos_urls];
    for (const file of Array.from(files)) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 2MB.");
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `modalidades/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("arbitros-docs").upload(path, file);
      if (error) {
        toast.error("Erro no upload: " + error.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from("arbitros-docs").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }

    updateModalidade(index, "documentos_urls", newUrls);
    setUploadingIndex(null);
  }

  function removeDoc(modIndex: number, docIndex: number) {
    const updated = [...modalidades[modIndex].documentos_urls];
    updated.splice(docIndex, 1);
    updateModalidade(modIndex, "documentos_urls", updated);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (modalidades.length > 0 && modalidades.some(m => !m.modalidade || !m.categoria)) {
      toast.error("Preencha todas as modalidades e categorias");
      return;
    }

    setSaving(true);
    try {
      // 1. Salvar dados principais
      const changes: Record<string, unknown> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== (arbitro as any)[k]) changes[k] = v || null;
      });
      if (Object.keys(changes).length > 0) {
        onSave(changes as Partial<ArbitroCadastro>);
      }

      // 2. Sincronizar modalidades
      await syncModalidades(arbitro.id, modalidades);

      if (Object.keys(changes).length === 0) {
        toast.success("Modalidades atualizadas com sucesso");
        onClose();
      }
    } catch (err: any) {
      console.error("Erro ao salvar edição:", err);
      toast.error("Erro ao salvar modalidades: " + err.message);
    } finally {
      setSaving(false);
    }
  }

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
              <FormField label="CPF" value={form.cpf} onChange={v => update("cpf", v)} />
              <FormField label="RG" value={form.rg} onChange={v => update("rg", v)} />
              <FormField label="Data Nascimento" value={form.data_nascimento} onChange={v => update("data_nascimento", v)} type="date" />
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enviado">Enviado</SelectItem>
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
            <FormField label="Complemento" value={form.complemento} onChange={v => update("complemento", v)} />
          </fieldset>

          {/* Modalidades */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-primary flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Modalidades Esportivas
            </legend>
            <p className="text-xs text-muted-foreground">
              Gerencie as modalidades do árbitro. Cada uma será avaliada independentemente.
            </p>

            {modalidades.length === 0 && (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm mb-2">Nenhuma modalidade</p>
                <Button onClick={addModalidade} variant="outline" size="sm" className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
            )}

            {modalidades.map((mod, index) => (
              <Card key={index} className="border border-primary/20">
                <CardContent className="pt-3 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">Modalidade {index + 1}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 text-destructive gap-1 text-xs" onClick={() => removeModalidade(index)}>
                      <Trash2 className="h-3 w-3" /> Remover
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Modalidade *</Label>
                      <Select value={mod.modalidade} onValueChange={v => updateModalidade(index, "modalidade", v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent className="max-h-[280px]">
                          {mod.modalidade && <SelectItem value={mod.modalidade}>{mod.modalidade}</SelectItem>}
                          {availableModalidades.filter(m => m !== mod.modalidade).map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Categoria *</Label>
                      <div className="flex gap-1.5">
                        {[
                          { value: "estadual", label: "🏅 Estadual" },
                          { value: "nacional", label: "🏆 Nacional" },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateModalidade(index, "categoria", opt.value)}
                            className={`flex-1 py-2 px-2 rounded-md border text-xs font-semibold transition-all
                              ${mod.categoria === opt.value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:border-primary/50"
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Docs da modalidade */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 px-2 py-2 border border-dashed rounded cursor-pointer hover:bg-muted/50 text-xs">
                      {uploadingIndex === index ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-muted-foreground">Enviar documentos</span>
                      <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => handleDocUpload(index, e)} disabled={uploadingIndex === index} />
                    </label>
                    {mod.documentos_urls.length > 0 && (
                      <div className="space-y-1">
                        {mod.documentos_urls.map((url, di) => (
                          <div key={di} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1 text-xs">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <a href={url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 hover:underline">Doc {di + 1}</a>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeDoc(index, di)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {modalidades.length > 0 && availableModalidades.length > 0 && (
              <Button onClick={addModalidade} variant="outline" size="sm" className="w-full gap-1 border-dashed text-xs">
                <Plus className="h-3.5 w-3.5" /> Adicionar Outra Modalidade
              </Button>
            )}
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
