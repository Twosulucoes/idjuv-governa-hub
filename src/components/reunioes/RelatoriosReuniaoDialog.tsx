import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, ClipboardList, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  gerarPdfListaConvocados,
  gerarPdfListaPresenca,
  gerarPdfRelatorioReuniao,
} from "@/lib/pdfRelatorioReunioes";

interface RelatoriosReuniaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reuniaoId: string;
}

export function RelatoriosReuniaoDialog({
  open,
  onOpenChange,
  reuniaoId,
}: RelatoriosReuniaoDialogProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const fetchData = async () => {
    const { data: reuniao, error: errReuniao } = await supabase
      .from("reunioes")
      .select("*")
      .eq("id", reuniaoId)
      .single();

    if (errReuniao) throw errReuniao;

    const { data: participantes, error: errPart } = await supabase
      .from("participantes_reuniao")
      .select(`
        *,
        servidor:servidor_id(nome_completo)
      `)
      .eq("reuniao_id", reuniaoId)
      .order("created_at");

    if (errPart) throw errPart;

    return { reuniao, participantes: participantes || [] };
  };

  const handleGerarRelatorio = async (tipo: "convocados" | "presenca" | "completo") => {
    setLoading(tipo);
    try {
      const { reuniao, participantes } = await fetchData();

      switch (tipo) {
        case "convocados":
          await gerarPdfListaConvocados(reuniao, participantes);
          break;
        case "presenca":
          await gerarPdfListaPresenca(reuniao, participantes);
          break;
        case "completo":
          await gerarPdfRelatorioReuniao(reuniao, participantes);
          break;
      }

      toast.success("Relatório gerado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao gerar relatório: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  const relatorios = [
    {
      id: "convocados" as const,
      title: "Lista de Convocados",
      description: "Lista com todos os participantes convocados para a reunião",
      icon: Users,
    },
    {
      id: "presenca" as const,
      title: "Lista de Presença",
      description: "Relatório de presença/ausência com justificativas",
      icon: ClipboardList,
    },
    {
      id: "completo" as const,
      title: "Relatório Completo",
      description: "Relatório com pauta, participantes e ata da reunião",
      icon: FileText,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios da Reunião
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo de relatório que deseja gerar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {relatorios.map((rel) => (
            <Card
              key={rel.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => !loading && handleGerarRelatorio(rel.id)}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <rel.icon className="h-4 w-4 text-primary" />
                  {rel.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex items-center justify-between">
                <CardDescription className="text-xs">
                  {rel.description}
                </CardDescription>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGerarRelatorio(rel.id);
                  }}
                >
                  {loading === rel.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Gerar PDF"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
