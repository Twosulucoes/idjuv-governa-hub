/**
 * Nomeações sem portaria publicada (RH)
 *
 * Servidores com provimento ativo cuja portaria de nomeação ainda não saiu no DOE
 * (RPC rh_pendencias_nomeacao). O ato é feito no SEI; aqui só se acompanha.
 */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { NUMERO_PORTARIA_PENDENTE, useNomeacoesSemPortaria } from '@/hooks/usePortarias';
import { STATUS_PORTARIA_COLORS, STATUS_PORTARIA_LABELS } from '@/types/portaria';

export function NomeacoesSemPortariaCard() {
  const { data: nomeacoes = [], isLoading, error } = useNomeacoesSemPortaria();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Nomeações sem portaria publicada
        </CardTitle>
        <CardDescription>
          Servidores nomeados cuja portaria ainda não saiu no DOE. Registre o ato do SEI na Central de Portarias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-destructive">
            Não foi possível carregar as nomeações pendentes.
          </p>
        ) : nomeacoes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma nomeação aguardando portaria.
          </p>
        ) : (
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Nomeação</TableHead>
                  <TableHead>Portaria</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nomeacoes.map((n) => {
                  const semNumero = !n.portaria_numero || NUMERO_PORTARIA_PENDENTE.test(n.portaria_numero);
                  return (
                    <TableRow key={n.provimento_id}>
                      <TableCell>
                        <p className="font-medium">{n.nome}</p>
                        {n.matricula && (
                          <p className="text-xs text-muted-foreground">Mat. {n.matricula}</p>
                        )}
                      </TableCell>
                      <TableCell>{n.cargo || '-'}</TableCell>
                      <TableCell>
                        {n.data_nomeacao
                          ? format(new Date(`${n.data_nomeacao}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell className={cn(semNumero && 'text-muted-foreground')}>
                        {semNumero ? 'sem número' : n.portaria_numero}
                      </TableCell>
                      <TableCell>
                        {n.portaria_status ? (
                          <Badge className={STATUS_PORTARIA_COLORS[n.portaria_status]}>
                            {STATUS_PORTARIA_LABELS[n.portaria_status] || n.portaria_status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sem portaria</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
