import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Loader2, User, FileText, MapPin, Phone, Briefcase, Building2, Pencil, Trash2, Trophy } from "lucide-react";
import { format } from "date-fns";
import type { ArbitroCadastro } from "../arbitrosAdminService";
import { updateModalidadeStatus } from "../arbitrosAdminService";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  arbitro: ArbitroCadastro;
  onClose: () => void;
  onChangeStatus: (status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  loading: boolean;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  enviado: { label: "Enviado", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function AdminDetalheModal({ arbitro, onClose, onChangeStatus, onEdit, onDelete, loading }: Props) {
  const badge = STATUS_MAP[arbitro.status] || STATUS_MAP.pendente;
  const [updatingMod, setUpdatingMod] = useState<string | null>(null);

  async function handleModStatus(modId: string, status: string) {
    setUpdatingMod(modId);
    try {
      await updateModalidadeStatus(modId, status);
      toast.success(`Modalidade ${status === 'aprovado' ? 'aprovada' : 'rejeitada'}`);
      // Close and reopen to refresh
      onClose();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setUpdatingMod(null);
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{arbitro.nome}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Protocolo */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Protocolo</p>
              <p className="font-mono font-bold">{arbitro.protocolo || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cadastro em</p>
              <p className="text-sm">{format(new Date(arbitro.created_at), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>

          {/* Foto */}
          {arbitro.foto_url && (
            <div className="flex justify-center">
              <img src={arbitro.foto_url} alt="Foto" className="w-24 h-24 rounded-lg object-cover border" />
            </div>
          )}

          {/* Seções */}
          <Section icon={User} title="Dados Pessoais">
            <Field label="Nacionalidade" value={arbitro.nacionalidade === "brasileira" ? "Brasileira" : "Estrangeira"} />
            <Field label="Sexo" value={arbitro.sexo === "M" ? "Masculino" : "Feminino"} />
            <Field label="Data Nasc." value={format(new Date(arbitro.data_nascimento), "dd/MM/yyyy")} />
            <Field label="Tipo Sanguíneo" value={arbitro.tipo_sanguineo} />
            <Field label="Fator RH" value={arbitro.fator_rh === "+" ? "Positivo" : arbitro.fator_rh === "-" ? "Negativo" : null} />
          </Section>

          <Separator />

          {/* Modalidades */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-primary" /> Modalidades ({arbitro.modalidades_lista?.length || 0})
            </h4>
            {arbitro.modalidades_lista && arbitro.modalidades_lista.length > 0 ? (
              <div className="space-y-2 pl-6">
                {arbitro.modalidades_lista.map(mod => {
                  const modBadge = STATUS_MAP[mod.status] || STATUS_MAP.pendente;
                  return (
                    <div key={mod.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{mod.modalidade}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {mod.categoria === 'estadual' ? '🏅 Estadual' : '🏆 Nacional'}
                          </Badge>
                          <Badge variant={modBadge.variant} className="text-xs">
                            {modBadge.label}
                          </Badge>
                        </div>
                        {(mod.status === 'pendente' || mod.status === 'enviado') && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600"
                              onClick={() => handleModStatus(mod.id, 'aprovado')}
                              disabled={updatingMod === mod.id}
                            >
                              {updatingMod === mod.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleModStatus(mod.id, 'rejeitado')}
                              disabled={updatingMod === mod.id}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {mod.documentos_urls.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {mod.documentos_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                              Doc {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pl-6">
                <Field label="Modalidade (legado)" value={arbitro.modalidade} />
                <Field label="Categoria (legado)" value={arbitro.categoria === "estadual" ? "🏅 Estadual" : arbitro.categoria === "nacional" ? "🏆 Nacional" : arbitro.categoria} />
              </div>
            )}
          </div>

          <Separator />

          <Section icon={FileText} title="Documentos">
            <Field label="CPF" value={arbitro.cpf} />
            <Field label="RG" value={arbitro.rg} />
            <Field label="RNE" value={arbitro.rne} />
            <Field label="Validade RNE" value={arbitro.validade_rne ? format(new Date(arbitro.validade_rne), "dd/MM/yyyy") : null} />
            <Field label="PIS/PASEP" value={arbitro.pis_pasep} />
          </Section>

          <Separator />

          <Section icon={MapPin} title="Endereço">
            <Field label="CEP" value={arbitro.cep} />
            <Field label="Endereço" value={arbitro.endereco} />
            <Field label="Complemento" value={arbitro.complemento} />
            <Field label="Bairro" value={arbitro.bairro} />
            <Field label="Cidade" value={arbitro.cidade} />
            <Field label="UF" value={arbitro.uf} />
          </Section>

          <Separator />

          <Section icon={Phone} title="Contato">
            <Field label="E-mail" value={arbitro.email} />
            <Field label="Celular" value={arbitro.celular} />
          </Section>

          <Separator />

          <Section icon={Briefcase} title="Dados Profissionais">
            <Field label="Local de Trabalho" value={arbitro.local_trabalho} />
            <Field label="Função" value={arbitro.funcao} />
            <Field label="Esfera" value={arbitro.esfera} />
          </Section>

          <Separator />

          <Section icon={Building2} title="Dados Bancários">
            <Field label="Banco" value={arbitro.banco} />
            <Field label="Agência" value={arbitro.agencia} />
            <Field label="Conta Corrente" value={arbitro.conta_corrente} />
          </Section>

          {/* Documentos anexos */}
          {arbitro.documentos_urls && (arbitro.documentos_urls as string[]).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Documentos Gerais Anexos</h4>
                <div className="flex flex-wrap gap-2">
                  {(arbitro.documentos_urls as string[]).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                      Documento {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {(arbitro.status === "pendente" || arbitro.status === "enviado") && (
              <>
                <Button onClick={() => onChangeStatus("aprovado")} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Aprovar Cadastro
                </Button>
                <Button onClick={() => onChangeStatus("rejeitado")} disabled={loading} variant="destructive" className="flex-1 gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Rejeitar
                </Button>
              </>
            )}
            <Button onClick={onEdit} variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button onClick={onDelete} variant="ghost" className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" /> {title}
      </h4>
      <div className="grid gap-1 sm:grid-cols-2 pl-6">{children}</div>
    </div>
  );
}