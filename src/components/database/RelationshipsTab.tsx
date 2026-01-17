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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { RelationshipInfo } from '@/hooks/useDatabaseSchema';

interface RelationshipsTabProps {
  relationships: RelationshipInfo[];
  onTableClick: (tableName: string) => void;
}

export function RelationshipsTab({ relationships, onTableClick }: RelationshipsTabProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const stats = useMemo(() => ({
    total: relationships.length,
    implicit: relationships.filter(r => r.type === 'implicit').length,
    explicit: relationships.filter(r => r.type === 'explicit').length,
    broken: relationships.filter(r => !r.exists).length,
    valid: relationships.filter(r => r.exists).length,
  }), [relationships]);

  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
      // Filtro de busca
      const searchLower = search.toLowerCase();
      if (search && 
          !rel.sourceTable.toLowerCase().includes(searchLower) &&
          !rel.targetTable.toLowerCase().includes(searchLower) &&
          !rel.sourceColumn.toLowerCase().includes(searchLower)) {
        return false;
      }
      
      // Filtro de tipo
      if (typeFilter !== 'all' && rel.type !== typeFilter) {
        return false;
      }
      
      // Filtro de status
      if (statusFilter === 'valid' && !rel.exists) return false;
      if (statusFilter === 'broken' && rel.exists) return false;
      
      return true;
    });
  }, [relationships, search, typeFilter, statusFilter]);

  // Agrupar por tabela origem
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, RelationshipInfo[]> = {};
    
    filteredRelationships.forEach(rel => {
      if (!groups[rel.sourceTable]) {
        groups[rel.sourceTable] = [];
      }
      groups[rel.sourceTable].push(rel);
    });
    
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredRelationships]);

  return (
    <div className="space-y-4">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-blue-500">{stats.implicit}</div>
          <div className="text-xs text-muted-foreground">Implícitos</div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-purple-500">{stats.explicit}</div>
          <div className="text-xs text-muted-foreground">Explícitos (FK)</div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-emerald-500">{stats.valid}</div>
          <div className="text-xs text-muted-foreground">Válidos</div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-red-500">{stats.broken}</div>
          <div className="text-xs text-muted-foreground">Quebrados</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tabela ou coluna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="implicit">Implícitos</SelectItem>
            <SelectItem value="explicit">Explícitos (FK)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="valid">Válidos</SelectItem>
            <SelectItem value="broken">Quebrados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Aviso sobre integridade */}
      {stats.broken > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <strong>{stats.broken} relacionamentos</strong> apontam para tabelas inexistentes. 
            Isso pode indicar erros de nomenclatura ou tabelas que precisam ser criadas.
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tabela Origem</TableHead>
              <TableHead>Coluna</TableHead>
              <TableHead className="text-center w-[60px]"></TableHead>
              <TableHead>Tabela Destino</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRelationships.map((rel, index) => (
              <TableRow key={`${rel.sourceTable}-${rel.sourceColumn}-${index}`}>
                <TableCell>
                  <button
                    className="font-mono text-sm text-primary hover:underline"
                    onClick={() => onTableClick(rel.sourceTable)}
                  >
                    {rel.sourceTable}
                  </button>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-muted-foreground">
                    {rel.sourceColumn}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <button
                    className={`font-mono text-sm hover:underline ${
                      rel.exists ? 'text-primary' : 'text-destructive'
                    }`}
                    onClick={() => rel.exists && onTableClick(rel.targetTable)}
                    disabled={!rel.exists}
                  >
                    {rel.targetTable}
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={rel.type === 'explicit' ? 'default' : 'secondary'}>
                    {rel.type === 'explicit' ? 'FK' : 'Implícito'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {rel.exists ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredRelationships.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum relacionamento encontrado com os filtros atuais.
        </div>
      )}
    </div>
  );
}
