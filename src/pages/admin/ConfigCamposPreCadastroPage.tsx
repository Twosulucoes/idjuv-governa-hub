/**
 * Painel Admin — Configuração de Campos do Pré-Cadastro
 * 
 * Permite ativar/desativar campos e seções opcionais do formulário
 */
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormFieldConfig, type FormFieldConfig } from "@/hooks/useFormFieldConfig";
import { useToast } from "@/hooks/use-toast";
import { Settings2, FileText, User, LayoutGrid, Lock } from "lucide-react";

const SECTION_META: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  secoes: {
    title: "Seções do Formulário",
    description: "Ative ou desative seções inteiras do pré-cadastro",
    icon: <LayoutGrid className="h-5 w-5" />,
  },
  documentos: {
    title: "Documentos Pessoais",
    description: "Controle quais blocos de documentos aparecem no formulário",
    icon: <FileText className="h-5 w-5" />,
  },
  dados_pessoais: {
    title: "Dados Pessoais Opcionais",
    description: "Campos adicionais de informação pessoal",
    icon: <User className="h-5 w-5" />,
  },
};

const SECTION_ORDER = ["secoes", "documentos", "dados_pessoais"];

function FieldToggleRow({
  field,
  onToggleEnabled,
  onToggleRequired,
}: {
  field: FormFieldConfig;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onToggleRequired: (id: string, required: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{field.label}</span>
          {field.required && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Lock className="h-3 w-3" />
              Obrigatório
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Campo: <code className="bg-muted px-1 rounded">{field.field_key}</code>
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Toggle obrigatório - só aparece se campo está habilitado */}
        {field.enabled && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Obrigatório</span>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onToggleRequired(field.id, checked)}
            />
          </div>
        )}

        {/* Toggle ativar/desativar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {field.enabled ? "Ativo" : "Inativo"}
          </span>
          <Switch
            checked={field.enabled}
            onCheckedChange={(checked) => onToggleEnabled(field.id, checked)}
          />
        </div>
      </div>
    </div>
  );
}

export default function ConfigCamposPreCadastroPage() {
  const { bySection, loading, updateField } = useFormFieldConfig("pre_cadastro");
  const { toast } = useToast();

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    const ok = await updateField(id, { enabled, ...(enabled ? {} : { required: false }) });
    if (ok) {
      toast({ title: enabled ? "Campo ativado" : "Campo desativado" });
    }
  };

  const handleToggleRequired = async (id: string, required: boolean) => {
    const ok = await updateField(id, { required });
    if (ok) {
      toast({ title: required ? "Definido como obrigatório" : "Definido como opcional" });
    }
  };

  return (
    <AdminLayout title="Campos do Pré-Cadastro" description="Configure quais campos e seções aparecem no formulário de pré-cadastro de servidores">
      <div className="space-y-6 max-w-4xl">
        {/* Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Settings2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Configuração de Campos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Desative campos que não são necessários para sua instituição. 
                  Campos desativados não aparecerão no formulário público de pré-cadastro.
                  Campos obrigatórios serão validados antes do envio.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          SECTION_ORDER.map((sectionKey) => {
            const meta = SECTION_META[sectionKey];
            const sectionFields = bySection[sectionKey as keyof typeof bySection] || [];

            if (sectionFields.length === 0) return null;

            return (
              <Card key={sectionKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {meta.icon}
                    {meta.title}
                  </CardTitle>
                  <CardDescription>{meta.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {sectionFields.map((field) => (
                      <FieldToggleRow
                        key={field.id}
                        field={field}
                        onToggleEnabled={handleToggleEnabled}
                        onToggleRequired={handleToggleRequired}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Stats */}
        {!loading && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Total: {Object.values(bySection).flat().length} campos configuráveis
                </span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    {Object.values(bySection).flat().filter(f => f.enabled).length} ativos
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    {Object.values(bySection).flat().filter(f => !f.enabled).length} inativos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
