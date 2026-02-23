/**
 * Relatório 3: Cadastros por período
 */

import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STATUS_GESTOR_CONFIG, type StatusGestor, formatarCPF } from '@/types/gestoresEscolares';
import { buscarTodosGestores, type GestorRelatorio } from '@/services/relatoriosGestoresService';
import { exportarParaExcel } from '@/export/exportExcel';
import { exportarParaCSV } from '@/export/exportCSV';

export default function RelatorioPeriodo() {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [resultados, setResultados] = useState<GestorRelatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);

  const buscar = async () => {
    if (!dataInicio || !dataFim) return;
    setLoading(true);
    setPesquisou(true);
    try {
      const dados = await buscarTodosGestores({ dataInicio, dataFim });
      setResultados(dados);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const prepararExport = () =>
    resultados.map((g) => ({
      Nome: g.nome,
      Email: g.email,
      CPF: formatarCPF(g.cpf),
      Município: g.escola?.municipio || '',
      Status: STATUS_GESTOR_CONFIG[g.status as StatusGestor]?.label || g.status,
      'Data Cadastro': new Date(g.created_at).toLocaleDateString('pt-BR'),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cadastros por Período</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Data Início</label>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
          <Button onClick={buscar} disabled={!dataInicio || !dataFim || loading}>
            <Search className="h-4 w-4 mr-1" /> Consultar
          </Button>
        </div>

        {pesquisou && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <strong>{resultados.length}</strong> cadastro(s) entre{' '}
                {new Date(dataInicio).toLocaleDateString('pt-BR')} e{' '}
                {new Date(dataFim).toLocaleDateString('pt-BR')}
              </p>
              {resultados.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportarParaExcel(prepararExport(), 'gestores-periodo', 'Período')}>
                    <Download className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportarParaCSV(prepararExport(), 'gestores-periodo')}>
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                </div>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : resultados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum cadastro encontrado no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  resultados.map((g) => {
                    const cfg = STATUS_GESTOR_CONFIG[g.status as StatusGestor];
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.nome}</TableCell>
                        <TableCell>{g.email}</TableCell>
                        <TableCell>{formatarCPF(g.cpf)}</TableCell>
                        <TableCell>{g.escola?.municipio || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${cfg?.bgColor || ''} ${cfg?.color || ''}`}>
                            {cfg?.label || g.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(g.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
