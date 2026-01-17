import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Database,
  Link2,
  Columns,
  ExternalLink,
} from 'lucide-react';
import { DiagnosticInfo, TableInfo, RelationshipInfo } from '@/hooks/useDatabaseSchema';

interface DiagnosticsTabProps {
  diagnostics: DiagnosticInfo[];
  tables: TableInfo[];
  relationships: RelationshipInfo[];
  onTableClick: (tableName: string) => void;
}

export function DiagnosticsTab({ 
  diagnostics, 
  tables, 
  relationships,
  onTableClick 
}: DiagnosticsTabProps) {
  // Análises adicionais
  const analysis = useMemo(() => {
    const emptyTables = tables.filter(t => t.rowCount === 0);
    const tablesWithData = tables.filter(t => t.rowCount > 0);
    const brokenRelationships = relationships.filter(r => !r.exists);
    const tablesWithManyColumns = tables.filter(t => t.columns.length > 30);
    const tablesWithFewRecords = tables.filter(t => t.rowCount > 0 && t.rowCount < 5);
    
    // Tabelas não referenciadas
    const referencedTables = new Set(relationships.map(r => r.targetTable));
    const sourceTables = new Set(relationships.map(r => r.sourceTable));
    const orphanTables = tables.filter(t => 
      !referencedTables.has(t.name) && 
      !sourceTables.has(t.name) &&
      !['audit_logs', 'backup_history', 'backup_config'].includes(t.name)
    );

    return {
      emptyTables,
      tablesWithData,
      brokenRelationships,
      tablesWithManyColumns,
      tablesWithFewRecords,
      orphanTables,
      healthScore: Math.round(
        ((tablesWithData.length / tables.length) * 40) +
        ((relationships.filter(r => r.exists).length / Math.max(relationships.length, 1)) * 30) +
        ((1 - brokenRelationships.length / Math.max(relationships.length, 1)) * 30)
      ),
    };
  }, [tables, relationships]);

  const getIconForType = (type: DiagnosticInfo['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getBadgeForType = (type: DiagnosticInfo['type']) => {
    switch (type) {
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Aviso</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Score de Saúde */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Score de Saúde do Banco
          </CardTitle>
          <CardDescription>
            Avaliação geral baseada em uso de tabelas, integridade de relacionamentos e estrutura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div 
              className={`text-5xl font-bold ${
                analysis.healthScore >= 70 ? 'text-emerald-500' :
                analysis.healthScore >= 40 ? 'text-amber-500' : 'text-red-500'
              }`}
            >
              {analysis.healthScore}%
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Tabelas em uso</div>
                <div className="text-lg font-semibold">
                  {analysis.tablesWithData.length} / {tables.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Relacionamentos válidos</div>
                <div className="text-lg font-semibold">
                  {relationships.filter(r => r.exists).length} / {relationships.length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={analysis.emptyTables.length > 20 ? 'border-amber-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-4 w-4" />
              Tabelas Vazias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.emptyTables.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round((analysis.emptyTables.length / tables.length) * 100)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className={analysis.brokenRelationships.length > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Relacionamentos Quebrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {analysis.brokenRelationships.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Referências a tabelas inexistentes
            </p>
          </CardContent>
        </Card>

        <Card className={analysis.tablesWithManyColumns.length > 0 ? 'border-blue-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Columns className="h-4 w-4" />
              Tabelas Grandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {analysis.tablesWithManyColumns.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Com mais de 30 colunas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Diagnósticos */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas e Recomendações</CardTitle>
          <CardDescription>
            {diagnostics.length} itens detectados na análise automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          {diagnostics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
              <p>Nenhum problema crítico detectado!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {diagnostics.map((diag, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {getIconForType(diag.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getBadgeForType(diag.type)}
                      {diag.table && (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-primary"
                          onClick={() => onTableClick(diag.table!)}
                        >
                          {diag.table}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{diag.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabelas Órfãs */}
      {analysis.orphanTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Tabelas Isoladas
            </CardTitle>
            <CardDescription>
              Tabelas sem relacionamentos detectados com outras tabelas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.orphanTables.map(table => (
                <Button
                  key={table.name}
                  variant="outline"
                  size="sm"
                  onClick={() => onTableClick(table.name)}
                >
                  {table.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações de Melhoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {analysis.brokenRelationships.length > 0 && (
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Crítico:</strong> Corrigir {analysis.brokenRelationships.length} relacionamentos 
                  que apontam para tabelas inexistentes.
                </span>
              </li>
            )}
            {analysis.emptyTables.length > 20 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Importante:</strong> Avaliar se as {analysis.emptyTables.length} tabelas 
                  vazias são necessárias ou podem ser removidas.
                </span>
              </li>
            )}
            {analysis.tablesWithManyColumns.length > 0 && (
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Sugestão:</strong> Considerar normalização das tabelas com muitas colunas: {' '}
                  {analysis.tablesWithManyColumns.map(t => t.name).join(', ')}.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Sugestão:</strong> Adicionar Foreign Keys explícitas para garantir 
                integridade referencial em todos os relacionamentos implícitos.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
