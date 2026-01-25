// ============================================
// COMPONENTE MATRIZ DE PERMISSÕES
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { usePerfis } from '@/hooks/usePerfis';
import { useFuncoesSistema } from '@/hooks/useFuncoesSistema';
import { usePerfilFuncoes } from '@/hooks/usePerfilFuncoes';
import type { Perfil, FuncaoArvore } from '@/types/perfis';
import { MODULO_LABELS, TIPO_ACAO_LABELS } from '@/types/perfis';
import { Grid3X3, Lock } from 'lucide-react';

interface MatrizPermissoesProps {
  readOnly?: boolean;
}

export function MatrizPermissoes({ readOnly = false }: MatrizPermissoesProps) {
  const { perfis, loading: loadingPerfis } = usePerfis();
  const { funcoes, agruparPorModulo, loading: loadingFuncoes } = useFuncoesSistema();
  const { 
    permissoes, 
    loading: loadingPermissoes, 
    saving,
    fetchTodasPermissoes,
    verificarPermissao,
    alternarPermissao
  } = usePerfilFuncoes();

  const [perfisVisiveis, setPerfisVisiveis] = useState<Perfil[]>([]);

  useEffect(() => {
    fetchTodasPermissoes();
  }, []);

  useEffect(() => {
    // Mostrar apenas perfis ativos, ordenados por hierarquia
    setPerfisVisiveis(
      perfis
        .filter(p => p.ativo)
        .sort((a, b) => b.nivel_hierarquia - a.nivel_hierarquia)
        .slice(0, 8) // Limitar para caber na tela
    );
  }, [perfis]);

  const loading = loadingPerfis || loadingFuncoes || loadingPermissoes;
  const gruposPorModulo = agruparPorModulo();

  const renderFuncoesRecursivo = (funcaoArvore: FuncaoArvore, depth: number = 0): React.ReactNode[] => {
    const rows: React.ReactNode[] = [];

    rows.push(
      <TableRow key={funcaoArvore.id}>
        <TableCell 
          className="font-medium whitespace-nowrap"
          style={{ paddingLeft: 16 + depth * 16 }}
        >
          <div className="flex items-center gap-2">
            <span className={depth === 0 ? 'font-semibold' : ''}>
              {funcaoArvore.nome}
            </span>
            {funcaoArvore.tipo_acao && (
              <Badge variant="outline" className="text-[10px]">
                {TIPO_ACAO_LABELS[funcaoArvore.tipo_acao]}
              </Badge>
            )}
          </div>
        </TableCell>
        {perfisVisiveis.map(perfil => {
          const tem = verificarPermissao(perfil.id, funcaoArvore.id);
          const isSistema = perfil.is_sistema && perfil.nivel_hierarquia >= 90;

          return (
            <TableCell key={`${perfil.id}-${funcaoArvore.id}`} className="text-center p-2">
              <div className="flex justify-center">
                {isSistema && perfil.nivel_hierarquia === 100 ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Checkbox
                    checked={tem}
                    onCheckedChange={() => !readOnly && alternarPermissao(perfil.id, funcaoArvore.id)}
                    disabled={readOnly || saving}
                    className="mx-auto"
                  />
                )}
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    );

    // Renderizar filhos
    funcaoArvore.filhos.forEach(filho => {
      rows.push(...renderFuncoesRecursivo(filho, depth + 1));
    });

    return rows;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Matriz de Permissões</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              Clique nas células para conceder ou revogar permissões. 
              <Lock className="h-3 w-3 inline ml-1" /> indica permissão do sistema (não editável).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={Object.keys(gruposPorModulo)} className="w-full">
              {Object.entries(gruposPorModulo).map(([modulo, funcoesModulo]) => (
                <AccordionItem key={modulo} value={modulo}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{MODULO_LABELS[modulo] || modulo}</span>
                      <Badge variant="secondary">
                        {funcoesModulo.length} funções
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="w-full">
                      <div className="min-w-max">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px] sticky left-0 bg-background z-10">
                                Função
                              </TableHead>
                              {perfisVisiveis.map(perfil => (
                                <TableHead 
                                  key={perfil.id} 
                                  className="text-center min-w-[100px] px-2"
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: perfil.cor || '#6b7280' }}
                                    />
                                    <span className="text-xs whitespace-nowrap">
                                      {perfil.nome.length > 12 
                                        ? perfil.nome.substring(0, 12) + '...' 
                                        : perfil.nome
                                      }
                                    </span>
                                  </div>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {funcoesModulo.map(funcao => renderFuncoesRecursivo(funcao))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MatrizPermissoes;
