import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useTabelaINSS, useTabelaIRRF } from "@/hooks/useFolhaPagamento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function TabelasImpostosTab() {
  const { data: tabelaINSS, isLoading: loadingINSS } = useTabelaINSS();
  const { data: tabelaIRRF, isLoading: loadingIRRF } = useTabelaIRRF();

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabela INSS */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela INSS Progressivo</CardTitle>
          <CardDescription>
            Faixas de contribuição previdenciária vigentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingINSS ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="text-right">De</TableHead>
                    <TableHead className="text-right">Até</TableHead>
                    <TableHead className="text-right">Alíquota</TableHead>
                    <TableHead>Vigência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabelaINSS?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma faixa cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    tabelaINSS?.map((faixa, index) => (
                      <TableRow key={faixa.id}>
                        <TableCell className="font-medium">{index + 1}ª Faixa</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(faixa.valor_minimo)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {faixa.valor_maximo >= 99999999
                            ? "Sem limite"
                            : formatCurrency(faixa.valor_maximo)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {faixa.aliquota.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          A partir de{" "}
                          {format(new Date(faixa.vigencia_inicio), "MMM/yyyy", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            O cálculo do INSS é feito de forma progressiva: cada faixa incide apenas sobre a parcela do salário 
            que está dentro dela, similar ao IRRF.
          </p>
        </CardContent>
      </Card>

      {/* Tabela IRRF */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela IRRF</CardTitle>
          <CardDescription>
            Faixas do Imposto de Renda Retido na Fonte vigentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingIRRF ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="text-right">De</TableHead>
                    <TableHead className="text-right">Até</TableHead>
                    <TableHead className="text-right">Alíquota</TableHead>
                    <TableHead className="text-right">Dedução</TableHead>
                    <TableHead>Vigência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabelaIRRF?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma faixa cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    tabelaIRRF?.map((faixa, index) => (
                      <TableRow key={faixa.id}>
                        <TableCell className="font-medium">
                          {index === 0 ? "Isento" : `${index}ª Faixa`}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(faixa.valor_minimo)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {faixa.valor_maximo >= 99999999
                            ? "Sem limite"
                            : formatCurrency(faixa.valor_maximo)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {faixa.aliquota.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(faixa.parcela_deduzir)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          A partir de{" "}
                          {format(new Date(faixa.vigencia_inicio), "MMM/yyyy", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Fórmula: IRRF = (Base de Cálculo × Alíquota) - Dedução - (Nº Dependentes × Dedução por Dependente)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
