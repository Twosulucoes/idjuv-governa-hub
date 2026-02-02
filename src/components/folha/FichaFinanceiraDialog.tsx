import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, DollarSign, Calculator, Printer, User, Building, CreditCard } from "lucide-react";
import { useFichaFinanceiraDetalhe, useItensFichaFinanceira } from "@/hooks/useFolhaPagamento";
import { MESES, TIPO_RUBRICA_LABELS, type TipoRubrica } from "@/types/folha";
import { generateContracheque } from "@/lib/pdfContracheque";

interface FichaFinanceiraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fichaId: string;
}

export function FichaFinanceiraDialog({ open, onOpenChange, fichaId }: FichaFinanceiraDialogProps) {
  const [gerando, setGerando] = useState(false);
  
  const { data: ficha, isLoading: loadingFicha } = useFichaFinanceiraDetalhe(fichaId);
  const { data: itens, isLoading: loadingItens } = useItensFichaFinanceira(fichaId);

  const formatCurrency = (value: number | null | undefined) => {
    return (value ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleGerarContracheque = async () => {
    if (!ficha) return;
    
    setGerando(true);
    try {
      const competenciaAno = ficha.competencia_ano || new Date().getFullYear();
      const competenciaMes = ficha.competencia_mes || 1;
      const competencia = `${MESES[competenciaMes - 1]}/${competenciaAno}`;
      
      // Preparar itens para o PDF
      const proventos = itens?.filter(i => i.tipo === 'provento') || [];
      const descontos = itens?.filter(i => i.tipo === 'desconto') || [];
      
      // Construir rubricas para o formato esperado
      const rubricas = [
        ...proventos.map(p => ({
          codigo: p.rubrica_id?.substring(0, 4) || '0001',
          descricao: p.descricao || 'Provento',
          tipo: 'provento' as const,
          referencia: p.percentual ? Number(p.percentual) : undefined,
          valor: Number(p.valor) || 0,
        })),
        ...descontos.map(d => ({
          codigo: d.rubrica_id?.substring(0, 4) || '0001',
          descricao: d.descricao || 'Desconto',
          tipo: 'desconto' as const,
          referencia: d.percentual ? Number(d.percentual) : undefined,
          valor: Number(d.valor) || 0,
        })),
      ];

      await generateContracheque({
        ficha: {
          id: ficha.id,
          servidor_id: ficha.servidor_id || '',
          cargo_nome: ficha.cargo_nome,
          unidade_nome: ficha.unidade_nome,
          total_proventos: ficha.total_proventos || 0,
          total_descontos: ficha.total_descontos || 0,
          valor_liquido: ficha.valor_liquido || 0,
          base_inss: ficha.base_inss,
          valor_inss: ficha.valor_inss,
          base_irrf: ficha.base_irrf,
          valor_irrf: ficha.valor_irrf,
          quantidade_dependentes: ficha.quantidade_dependentes,
          rubricas,
          servidor: ficha.servidor ? {
            nome_completo: ficha.servidor.nome_completo,
            cpf: ficha.servidor.cpf || '',
            matricula: ficha.servidor.matricula,
            pis_pasep: ficha.servidor.pis_pasep,
          } : undefined,
        },
        competencia,
        competenciaAno,
        competenciaMes,
      });
    } catch (error) {
      console.error("Erro ao gerar contracheque:", error);
    } finally {
      setGerando(false);
    }
  };

  if (loadingFicha) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!ficha) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ficha não encontrada</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const competencia = `${MESES[(ficha.competencia_mes || 1) - 1]}/${ficha.competencia_ano || new Date().getFullYear()}`;
  const proventos = itens?.filter(i => i.tipo === 'provento') || [];
  const descontos = itens?.filter(i => i.tipo === 'desconto') || [];
  const informativos = itens?.filter(i => i.tipo === 'informativo' || i.tipo === 'encargo') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ficha Financeira - {competencia}
          </DialogTitle>
          <DialogDescription>
            {ficha.servidor?.nome_completo} • Matrícula: {ficha.servidor?.matricula}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="detalhes">Rubricas</TabsTrigger>
            <TabsTrigger value="tributos">Tributos</TabsTrigger>
          </TabsList>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="space-y-4">
            {/* Dados do Servidor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{ficha.servidor?.nome_completo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Matrícula:</span>
                  <p className="font-medium">{ficha.servidor?.matricula}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p className="font-medium">{ficha.servidor?.cpf || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cargo:</span>
                  <p className="font-medium">{ficha.cargo_nome || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Unidade:</span>
                  <p className="font-medium">{ficha.unidade_nome || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Totalizadores */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Proventos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(ficha.total_proventos)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-800 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Total Descontos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(ficha.total_descontos)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Valor Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(ficha.valor_liquido)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dados Bancários */}
            {ficha.banco_codigo && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Dados Bancários
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Banco:</span>
                    <p className="font-medium">{ficha.banco_nome || ficha.banco_codigo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Agência:</span>
                    <p className="font-medium">{ficha.banco_agencia}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conta:</span>
                    <p className="font-medium">{ficha.banco_conta} ({ficha.banco_tipo_conta || 'CC'})</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ações */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleGerarContracheque}
                disabled={gerando}
              >
                {gerando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Gerar Contracheque
              </Button>
            </div>
          </TabsContent>

          {/* Tab Detalhes/Rubricas */}
          <TabsContent value="detalhes" className="space-y-4">
            {loadingItens ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Proventos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-700">Proventos ({proventos.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {proventos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum provento registrado</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-center">Referência</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proventos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.descricao}</TableCell>
                              <TableCell className="text-center">{item.referencia || '-'}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(Number(item.valor))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Descontos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700">Descontos ({descontos.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {descontos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum desconto registrado</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-center">Referência</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {descontos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.descricao}</TableCell>
                              <TableCell className="text-center">{item.referencia || '-'}</TableCell>
                              <TableCell className="text-right font-mono text-red-600">{formatCurrency(Number(item.valor))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Informativos */}
                {informativos.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Informativos ({informativos.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-center">Tipo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {informativos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.descricao}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{item.tipo}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(Number(item.valor))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab Tributos */}
          <TabsContent value="tributos" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* INSS */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">INSS Servidor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base de Cálculo:</span>
                    <span className="font-mono">{formatCurrency(ficha.base_inss)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Valor INSS:</span>
                    <span className="font-mono text-red-600">{formatCurrency(ficha.valor_inss)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* IRRF */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">IRRF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base de Cálculo:</span>
                    <span className="font-mono">{formatCurrency(ficha.base_irrf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dependentes:</span>
                    <span>{ficha.quantidade_dependentes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dedução Dep.:</span>
                    <span className="font-mono">{formatCurrency(ficha.valor_deducao_dependentes)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Valor IRRF:</span>
                    <span className="font-mono text-red-600">{formatCurrency(ficha.valor_irrf)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Encargos Patronais */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Encargos Patronais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">INSS Patronal:</span>
                  <p className="font-mono font-medium">{formatCurrency(ficha.inss_patronal)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">RAT:</span>
                  <p className="font-mono font-medium">{formatCurrency(ficha.rat)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Outras Entidades:</span>
                  <p className="font-mono font-medium">{formatCurrency(ficha.outras_entidades)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Encargos:</span>
                  <p className="font-mono font-medium text-orange-600">{formatCurrency(ficha.total_encargos)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Margem Consignável */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Margem Consignável</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Base Consignável (líquido):</span>
                  <p className="font-mono font-medium">{formatCurrency(ficha.base_consignavel)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Margem Utilizada:</span>
                  <p className="font-mono font-medium">{formatCurrency(ficha.margem_consignavel_usada)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
