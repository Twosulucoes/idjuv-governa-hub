/**
 * Página de Importação e Gestão de Escolas
 * /cadastrogestores/escolas
 */

import { useState, useCallback } from 'react';
import { 
  Upload, 
  Plus, 
  School, 
  Trash2, 
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  Search,
  Download,
  AlertTriangle,
  X
} from 'lucide-react';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useEscolasJer } from '@/hooks/useEscolasJer';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { EscolaImportData } from '@/types/gestoresEscolares';

interface ImportValidation {
  validas: EscolaImportData[];
  duplicadas: EscolaImportData[];
  invalidas: { dado: EscolaImportData; erro: string }[];
}

export default function ImportarEscolasPage() {
  const [busca, setBusca] = useState('');
  const [dialogNova, setDialogNova] = useState(false);
  const [dialogImportar, setDialogImportar] = useState(false);
  const [escolaExcluir, setEscolaExcluir] = useState<string | null>(null);
  const [dadosImportacao, setDadosImportacao] = useState<ImportValidation | null>(null);
  const [arquivoNome, setArquivoNome] = useState('');
  
  // Form nova escola
  const [nomeNova, setNomeNova] = useState('');
  const [municipioNova, setMunicipioNova] = useState('');
  const [inepNova, setInepNova] = useState('');

  const { 
    escolas, 
    isLoading, 
    criarEscola, 
    importarEscolas, 
    deletarEscola 
  } = useEscolasJer();

  // Filtrar escolas
  const escolasFiltradas = escolas.filter((e) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      e.nome.toLowerCase().includes(termo) ||
      e.municipio?.toLowerCase().includes(termo) ||
      e.inep?.includes(termo)
    );
  });

  // Validar dados importados
  const validarImportacao = useCallback((dados: EscolaImportData[]): ImportValidation => {
    const inepsExistentes = new Set(escolas.map(e => e.inep).filter(Boolean));
    const nomesExistentes = new Set(escolas.map(e => e.nome.toLowerCase()));
    const inepsNoArquivo = new Set<string>();
    
    const validas: EscolaImportData[] = [];
    const duplicadas: EscolaImportData[] = [];
    const invalidas: { dado: EscolaImportData; erro: string }[] = [];

    dados.forEach((dado) => {
      // Validar nome
      if (!dado.nome || dado.nome.trim().length < 3) {
        invalidas.push({ dado, erro: 'Nome inválido (mínimo 3 caracteres)' });
        return;
      }

      // Verificar duplicata por nome no banco
      if (nomesExistentes.has(dado.nome.toLowerCase())) {
        duplicadas.push(dado);
        return;
      }

      // Verificar duplicata por INEP no banco
      if (dado.inep && inepsExistentes.has(dado.inep)) {
        duplicadas.push(dado);
        return;
      }

      // Verificar duplicata por INEP no próprio arquivo
      if (dado.inep && inepsNoArquivo.has(dado.inep)) {
        invalidas.push({ dado, erro: 'INEP duplicado no arquivo' });
        return;
      }

      if (dado.inep) {
        inepsNoArquivo.add(dado.inep);
      }

      validas.push(dado);
    });

    return { validas, duplicadas, invalidas };
  }, [escolas]);

  // Processar arquivo
  const handleArquivo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivoNome(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        // Mapear colunas (flexível)
        const dados: EscolaImportData[] = json.map((row) => {
          const nome = row['nome'] || row['Nome'] || row['NOME'] || row['Escola'] || row['ESCOLA'] || 
                       row['nome_escola'] || row['Nome da Escola'] || '';
          const municipio = row['municipio'] || row['Município'] || row['MUNICIPIO'] || 
                           row['Cidade'] || row['cidade'] || '';
          const inep = row['inep'] || row['INEP'] || row['Código'] || row['codigo'] || 
                       row['Código INEP'] || row['codigo_inep'] || '';
          
          return { 
            nome: nome.trim(), 
            municipio: municipio.trim() || undefined, 
            inep: inep.toString().trim() || undefined 
          };
        }).filter((d) => d.nome);

        if (dados.length === 0) {
          toast.error('Nenhuma escola encontrada no arquivo. Verifique se há uma coluna "Nome" ou "Escola".');
          return;
        }

        const validacao = validarImportacao(dados);
        setDadosImportacao(validacao);
        setDialogImportar(true);
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        toast.error('Erro ao ler arquivo. Verifique o formato (XLSX, XLS ou CSV).');
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    e.target.value = '';
  }, [validarImportacao]);

  // Confirmar importação
  const handleConfirmarImportacao = async () => {
    if (!dadosImportacao || dadosImportacao.validas.length === 0) {
      toast.error('Nenhuma escola válida para importar.');
      return;
    }

    try {
      await importarEscolas.mutateAsync(dadosImportacao.validas);
      setDialogImportar(false);
      setDadosImportacao(null);
      setArquivoNome('');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  // Criar escola manual
  const handleCriarEscola = async () => {
    if (!nomeNova.trim()) {
      toast.error('Nome da escola é obrigatório.');
      return;
    }

    if (nomeNova.trim().length < 3) {
      toast.error('Nome deve ter pelo menos 3 caracteres.');
      return;
    }

    try {
      await criarEscola.mutateAsync({
        nome: nomeNova.trim(),
        municipio: municipioNova.trim() || undefined,
        inep: inepNova.trim() || undefined,
      });
      setDialogNova(false);
      setNomeNova('');
      setMunicipioNova('');
      setInepNova('');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  // Excluir escola
  const handleExcluir = async () => {
    if (!escolaExcluir) return;
    await deletarEscola.mutateAsync(escolaExcluir);
    setEscolaExcluir(null);
  };

  // Baixar modelo
  const handleBaixarModelo = () => {
    const modelo = [
      { nome: 'Escola Estadual Exemplo', municipio: 'Boa Vista', inep: '14000001' },
      { nome: 'Escola Municipal Modelo', municipio: 'Pacaraima', inep: '14000002' },
    ];
    
    const ws = XLSX.utils.json_to_sheet(modelo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Escolas');
    XLSX.writeFile(wb, 'modelo_escolas_jer.xlsx');
    
    toast.success('Modelo baixado com sucesso!');
  };

  // Calcular progresso
  const totalEscolas = escolas.length;
  const escolasComGestor = escolas.filter(e => e.ja_cadastrada).length;
  const percentualCobertura = totalEscolas > 0 ? Math.round((escolasComGestor / totalEscolas) * 100) : 0;

  return (
    <ModuleLayout module="gestores_escolares">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <School className="h-6 w-6 text-amber-500" />
            Gestão de Escolas
          </h1>
          <p className="text-muted-foreground">
            Importar e gerenciar escolas participantes dos Jogos Escolares
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{totalEscolas}</p>
                  <p className="text-xs text-muted-foreground">Total de Escolas</p>
                </div>
                <School className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{escolasComGestor}</p>
                  <p className="text-xs text-muted-foreground">Com Gestor</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-amber-600">{totalEscolas - escolasComGestor}</p>
                  <p className="text-xs text-muted-foreground">Sem Gestor</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{percentualCobertura}%</p>
                  <p className="text-xs text-muted-foreground">Cobertura</p>
                </div>
                <Progress value={percentualCobertura} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área de Importação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Escolas
            </CardTitle>
            <CardDescription>
              Carregue uma planilha com a lista de escolas (XLSX, XLS ou CSV)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Arraste um arquivo ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Colunas aceitas: nome, municipio, inep
                </p>
                <label>
                  <Button variant="outline" asChild className="cursor-pointer">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleArquivo}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Instruções</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• A planilha deve ter uma coluna "Nome" ou "Escola"</li>
                    <li>• Colunas opcionais: "Município", "INEP"</li>
                    <li>• Escolas duplicadas serão ignoradas</li>
                    <li>• Linhas sem nome serão descartadas</li>
                  </ul>
                </div>
                <Button variant="outline" onClick={handleBaixarModelo}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações e Busca */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar escola por nome, município ou INEP..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setDialogNova(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Escola
          </Button>
        </div>

        {/* Tabela de Escolas */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : escolasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <School className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {busca ? 'Nenhuma escola encontrada.' : 'Nenhuma escola cadastrada.'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {!busca && 'Importe uma planilha ou adicione manualmente.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escola</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>INEP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escolasFiltradas.map((escola) => (
                    <TableRow key={escola.id}>
                      <TableCell>
                        <p className="font-medium">{escola.nome}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {escola.municipio || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm font-mono">
                          {escola.inep || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {escola.ja_cadastrada ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Com gestor
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Disponível
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEscolaExcluir(escola.id)}
                          disabled={escola.ja_cadastrada}
                          title={escola.ja_cadastrada ? 'Não é possível excluir escola com gestor' : 'Excluir escola'}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog: Nova Escola */}
        <Dialog open={dialogNova} onOpenChange={setDialogNova}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Escola</DialogTitle>
              <DialogDescription>
                Adicione uma escola manualmente à lista de participantes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Escola *</Label>
                <Input
                  id="nome"
                  value={nomeNova}
                  onChange={(e) => setNomeNova(e.target.value)}
                  placeholder="Ex: Escola Estadual XYZ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  value={municipioNova}
                  onChange={(e) => setMunicipioNova(e.target.value)}
                  placeholder="Ex: Boa Vista"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inep">Código INEP</Label>
                <Input
                  id="inep"
                  value={inepNova}
                  onChange={(e) => setInepNova(e.target.value)}
                  placeholder="Ex: 14000001"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogNova(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarEscola} disabled={criarEscola.isPending}>
                {criarEscola.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Confirmar Importação */}
        <Dialog open={dialogImportar} onOpenChange={setDialogImportar}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Confirmar Importação
              </DialogTitle>
              <DialogDescription>
                Arquivo: {arquivoNome}
              </DialogDescription>
            </DialogHeader>

            {dadosImportacao && (
              <div className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="pt-3 pb-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{dadosImportacao.validas.length}</p>
                      <p className="text-xs text-green-700 dark:text-green-400">Válidas</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-3 pb-3 text-center">
                      <p className="text-2xl font-bold text-amber-600">{dadosImportacao.duplicadas.length}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Duplicadas</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="pt-3 pb-3 text-center">
                      <p className="text-2xl font-bold text-red-600">{dadosImportacao.invalidas.length}</p>
                      <p className="text-xs text-red-700 dark:text-red-400">Inválidas</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Escolas válidas */}
                {dadosImportacao.validas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Escolas a serem importadas ({dadosImportacao.validas.length})
                    </h4>
                    <div className="max-h-[150px] overflow-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Município</TableHead>
                            <TableHead>INEP</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dadosImportacao.validas.slice(0, 10).map((escola, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-2">{escola.nome}</TableCell>
                              <TableCell className="py-2">{escola.municipio || '-'}</TableCell>
                              <TableCell className="py-2 font-mono">{escola.inep || '-'}</TableCell>
                            </TableRow>
                          ))}
                          {dadosImportacao.validas.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-2">
                                ... e mais {dadosImportacao.validas.length - 10} escolas
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Duplicadas */}
                {dadosImportacao.duplicadas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Escolas já existentes - serão ignoradas ({dadosImportacao.duplicadas.length})
                    </h4>
                    <div className="max-h-[100px] overflow-auto border border-amber-200 dark:border-amber-800 rounded-md bg-amber-50/50 dark:bg-amber-900/10">
                      <Table>
                        <TableBody>
                          {dadosImportacao.duplicadas.slice(0, 5).map((escola, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-1.5 text-sm">{escola.nome}</TableCell>
                              <TableCell className="py-1.5 text-sm">{escola.municipio || '-'}</TableCell>
                            </TableRow>
                          ))}
                          {dadosImportacao.duplicadas.length > 5 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground py-1.5 text-sm">
                                ... e mais {dadosImportacao.duplicadas.length - 5}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Inválidas */}
                {dadosImportacao.invalidas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Linhas com erros ({dadosImportacao.invalidas.length})
                    </h4>
                    <div className="max-h-[100px] overflow-auto border border-red-200 dark:border-red-800 rounded-md bg-red-50/50 dark:bg-red-900/10">
                      <Table>
                        <TableBody>
                          {dadosImportacao.invalidas.slice(0, 5).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-1.5 text-sm">{item.dado.nome || '(sem nome)'}</TableCell>
                              <TableCell className="py-1.5 text-sm text-red-600">{item.erro}</TableCell>
                            </TableRow>
                          ))}
                          {dadosImportacao.invalidas.length > 5 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground py-1.5 text-sm">
                                ... e mais {dadosImportacao.invalidas.length - 5}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogImportar(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmarImportacao} 
                disabled={importarEscolas.isPending || !dadosImportacao?.validas.length}
              >
                {importarEscolas.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Importar {dadosImportacao?.validas.length || 0} Escolas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert: Confirmar Exclusão */}
        <AlertDialog open={!!escolaExcluir} onOpenChange={() => setEscolaExcluir(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Escola?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A escola será removida permanentemente da lista.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ModuleLayout>
  );
}
