import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Database, 
  Columns, 
  Link2, 
  CircleDot,
  Key,
  Hash,
} from 'lucide-react';
import { TableInfo, RelationshipInfo, CATEGORY_COLORS } from '@/hooks/useDatabaseSchema';

interface TableDetailDialogProps {
  table: TableInfo | null;
  relationships: RelationshipInfo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToTable: (tableName: string) => void;
}

export function TableDetailDialog({
  table,
  relationships,
  open,
  onOpenChange,
  onNavigateToTable,
}: TableDetailDialogProps) {
  if (!table) return null;

  const outgoingRels = relationships.filter(r => r.sourceTable === table.name);
  const incomingRels = relationships.filter(r => r.targetTable === table.name);
  const isEmpty = table.rowCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database 
              className="h-5 w-5" 
              style={{ color: CATEGORY_COLORS[table.category] }} 
            />
            {table.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <Badge 
              variant="outline"
              style={{ 
                borderColor: CATEGORY_COLORS[table.category],
                color: CATEGORY_COLORS[table.category],
              }}
            >
              {table.category}
            </Badge>
            <span className="flex items-center gap-1">
              <Columns className="h-4 w-4" />
              {table.columns.length} colunas
            </span>
            <span className="flex items-center gap-1">
              <CircleDot className={`h-4 w-4 ${isEmpty ? 'text-amber-500' : 'text-emerald-500'}`} />
              {table.rowCount.toLocaleString('pt-BR')} registros
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="columns" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="columns">
              Colunas ({table.columns.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              Referencia ({outgoingRels.length})
            </TabsTrigger>
            <TabsTrigger value="incoming">
              Referenciada por ({incomingRels.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="columns" className="mt-0">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Nullable</TableHead>
                      <TableHead>Referência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.columns.map((col) => (
                      <TableRow key={col.name}>
                        <TableCell>
                          {col.name === 'id' ? (
                            <Key className="h-4 w-4 text-amber-500" />
                          ) : col.isFK ? (
                            <Link2 className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Hash className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{col.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {col.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {col.nullable ? (
                            <span className="text-muted-foreground text-xs">NULL</span>
                          ) : (
                            <span className="text-emerald-500 text-xs">NOT NULL</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {col.referencedTable && (
                            <button
                              className="text-primary hover:underline text-sm"
                              onClick={() => onNavigateToTable(col.referencedTable!)}
                            >
                              → {col.referencedTable}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="outgoing" className="mt-0">
              {outgoingRels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Esta tabela não referencia outras tabelas.
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coluna</TableHead>
                        <TableHead>Tabela Destino</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outgoingRels.map((rel, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <span className="font-mono text-sm">{rel.sourceColumn}</span>
                          </TableCell>
                          <TableCell>
                            <button
                              className={`font-mono text-sm hover:underline ${
                                rel.exists ? 'text-primary' : 'text-destructive'
                              }`}
                              onClick={() => rel.exists && onNavigateToTable(rel.targetTable)}
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
                            <Badge variant={rel.exists ? 'outline' : 'destructive'}>
                              {rel.exists ? 'Válido' : 'Quebrado'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="incoming" className="mt-0">
              {incomingRels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma tabela referencia esta tabela.
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tabela Origem</TableHead>
                        <TableHead>Coluna</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomingRels.map((rel, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <button
                              className="font-mono text-sm text-primary hover:underline"
                              onClick={() => onNavigateToTable(rel.sourceTable)}
                            >
                              {rel.sourceTable}
                            </button>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{rel.sourceColumn}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={rel.type === 'explicit' ? 'default' : 'secondary'}>
                              {rel.type === 'explicit' ? 'FK' : 'Implícito'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
