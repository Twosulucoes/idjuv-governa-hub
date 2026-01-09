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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Award,
  Plus,
  Loader2,
  MoreHorizontal,
  UserX,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProvimentosServidor } from "@/hooks/useServidorCompleto";
import { ProvimentoForm } from "./ProvimentoForm";
import { ExoneracaoForm } from "./ExoneracaoForm";
import {
  type TipoServidor,
  type Provimento,
  STATUS_PROVIMENTO_LABELS,
  STATUS_PROVIMENTO_COLORS,
  MOTIVOS_ENCERRAMENTO,
} from "@/types/servidor";

interface Props {
  servidorId: string;
  servidorNome: string;
  tipoServidor?: TipoServidor;
}

export function NomeacoesProvimentosSection({ servidorId, servidorNome, tipoServidor }: Props) {
  const [showProvimentoForm, setShowProvimentoForm] = useState(false);
  const [showExoneracaoForm, setShowExoneracaoForm] = useState(false);
  const [selectedProvimento, setSelectedProvimento] = useState<Provimento | null>(null);

  const { data: provimentos = [], isLoading } = useProvimentosServidor(servidorId);

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getMotivoLabel = (motivo: string | undefined) => {
    if (!motivo) return '-';
    const found = MOTIVOS_ENCERRAMENTO.find(m => m.value === motivo);
    return found?.label || motivo;
  };

  const handleExonerar = (provimento: Provimento) => {
    setSelectedProvimento(provimento);
    setShowExoneracaoForm(true);
  };

  // Verificar se já tem provimento ativo
  const provimentoAtivo = provimentos.find(p => p.status === 'ativo');
  const temProvimentoAtivo = !!provimentoAtivo;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Nomeações / Provimentos
            {temProvimentoAtivo && (
              <Badge variant="default" className="ml-2 bg-success text-success-foreground">
                Ativo
              </Badge>
            )}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    size="sm" 
                    onClick={() => setShowProvimentoForm(true)}
                    variant={temProvimentoAtivo ? "outline" : "default"}
                  >
                    {temProvimentoAtivo ? (
                      <AlertCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Nova Nomeação
                  </Button>
                </div>
              </TooltipTrigger>
              {temProvimentoAtivo && (
                <TooltipContent>
                  <p>Servidor já possui nomeação ativa</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : provimentos.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum provimento registrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Nomeação</TableHead>
                  <TableHead>Posse</TableHead>
                  <TableHead>Encerramento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provimentos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.cargo?.sigla && <span className="text-primary">{p.cargo.sigla} - </span>}
                      {p.cargo?.nome}
                    </TableCell>
                    <TableCell>{p.unidade?.sigla || p.unidade?.nome || '-'}</TableCell>
                    <TableCell>{formatDate(p.data_nomeacao)}</TableCell>
                    <TableCell>{formatDate(p.data_posse)}</TableCell>
                    <TableCell>
                      {p.data_encerramento ? (
                        <div className="text-sm">
                          <p>{formatDate(p.data_encerramento)}</p>
                          <p className="text-xs text-muted-foreground">{getMotivoLabel(p.motivo_encerramento)}</p>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_PROVIMENTO_COLORS[p.status]}>
                        {STATUS_PROVIMENTO_LABELS[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.status === 'ativo' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleExonerar(p)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Exonerar / Encerrar
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

      <ProvimentoForm
        servidorId={servidorId}
        servidorNome={servidorNome}
        tipoServidor={tipoServidor}
        open={showProvimentoForm}
        onOpenChange={setShowProvimentoForm}
        temProvimentoAtivo={temProvimentoAtivo}
      />

      {selectedProvimento && (
        <ExoneracaoForm
          provimento={selectedProvimento}
          servidorNome={servidorNome}
          open={showExoneracaoForm}
          onOpenChange={(open) => {
            setShowExoneracaoForm(open);
            if (!open) setSelectedProvimento(null);
          }}
        />
      )}
    </>
  );
}
