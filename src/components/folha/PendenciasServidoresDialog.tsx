import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface PendenciasServidoresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ServidorPendencia {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula: string | null;
  data_nascimento: string | null;
  pis_pasep: string | null;
  banco_codigo: string | null;
  banco_agencia: string | null;
  banco_conta: string | null;
  cargo_nome: string | null;
}

export function PendenciasServidoresDialog({
  open,
  onOpenChange,
}: PendenciasServidoresDialogProps) {
  const navigate = useNavigate();

  const { data: servidores, isLoading } = useQuery({
    queryKey: ["servidores-pendencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          data_nascimento,
          pis_pasep,
          banco_codigo,
          banco_agencia,
          banco_conta,
          cargo_atual:cargos!servidores_cargo_atual_id_fkey(nome)
        `)
        .eq("situacao", "ativo")
        .order("nome_completo");

      if (error) throw error;

      return data.map((s: any) => ({
        ...s,
        cargo_nome: s.cargo_atual?.nome || null,
      })) as ServidorPendencia[];
    },
    enabled: open,
  });

  const getPendencias = (servidor: ServidorPendencia) => {
    const pendencias: string[] = [];
    if (!servidor.data_nascimento) pendencias.push("Data Nascimento");
    if (!servidor.pis_pasep) pendencias.push("PIS/PASEP");
    if (!servidor.banco_codigo) pendencias.push("Banco");
    if (!servidor.banco_agencia) pendencias.push("Agência");
    if (!servidor.banco_conta) pendencias.push("Conta");
    return pendencias;
  };

  const servidoresComPendencias = servidores?.filter(
    (s) => getPendencias(s).length > 0
  ) || [];

  const servidoresCompletos = servidores?.filter(
    (s) => getPendencias(s).length === 0
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pendências de Dados dos Servidores</DialogTitle>
          <DialogDescription>
            Dados obrigatórios para processamento de folha, CNAB e eSocial
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Dados Completos
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {servidoresCompletos.length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">
                      Com Pendências
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700 mt-1">
                    {servidoresComPendencias.length}
                  </p>
                </div>
              </div>

              {/* Lista de Pendências */}
              {servidoresComPendencias.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servidor</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Pendências</TableHead>
                        <TableHead className="w-[100px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servidoresComPendencias.map((servidor) => (
                        <TableRow key={servidor.id}>
                          <TableCell className="font-medium">
                            {servidor.nome_completo}
                          </TableCell>
                          <TableCell className="font-mono">
                            {servidor.matricula || "-"}
                          </TableCell>
                          <TableCell>{servidor.cargo_nome || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getPendencias(servidor).map((p) => (
                                <Badge
                                  key={p}
                                  variant="outline"
                                  className="text-xs border-orange-300 text-orange-700 bg-orange-50"
                                >
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onOpenChange(false);
                                navigate(`/rh/servidores/${servidor.id}`);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-lg font-medium text-green-700">
                    Todos os servidores têm dados completos!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pronto para processamento de folha, CNAB e eSocial.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
