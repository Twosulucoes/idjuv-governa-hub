import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Link2,
  Award,
  Building2,
  ArrowLeftRight,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useVinculosServidor,
  useProvimentosServidor,
  useLotacoesServidor,
  useCessoesServidor,
} from "@/hooks/useServidorCompleto";
import { VinculoFuncionalForm } from "./VinculoFuncionalForm";
import { ProvimentoForm } from "./ProvimentoForm";
import { LotacaoForm } from "./LotacaoForm";
import { CessaoForm } from "./CessaoForm";
import {
  type TipoServidor,
  TIPO_VINCULO_LABELS,
  STATUS_PROVIMENTO_LABELS,
  STATUS_PROVIMENTO_COLORS,
  TIPO_LOTACAO_LABELS,
} from "@/types/servidor";

interface Props {
  servidorId: string;
  servidorNome: string;
  tipoServidor?: TipoServidor;
}

export function SituacaoFuncionalTab({ servidorId, servidorNome, tipoServidor }: Props) {
  // States para modais
  const [showVinculoForm, setShowVinculoForm] = useState(false);
  const [showProvimentoForm, setShowProvimentoForm] = useState(false);
  const [showLotacaoForm, setShowLotacaoForm] = useState(false);
  const [showCessaoForm, setShowCessaoForm] = useState(false);

  // Dados
  const { data: vinculos = [], isLoading: loadingVinculos } = useVinculosServidor(servidorId);
  const { data: provimentos = [], isLoading: loadingProvimentos } = useProvimentosServidor(servidorId);
  const { data: lotacoes = [], isLoading: loadingLotacoes } = useLotacoesServidor(servidorId);
  const { data: cessoes = [], isLoading: loadingCessoes } = useCessoesServidor(servidorId);

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const vinculoAtivo = vinculos.find(v => v.ativo);
  const provimentoAtivo = provimentos.find(p => p.status === 'ativo');
  const lotacaoAtiva = lotacoes.find(l => l.ativo);
  const cessaoAtiva = cessoes.find(c => c.ativa);

  return (
    <div className="space-y-6">
      {/* Resumo da Situação Atual */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Situação Funcional Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vínculo */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link2 className="h-4 w-4" />
                Vínculo
              </div>
              {vinculoAtivo ? (
                <>
                  <p className="font-medium">{TIPO_VINCULO_LABELS[vinculoAtivo.tipo_vinculo]}</p>
                  <p className="text-sm text-muted-foreground">Desde {formatDate(vinculoAtivo.data_inicio)}</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Não definido</p>
              )}
            </div>

            {/* Provimento */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Award className="h-4 w-4" />
                Nomeação/Provimento
              </div>
              {provimentoAtivo ? (
                <>
                  <p className="font-medium">{provimentoAtivo.cargo?.nome}</p>
                  <p className="text-sm text-muted-foreground">Desde {formatDate(provimentoAtivo.data_nomeacao)}</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Sem provimento ativo</p>
              )}
            </div>

            {/* Lotação */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                Lotação
              </div>
              {lotacaoAtiva ? (
                <>
                  <p className="font-medium">{lotacaoAtiva.unidade?.sigla || lotacaoAtiva.unidade?.nome}</p>
                  <p className="text-sm text-muted-foreground">Desde {formatDate(lotacaoAtiva.data_inicio)}</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Sem lotação ativa</p>
              )}
            </div>

            {/* Cessão */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ArrowLeftRight className="h-4 w-4" />
                Cessão
              </div>
              {cessaoAtiva ? (
                <>
                  <p className="font-medium">
                    {cessaoAtiva.tipo === 'entrada' 
                      ? `De: ${cessaoAtiva.orgao_origem}` 
                      : `Para: ${cessaoAtiva.orgao_destino}`}
                  </p>
                  <p className="text-sm text-muted-foreground">Desde {formatDate(cessaoAtiva.data_inicio)}</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Sem cessão ativa</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vínculos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Vínculos Funcionais
          </CardTitle>
          <Button size="sm" onClick={() => setShowVinculoForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Vínculo
          </Button>
        </CardHeader>
        <CardContent>
          {loadingVinculos ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : vinculos.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum vínculo registrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Órgão Origem/Destino</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vinculos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{TIPO_VINCULO_LABELS[v.tipo_vinculo]}</TableCell>
                    <TableCell>{formatDate(v.data_inicio)}</TableCell>
                    <TableCell>{formatDate(v.data_fim)}</TableCell>
                    <TableCell>{v.orgao_origem || v.orgao_destino || '-'}</TableCell>
                    <TableCell>
                      {v.ativo ? (
                        <Badge className="bg-success/20 text-success border-success/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Encerrado
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Provimentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Nomeações / Provimentos
          </CardTitle>
          <Button size="sm" onClick={() => setShowProvimentoForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Nomeação
          </Button>
        </CardHeader>
        <CardContent>
          {loadingProvimentos ? (
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
                  <TableHead>Status</TableHead>
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
                      <Badge className={STATUS_PROVIMENTO_COLORS[p.status]}>
                        {STATUS_PROVIMENTO_LABELS[p.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lotações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Histórico de Lotações
          </CardTitle>
          <Button size="sm" onClick={() => setShowLotacaoForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Lotação
          </Button>
        </CardHeader>
        <CardContent>
          {loadingLotacoes ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : lotacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma lotação registrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotacoes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">
                      {l.unidade?.sigla && <span className="text-primary">{l.unidade.sigla} - </span>}
                      {l.unidade?.nome}
                    </TableCell>
                    <TableCell>{TIPO_LOTACAO_LABELS[l.tipo_lotacao]}</TableCell>
                    <TableCell>{formatDate(l.data_inicio)}</TableCell>
                    <TableCell>{formatDate(l.data_fim)}</TableCell>
                    <TableCell>
                      {l.ativo ? (
                        <Badge className="bg-success/20 text-success border-success/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Encerrada</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cessões */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Cessões
          </CardTitle>
          <Button size="sm" onClick={() => setShowCessaoForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Registrar Cessão
          </Button>
        </CardHeader>
        <CardContent>
          {loadingCessoes ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : cessoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma cessão registrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Ônus</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cessoes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {c.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {c.tipo === 'entrada' ? c.orgao_origem : c.orgao_destino}
                    </TableCell>
                    <TableCell>{formatDate(c.data_inicio)}</TableCell>
                    <TableCell>{formatDate(c.data_fim)}</TableCell>
                    <TableCell>{c.onus || '-'}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <VinculoFuncionalForm
        servidorId={servidorId}
        servidorNome={servidorNome}
        open={showVinculoForm}
        onOpenChange={setShowVinculoForm}
      />
      
      <ProvimentoForm
        servidorId={servidorId}
        servidorNome={servidorNome}
        tipoServidor={tipoServidor}
        open={showProvimentoForm}
        onOpenChange={setShowProvimentoForm}
      />
      
      <LotacaoForm
        servidorId={servidorId}
        servidorNome={servidorNome}
        tipoServidor={tipoServidor}
        open={showLotacaoForm}
        onOpenChange={setShowLotacaoForm}
      />
      
      <CessaoForm
        servidorId={servidorId}
        servidorNome={servidorNome}
        open={showCessaoForm}
        onOpenChange={setShowCessaoForm}
      />
    </div>
  );
}
