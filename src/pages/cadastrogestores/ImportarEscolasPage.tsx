/**
 * Página de Importação e Gestão de Escolas
 * /cadastrogestores/admin/escolas
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  Plus, 
  School, 
  ArrowLeft, 
  Trash2, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
import { useEscolasJer } from '@/hooks/useEscolasJer';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { EscolaImportData } from '@/types/gestoresEscolares';

export default function ImportarEscolasPage() {
  const [busca, setBusca] = useState('');
  const [dialogNova, setDialogNova] = useState(false);
  const [dialogImportar, setDialogImportar] = useState(false);
  const [escolaExcluir, setEscolaExcluir] = useState<string | null>(null);
  const [dadosImportacao, setDadosImportacao] = useState<EscolaImportData[]>([]);
  
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

  // Processar arquivo
  const handleArquivo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          const nome = row['nome'] || row['Nome'] || row['NOME'] || row['Escola'] || row['ESCOLA'] || '';
          const municipio = row['municipio'] || row['Município'] || row['MUNICIPIO'] || row['Cidade'] || '';
          const inep = row['inep'] || row['INEP'] || row['Código'] || row['codigo'] || '';
          
          return { nome: nome.trim(), municipio: municipio.trim() || undefined, inep: inep.toString().trim() || undefined };
        }).filter((d) => d.nome);

        setDadosImportacao(dados);
        setDialogImportar(true);
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        toast.error('Erro ao ler arquivo. Verifique o formato.');
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    e.target.value = '';
  }, []);

  // Confirmar importação
  const handleConfirmarImportacao = async () => {
    try {
      await importarEscolas.mutateAsync(dadosImportacao);
      setDialogImportar(false);
      setDadosImportacao([]);
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

  return (
    <AdminLayout 
      title="Gestão de Escolas" 
      description="Importar e gerenciar lista de escolas participantes dos Jogos Escolares"
    >
      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Link to="/cadastrogestores/admin">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar escola..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogNova(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Escola
          </Button>
          
          <label>
            <Button asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Importar
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
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{escolas.length}</p>
            <p className="text-xs text-muted-foreground">Total de Escolas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {escolas.filter((e) => e.ja_cadastrada).length}
            </p>
            <p className="text-xs text-muted-foreground">Com Gestor</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {escolas.filter((e) => !e.ja_cadastrada).length}
            </p>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : escolasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <School className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma escola cadastrada.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Importe uma planilha ou adicione manualmente.
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
                      <span className="text-muted-foreground text-sm">
                        {escola.inep || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {escola.ja_cadastrada ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
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
              Adicione uma escola à lista de participantes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Escola *</label>
              <Input
                value={nomeNova}
                onChange={(e) => setNomeNova(e.target.value)}
                placeholder="Ex: Escola Estadual XYZ"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Município</label>
              <Input
                value={municipioNova}
                onChange={(e) => setMunicipioNova(e.target.value)}
                placeholder="Ex: Boa Vista"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Código INEP</label>
              <Input
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
            <DialogDescription>
              {dadosImportacao.length} escolas serão importadas.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>INEP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosImportacao.slice(0, 20).map((escola, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{escola.nome}</TableCell>
                    <TableCell>{escola.municipio || '-'}</TableCell>
                    <TableCell>{escola.inep || '-'}</TableCell>
                  </TableRow>
                ))}
                {dadosImportacao.length > 20 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      ... e mais {dadosImportacao.length - 20} escolas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogImportar(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarImportacao} disabled={importarEscolas.isPending}>
              {importarEscolas.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Importar {dadosImportacao.length} Escolas
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
              Esta ação não pode ser desfeita. A escola será removida da lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
