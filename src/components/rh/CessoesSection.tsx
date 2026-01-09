import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeftRight,
  Plus,
  Loader2,
  Clock,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCessoesServidor, useEncerrarCessao } from "@/hooks/useServidorCompleto";
import { CessaoForm } from "./CessaoForm";
import { RetornoCessaoForm } from "./RetornoCessaoForm";
import { type Cessao } from "@/types/servidor";

interface Props {
  servidorId: string;
  servidorNome: string;
}

export function CessoesSection({ servidorId, servidorNome }: Props) {
  const [showCessaoForm, setShowCessaoForm] = useState(false);
  const [showRetornoForm, setShowRetornoForm] = useState(false);
  const [selectedCessao, setSelectedCessao] = useState<Cessao | null>(null);

  const { data: cessoes = [], isLoading } = useCessoesServidor(servidorId);

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleRetorno = (cessao: Cessao) => {
    setSelectedCessao(cessao);
    setShowRetornoForm(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Cessões (Entrada e Saída)
          </CardTitle>
          <Button size="sm" onClick={() => setShowCessaoForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Registrar Cessão
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : cessoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma cessão registrada. Utilize esta seção para registrar servidores cedidos de outros órgãos (Entrada) 
              ou servidores do IDJuv cedidos para outros órgãos (Saída).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Função/Cargo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Ônus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cessoes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={c.tipo === 'entrada' 
                          ? 'bg-info/10 text-info border-info/30' 
                          : 'bg-warning/10 text-warning border-warning/30'
                        }
                      >
                        {c.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {c.tipo === 'entrada' ? c.orgao_origem : c.orgao_destino}
                    </TableCell>
                    <TableCell>
                      {c.tipo === 'entrada' 
                        ? c.funcao_exercida_idjuv || c.cargo_origem 
                        : c.cargo_destino
                      }
                    </TableCell>
                    <TableCell>{formatDate(c.data_inicio)}</TableCell>
                    <TableCell>{formatDate(c.data_fim || c.data_retorno)}</TableCell>
                    <TableCell>
                      {c.onus === 'origem' && 'Órgão Origem'}
                      {c.onus === 'destino' && 'Órgão Destino'}
                      {c.onus === 'compartilhado' && 'Compartilhado'}
                      {!c.onus && '-'}
                    </TableCell>
                    <TableCell>
                      {c.ativa ? (
                        <Badge className="bg-warning/20 text-warning border-warning/30">
                          <Clock className="h-3 w-3 mr-1" />
                          Em Andamento
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Encerrada</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.ativa && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRetorno(c)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Registrar Retorno
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CessaoForm
        servidorId={servidorId}
        servidorNome={servidorNome}
        open={showCessaoForm}
        onOpenChange={setShowCessaoForm}
      />

      {selectedCessao && (
        <RetornoCessaoForm
          cessao={selectedCessao}
          servidorNome={servidorNome}
          open={showRetornoForm}
          onOpenChange={(open) => {
            setShowRetornoForm(open);
            if (!open) setSelectedCessao(null);
          }}
        />
      )}
    </>
  );
}
