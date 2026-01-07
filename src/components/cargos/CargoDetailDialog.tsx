import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink } from "lucide-react";

type Cargo = {
  id: string;
  nome: string;
  sigla: string | null;
  categoria: 'efetivo' | 'comissionado' | 'funcao_gratificada' | 'temporario' | 'estagiario';
  nivel_hierarquico: number | null;
  escolaridade: string | null;
  vencimento_base: number | null;
  quantidade_vagas: number | null;
  ativo: boolean | null;
  cbo: string | null;
  atribuicoes: string | null;
  competencias: string[] | null;
  responsabilidades: string[] | null;
  requisitos: string[] | null;
  conhecimentos_necessarios: string[] | null;
  experiencia_exigida: string | null;
  lei_criacao_numero: string | null;
  lei_criacao_data: string | null;
  lei_criacao_artigo: string | null;
  lei_documento_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const CATEGORIA_LABELS: Record<string, string> = {
  efetivo: "Efetivo",
  comissionado: "Comissionado",
  funcao_gratificada: "Função Gratificada",
  temporario: "Temporário",
  estagiario: "Estagiário",
};

type CargoDetailDialogProps = {
  cargo: Cargo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CargoDetailDialog({ cargo, open, onOpenChange }: CargoDetailDialogProps) {
  if (!cargo) return null;

  const formatCurrency = (value: number | null) => {
    if (!value) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Não informado";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div>
              <DialogTitle className="text-xl">{cargo.nome}</DialogTitle>
              {cargo.sigla && (
                <p className="text-sm text-muted-foreground">{cargo.sigla}</p>
              )}
            </div>
            <Badge variant={cargo.ativo ? "default" : "secondary"}>
              {cargo.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <section>
              <h3 className="font-semibold mb-3">Informações Básicas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem label="Categoria" value={CATEGORIA_LABELS[cargo.categoria]} />
                <InfoItem label="Nível Hierárquico" value={cargo.nivel_hierarquico?.toString() || "Não informado"} />
                <InfoItem label="CBO" value={cargo.cbo || "Não informado"} />
                <InfoItem label="Vagas" value={cargo.quantidade_vagas?.toString() || "1"} />
                <InfoItem label="Escolaridade" value={cargo.escolaridade || "Não informado"} />
                <InfoItem label="Experiência" value={cargo.experiencia_exigida || "Não informado"} />
              </div>
            </section>

            <Separator />

            {/* Remuneração */}
            <section>
              <h3 className="font-semibold mb-3">Remuneração</h3>
              <InfoItem label="Vencimento Base" value={formatCurrency(cargo.vencimento_base)} />
            </section>

            <Separator />

            {/* Atribuições */}
            {cargo.atribuicoes && (
              <>
                <section>
                  <h3 className="font-semibold mb-3">Atribuições</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {cargo.atribuicoes}
                  </p>
                </section>
                <Separator />
              </>
            )}

            {/* Listas */}
            {cargo.competencias && cargo.competencias.length > 0 && (
              <>
                <section>
                  <h3 className="font-semibold mb-3">Competências</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {cargo.competencias.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            {cargo.responsabilidades && cargo.responsabilidades.length > 0 && (
              <>
                <section>
                  <h3 className="font-semibold mb-3">Responsabilidades</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {cargo.responsabilidades.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            {cargo.requisitos && cargo.requisitos.length > 0 && (
              <>
                <section>
                  <h3 className="font-semibold mb-3">Requisitos</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {cargo.requisitos.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            {cargo.conhecimentos_necessarios && cargo.conhecimentos_necessarios.length > 0 && (
              <>
                <section>
                  <h3 className="font-semibold mb-3">Conhecimentos Necessários</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {cargo.conhecimentos_necessarios.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            {/* Dados Legais */}
            {(cargo.lei_criacao_numero || cargo.lei_criacao_data || cargo.lei_criacao_artigo) && (
              <section>
                <h3 className="font-semibold mb-3">Dados Legais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Lei/Decreto" value={cargo.lei_criacao_numero || "Não informado"} />
                  <InfoItem label="Data" value={formatDate(cargo.lei_criacao_data)} />
                  <InfoItem label="Artigo" value={cargo.lei_criacao_artigo || "Não informado"} />
                  {cargo.lei_documento_url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Documento</p>
                      <a
                        href={cargo.lei_documento_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Visualizar <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>Criado em: {formatDate(cargo.created_at)}</p>
              <p>Atualizado em: {formatDate(cargo.updated_at)}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
