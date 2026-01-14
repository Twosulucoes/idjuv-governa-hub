import { useState, useMemo } from 'react';
import { Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServidorSelecionado {
  id: string;
  nome_completo: string;
  cpf: string;
  cargo_nome: string;
  cargo_sigla: string;
  foto_url?: string | null;
}

interface SelecionarServidoresTableProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxHeight?: string;
}

const ITEMS_PER_PAGE = 15;

export function SelecionarServidoresTable({
  selectedIds,
  onSelectionChange,
  maxHeight = '400px',
}: SelecionarServidoresTableProps) {
  const [busca, setBusca] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: servidores = [], isLoading } = useQuery({
    queryKey: ['servidores-selecao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_servidores_situacao')
        .select('id, nome_completo, cpf, foto_url, cargo_nome, cargo_sigla, situacao')
        .eq('situacao', 'ativo')
        .order('nome_completo');

      if (error) throw error;
      return data as ServidorSelecionado[];
    },
  });

  const servidoresFiltrados = useMemo(() => {
    if (!busca.trim()) return servidores;
    const termo = busca.toLowerCase();
    return servidores.filter(
      (s) =>
        s.nome_completo?.toLowerCase().includes(termo) ||
        s.cpf?.includes(termo) ||
        s.cargo_nome?.toLowerCase().includes(termo) ||
        s.cargo_sigla?.toLowerCase().includes(termo)
    );
  }, [servidores, busca]);

  // Reset page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [busca]);

  const totalPages = Math.ceil(servidoresFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const servidoresPaginados = servidoresFiltrados.slice(startIndex, endIndex);

  const allSelected = servidoresFiltrados.length > 0 && 
    servidoresFiltrados.every((s) => selectedIds.includes(s.id));

  const handleToggleAll = () => {
    if (allSelected) {
      const filtradosIds = new Set(servidoresFiltrados.map((s) => s.id));
      onSelectionChange(selectedIds.filter((id) => !filtradosIds.has(id)));
    } else {
      const novosIds = new Set([...selectedIds, ...servidoresFiltrados.map((s) => s.id)]);
      onSelectionChange(Array.from(novosIds));
    }
  };

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-3">
      {/* Busca e contador */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou cargo..."
            className="pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Badge variant="secondary" className="whitespace-nowrap">
          {selectedIds.length} selecionado(s)
        </Badge>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b font-medium text-sm">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleToggleAll}
            aria-label="Selecionar todos"
          />
          <span className="w-10" />
          <span className="flex-1 min-w-[180px]">Nome</span>
          <span className="w-[130px]">CPF</span>
          <span className="flex-1 min-w-[140px]">Cargo</span>
          <span className="w-[100px]">Código</span>
        </div>

        {/* Lista com ScrollArea */}
        <ScrollArea className="overflow-auto" style={{ maxHeight }}>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando servidores...
            </div>
          ) : servidoresPaginados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum servidor encontrado
            </div>
          ) : (
            <div className="divide-y">
              {servidoresPaginados.map((servidor) => {
                const isSelected = selectedIds.includes(servidor.id);
                return (
                  <div
                    key={servidor.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleToggle(servidor.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(servidor.id)}
                      aria-label={`Selecionar ${servidor.nome_completo}`}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={servidor.foto_url || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 min-w-[180px] font-medium truncate">
                      {servidor.nome_completo}
                    </span>
                    <span className="w-[130px] text-sm text-muted-foreground font-mono">
                      {formatCPF(servidor.cpf)}
                    </span>
                    <span className="flex-1 min-w-[140px] text-sm truncate">
                      {servidor.cargo_nome}
                    </span>
                    <span className="w-[100px]">
                      <Badge variant="outline" className="font-mono text-xs">
                        {servidor.cargo_sigla || '-'}
                      </Badge>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <span className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(endIndex, servidoresFiltrados.length)} de {servidoresFiltrados.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
