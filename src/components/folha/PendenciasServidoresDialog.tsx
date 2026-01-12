import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, CheckCircle2, ExternalLink, UserX, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PendenciasServidoresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ServidorCompleto {
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
  tem_provimento_ativo: boolean;
  vencimento_base: number | null;
}

type TipoPendencia = 'cadastro' | 'elegibilidade';

interface Pendencia {
  tipo: TipoPendencia;
  descricao: string;
}

export function PendenciasServidoresDialog({
  open,
  onOpenChange,
}: PendenciasServidoresDialogProps) {
  const navigate = useNavigate();

  // Buscar servidores ativos com dados de provimento
  const { data: servidores, isLoading } = useQuery({
    queryKey: ["servidores-pendencias-completo"],
    queryFn: async () => {
      // Buscar servidores ativos
      const { data: servidoresData, error: servidoresError } = await supabase
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
          cargo_atual:cargos!servidores_cargo_atual_id_fkey(nome, vencimento_base)
        `)
        .eq("situacao", "ativo")
        .eq("ativo", true)
        .order("nome_completo");

      if (servidoresError) throw servidoresError;

      // Buscar provimentos ativos
      const { data: provimentosAtivos, error: provimentosError } = await supabase
        .from("provimentos")
        .select("servidor_id, cargo_id, cargos!provimentos_cargo_id_fkey(vencimento_base)")
        .eq("status", "ativo");

      if (provimentosError) throw provimentosError;

      // Mapear provimentos por servidor
      const provimentosPorServidor = new Map<string, { vencimento: number | null }>();
      provimentosAtivos?.forEach((p: any) => {
        provimentosPorServidor.set(p.servidor_id, {
          vencimento: p.cargos?.vencimento_base || null
        });
      });

      return servidoresData.map((s: any) => {
        const provimento = provimentosPorServidor.get(s.id);
        return {
          id: s.id,
          nome_completo: s.nome_completo,
          cpf: s.cpf,
          matricula: s.matricula,
          data_nascimento: s.data_nascimento,
          pis_pasep: s.pis_pasep,
          banco_codigo: s.banco_codigo,
          banco_agencia: s.banco_agencia,
          banco_conta: s.banco_conta,
          cargo_nome: s.cargo_atual?.nome || null,
          tem_provimento_ativo: !!provimento,
          vencimento_base: provimento?.vencimento || s.cargo_atual?.vencimento_base || null,
        };
      }) as ServidorCompleto[];
    },
    enabled: open,
  });

  const getPendencias = (servidor: ServidorCompleto): Pendencia[] => {
    const pendencias: Pendencia[] = [];
    
    // Pendências de elegibilidade (impedem entrada na folha)
    if (!servidor.tem_provimento_ativo) {
      pendencias.push({ tipo: 'elegibilidade', descricao: 'Sem provimento ativo' });
    }
    if (servidor.tem_provimento_ativo && (!servidor.vencimento_base || servidor.vencimento_base <= 0)) {
      pendencias.push({ tipo: 'elegibilidade', descricao: 'Cargo sem vencimento' });
    }
    
    // Pendências de cadastro (dados obrigatórios para CNAB/eSocial)
    if (!servidor.data_nascimento) pendencias.push({ tipo: 'cadastro', descricao: 'Data Nascimento' });
    if (!servidor.pis_pasep) pendencias.push({ tipo: 'cadastro', descricao: 'PIS/PASEP' });
    if (!servidor.banco_codigo) pendencias.push({ tipo: 'cadastro', descricao: 'Banco' });
    if (!servidor.banco_agencia) pendencias.push({ tipo: 'cadastro', descricao: 'Agência' });
    if (!servidor.banco_conta) pendencias.push({ tipo: 'cadastro', descricao: 'Conta' });
    
    return pendencias;
  };

  // Separar servidores por tipo de situação
  const servidoresElegiveis = servidores?.filter(s => s.tem_provimento_ativo && s.vencimento_base && s.vencimento_base > 0) || [];
  const servidoresNaoElegiveis = servidores?.filter(s => !s.tem_provimento_ativo || !s.vencimento_base || s.vencimento_base <= 0) || [];
  
  const elegiveisComPendenciasCadastro = servidoresElegiveis.filter(s => 
    getPendencias(s).some(p => p.tipo === 'cadastro')
  );
  const elegiveisCompletos = servidoresElegiveis.filter(s => 
    !getPendencias(s).some(p => p.tipo === 'cadastro')
  );

  const renderBadge = (pendencia: Pendencia) => {
    const isElegibilidade = pendencia.tipo === 'elegibilidade';
    return (
      <Badge
        key={pendencia.descricao}
        variant="outline"
        className={isElegibilidade 
          ? "text-xs border-red-300 text-red-700 bg-red-50" 
          : "text-xs border-orange-300 text-orange-700 bg-orange-50"
        }
      >
        {pendencia.descricao}
      </Badge>
    );
  };

  const renderServidorRow = (servidor: ServidorCompleto) => {
    const pendencias = getPendencias(servidor);
    return (
      <TableRow key={servidor.id}>
        <TableCell className="font-medium">{servidor.nome_completo}</TableCell>
        <TableCell className="font-mono">{servidor.matricula || "-"}</TableCell>
        <TableCell>{servidor.cargo_nome || "-"}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {pendencias.map(renderBadge)}
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
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Diagnóstico de Servidores para Folha</DialogTitle>
          <DialogDescription>
            Verificação de elegibilidade e dados obrigatórios para processamento
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground">Total Ativos</p>
                  <p className="text-xl font-bold">{servidores?.length || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-700">Prontos</span>
                  </div>
                  <p className="text-xl font-bold text-green-700">{elegiveisCompletos.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-orange-700">Pendências Cadastro</span>
                  </div>
                  <p className="text-xl font-bold text-orange-700">{elegiveisComPendenciasCadastro.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-1">
                    <UserX className="h-4 w-4 text-red-600" />
                    <span className="text-xs text-red-700">Não Elegíveis</span>
                  </div>
                  <p className="text-xl font-bold text-red-700">{servidoresNaoElegiveis.length}</p>
                </div>
              </div>

              <Tabs defaultValue="nao-elegiveis" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="nao-elegiveis" className="text-xs">
                    Não Elegíveis ({servidoresNaoElegiveis.length})
                  </TabsTrigger>
                  <TabsTrigger value="pendencias-cadastro" className="text-xs">
                    Pendências Cadastro ({elegiveisComPendenciasCadastro.length})
                  </TabsTrigger>
                  <TabsTrigger value="completos" className="text-xs">
                    Prontos ({elegiveisCompletos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="nao-elegiveis" className="mt-4">
                  {servidoresNaoElegiveis.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Servidor</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead className="w-[80px]">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {servidoresNaoElegiveis.map(renderServidorRow)}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <p>Todos os servidores ativos são elegíveis!</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Servidores sem provimento ativo ou cargo sem vencimento não entram no processamento da folha.
                  </p>
                </TabsContent>

                <TabsContent value="pendencias-cadastro" className="mt-4">
                  {elegiveisComPendenciasCadastro.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Servidor</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Pendências</TableHead>
                            <TableHead className="w-[80px]">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {elegiveisComPendenciasCadastro.map(renderServidorRow)}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <p>Todos os elegíveis têm cadastro completo!</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Estes servidores entram na folha, mas podem ter problemas na geração de CNAB ou eSocial.
                  </p>
                </TabsContent>

                <TabsContent value="completos" className="mt-4">
                  {elegiveisCompletos.length > 0 ? (
                    <div className="rounded-md border max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Servidor</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead className="w-[80px]">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {elegiveisCompletos.map((servidor) => (
                            <TableRow key={servidor.id}>
                              <TableCell className="font-medium">{servidor.nome_completo}</TableCell>
                              <TableCell className="font-mono">{servidor.matricula || "-"}</TableCell>
                              <TableCell>{servidor.cargo_nome || "-"}</TableCell>
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
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                      <p>Nenhum servidor com cadastro completo encontrado.</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Servidores prontos para processamento completo da folha.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
