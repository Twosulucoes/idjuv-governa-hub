import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  ArrowUpDown, 
  Database, 
  CircleDot,
  Download,
  Eye,
} from 'lucide-react';
import { TableInfo, CATEGORY_COLORS } from '@/hooks/useDatabaseSchema';

interface TableListTabProps {
  tables: TableInfo[];
  onTableClick: (tableName: string) => void;
}

type SortKey = 'name' | 'category' | 'columns' | 'rowCount';
type SortOrder = 'asc' | 'desc';

export function TableListTab({ tables, onTableClick }: TableListTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const categories = useMemo(() => {
    const cats = new Set(tables.map(t => t.category));
    return Array.from(cats).sort();
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables
      .filter(table => {
        // Filtro de busca
        if (search && !table.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        // Filtro de categoria
        if (categoryFilter !== 'all' && table.category !== categoryFilter) {
          return false;
        }
        // Filtro de status
        if (statusFilter === 'empty' && table.rowCount > 0) return false;
        if (statusFilter === 'with-data' && table.rowCount === 0) return false;
        
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortKey) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
          case 'columns':
            comparison = a.columns.length - b.columns.length;
            break;
          case 'rowCount':
            comparison = a.rowCount - b.rowCount;
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [tables, search, categoryFilter, statusFilter, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Categoria', 'Colunas', 'Registros', 'Status', 'Colunas FK'];
    const rows = filteredTables.map(t => [
      t.name,
      t.category,
      t.columns.length,
      t.rowCount,
      t.rowCount > 0 ? 'Com dados' : 'Vazia',
      t.columns.filter(c => c.isFK).map(c => c.name).join('; '),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tabelas-banco-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const SortButton = ({ column }: { column: SortKey }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2"
      onClick={() => handleSort(column)}
    >
      <ArrowUpDown className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tabela..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="with-data">Com dados</SelectItem>
            <SelectItem value="empty">Vazias</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredTables.length} de {tables.length} tabelas
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center">
                  Nome <SortButton column="name" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Categoria <SortButton column="category" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center">
                  Colunas <SortButton column="columns" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end">
                  Registros <SortButton column="rowCount" />
                </div>
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Referências (FK)</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTables.map((table) => {
              const fkColumns = table.columns.filter(c => c.isFK);
              const isEmpty = table.rowCount === 0;
              
              return (
                <TableRow 
                  key={table.name}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onTableClick(table.name)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Database 
                        className="h-4 w-4" 
                        style={{ color: CATEGORY_COLORS[table.category] }} 
                      />
                      <span className="font-mono text-sm">{table.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: CATEGORY_COLORS[table.category],
                        color: CATEGORY_COLORS[table.category],
                      }}
                    >
                      {table.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {table.columns.length}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {table.rowCount.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CircleDot 
                        className={`h-4 w-4 ${isEmpty ? 'text-amber-500' : 'text-emerald-500'}`}
                      />
                      <span className={`text-xs ${isEmpty ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {isEmpty ? 'Vazia' : 'Em uso'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {fkColumns.slice(0, 3).map(col => (
                        <Badge key={col.name} variant="secondary" className="text-xs">
                          {col.name.replace('_id', '')}
                        </Badge>
                      ))}
                      {fkColumns.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{fkColumns.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
