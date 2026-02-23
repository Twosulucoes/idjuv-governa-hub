/**
 * Relatório 1: Lista de Gestores com filtros, paginação e exportação
 */

import { useState, useEffect, useCallback } from 'react';
import { Download, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_GESTOR_CONFIG, type StatusGestor, formatarCPF, formatarCelular } from '@/types/gestoresEscolares';
import {
  buscarGestoresPaginado,
  buscarTodosGestores,
  listarMunicipios,
  type FiltrosGestores,
  type GestorRelatorio,
} from '@/services/relatoriosGestoresService';
import { exportarParaExcel } from '@/export/exportExcel';
import { exportarParaCSV } from '@/export/exportCSV';

export default function RelatorioGestores() {
  const [gestores, setGestores] = useState<GestorRelatorio[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<FiltrosGestores>({});

  const carregar = useCallback(async (pag: number) => {
    setLoading(true);
    try {
      const res = await buscarGestoresPaginado(filtros, pag, 50);
      setGestores(res.gestores);
      setTotal(res.total);
      setPagina(res.pagina);
      setTotalPaginas(res.totalPaginas);
    } catch (err) {
      console.error('Erro ao buscar gestores:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregar(1);
  }, [carregar]);

  useEffect(() => {
    listarMunicipios().then(setMunicipios).catch(console.error);
  }, []);

  const limparFiltros = () => {
    setFiltros({});
  };

  const prepararDadosExport = (dados: GestorRelatorio[]) =>
    dados.map((g) => ({
      Nome: g.nome,
      Email: g.email,
      CPF: formatarCPF(g.cpf),
      Telefone: formatarCelular(g.celular),
      Município: g.escola?.municipio || '',
      Status: STATUS_GESTOR_CONFIG[g.status as StatusGestor]?.label || g.status,
      'Data Cadastro': new Date(g.created_at).toLocaleDateString('pt-BR'),
    }));

  const handleExportExcel = async () => {
    const todos = await buscarTodosGestores(filtros);
    exportarParaExcel(prepararDadosExport(todos), 'gestores-escolares', 'Gestores');
  };

  const handleExportCSV = async () => {
    const todos = await buscarTodosGestores(filtros);
    exportarParaCSV(prepararDadosExport(todos), 'gestores-escolares');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lista de Gestores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Buscar por nome..."
            value={filtros.nome || ''}
            onChange={(e) => setFiltros((f) => ({ ...f, nome: e.target.value }))}
          />
          <Select
            value={filtros.municipio || '_all'}
            onValueChange={(v) => setFiltros((f) => ({ ...f, municipio: v === '_all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Município" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os municípios</SelectItem>
              {municipios.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filtros.status || '_all'}
            onValueChange={(v) => setFiltros((f) => ({ ...f, status: v === '_all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os status</SelectItem>
              {Object.entries(STATUS_GESTOR_CONFIG).map(([val, cfg]) => (
                <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => carregar(1)}>
              <Search className="h-4 w-4 mr-1" /> Buscar
            </Button>
            <Button variant="ghost" size="sm" onClick={limparFiltros}>
              <X className="h-4 w-4 mr-1" /> Limpar
            </Button>
          </div>
        </div>

        {/* Ações de exportação */}
        <div className="flex gap-2 items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {total} registro(s) encontrado(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={loading}>
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Município</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : gestores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              gestores.map((g) => {
                const statusCfg = STATUS_GESTOR_CONFIG[g.status as StatusGestor];
                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.nome}</TableCell>
                    <TableCell>{g.email}</TableCell>
                    <TableCell>{formatarCPF(g.cpf)}</TableCell>
                    <TableCell>{formatarCelular(g.celular)}</TableCell>
                    <TableCell>{g.escola?.municipio || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusCfg?.bgColor || ''} ${statusCfg?.color || ''}`}>
                        {statusCfg?.label || g.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(g.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => carregar(pagina - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => carregar(pagina + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
