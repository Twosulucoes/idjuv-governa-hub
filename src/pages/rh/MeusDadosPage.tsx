/**
 * Meus Dados — autoatendimento do servidor (somente leitura).
 *
 * Mostra o cadastro vinculado ao usuário logado: dados pessoais, contato,
 * endereço, dados funcionais, dados bancários, vínculos e histórico de lotação.
 * Correções são feitas pelo RH (não há edição aqui).
 */

import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  Landmark,
  Link2,
  Building2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useMeuServidor } from "@/hooks/useMeusDados";
import { useVinculosServidor, TIPO_VINCULO_LABELS, ORIGEM_LABELS } from "@/hooks/useVinculosServidor";
import { useHistoricoLotacoes } from "@/hooks/useGestaoLotacao";
import { SITUACAO_LABELS, SITUACAO_COLORS } from "@/types/rh";
import { formatCPF, formatDateBR } from "@/lib/formatters";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value || "-"}</span>
    </div>
  );
}

export default function MeusDadosPage() {
  const { data: servidor, isLoading } = useMeuServidor();
  const { data: vinculos = [], isLoading: loadingVinculos } = useVinculosServidor(servidor?.id);
  const { data: lotacoes = [], isLoading: loadingLotacoes } = useHistoricoLotacoes(servidor?.id ?? null);

  if (isLoading) {
    return (
      <ModuleLayout module="rh">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (!servidor) {
    return (
      <ModuleLayout module="rh">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Meus Dados
          </h1>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu usuário não está vinculado a um cadastro de servidor.
              Entre em contato com o RH para regularizar seu acesso.
            </AlertDescription>
          </Alert>
        </div>
      </ModuleLayout>
    );
  }

  const endereco = [
    servidor.endereco_logradouro,
    servidor.endereco_numero,
    servidor.endereco_complemento,
  ].filter(Boolean).join(", ");

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Meus Dados
            </h1>
            <p className="text-muted-foreground">
              {servidor.nome_social || servidor.nome_completo}
              {servidor.matricula ? ` · Matrícula ${servidor.matricula}` : ""}
            </p>
          </div>
          <Badge variant="outline" className={SITUACAO_COLORS[servidor.situacao]}>
            {SITUACAO_LABELS[servidor.situacao] || servidor.situacao}
          </Badge>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Estes dados são somente para consulta. Encontrou algo errado? Procure o RH para a correção.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="Nome completo" value={servidor.nome_completo} />
              {servidor.nome_social && <InfoRow label="Nome social" value={servidor.nome_social} />}
              <InfoRow label="CPF" value={servidor.cpf ? formatCPF(servidor.cpf) : "-"} />
              <InfoRow
                label="RG"
                value={servidor.rg ? `${servidor.rg} ${servidor.rg_orgao_expedidor || ""} ${servidor.rg_uf || ""}`.trim() : "-"}
              />
              <InfoRow label="Data de nascimento" value={formatDateBR(servidor.data_nascimento)} />
              <InfoRow label="PIS/PASEP" value={servidor.pis_pasep} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="E-mail institucional" value={servidor.email_institucional} />
              <InfoRow label="E-mail pessoal" value={servidor.email_pessoal} />
              <InfoRow label="Celular" value={servidor.telefone_celular} />
              <InfoRow label="Telefone fixo" value={servidor.telefone_fixo} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="Logradouro" value={endereco} />
              <InfoRow label="Bairro" value={servidor.endereco_bairro} />
              <InfoRow
                label="Cidade/UF"
                value={servidor.endereco_cidade ? `${servidor.endereco_cidade}/${servidor.endereco_uf || ""}` : "-"}
              />
              <InfoRow label="CEP" value={servidor.endereco_cep} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
                Dados Funcionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="Matrícula" value={servidor.matricula} />
              <InfoRow label="Cargo" value={servidor.cargo?.nome} />
              <InfoRow
                label="Unidade"
                value={servidor.unidade ? `${servidor.unidade.sigla ? servidor.unidade.sigla + " - " : ""}${servidor.unidade.nome}` : "-"}
              />
              <InfoRow label="Situação" value={SITUACAO_LABELS[servidor.situacao] || servidor.situacao} />
              <InfoRow label="Regime jurídico" value={servidor.regime_juridico} />
              <InfoRow label="Carga horária" value={servidor.carga_horaria ? `${servidor.carga_horaria}h` : "-"} />
              <InfoRow label="Admissão" value={formatDateBR(servidor.data_admissao)} />
              <InfoRow label="Posse" value={formatDateBR(servidor.data_posse)} />
              <InfoRow label="Exercício" value={formatDateBR(servidor.data_exercicio)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Landmark className="h-5 w-5 text-primary" />
                Dados Bancários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label="Banco"
                value={servidor.banco_nome ? `${servidor.banco_codigo ? servidor.banco_codigo + " - " : ""}${servidor.banco_nome}` : "-"}
              />
              <InfoRow label="Agência" value={servidor.banco_agencia} />
              <InfoRow label="Conta" value={servidor.banco_conta} />
              <InfoRow label="Tipo de conta" value={servidor.banco_tipo_conta} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-primary" />
              Vínculos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVinculos ? (
              <Skeleton className="h-24 w-full" />
            ) : vinculos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum vínculo registrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vinculos.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{TIPO_VINCULO_LABELS[v.tipo] || v.tipo}</TableCell>
                      <TableCell>{ORIGEM_LABELS[v.origem] || v.origem}</TableCell>
                      <TableCell>{v.cargo?.nome || v.funcao_exercida || "-"}</TableCell>
                      <TableCell>{v.unidade?.sigla || v.unidade?.nome || v.orgao_nome || "-"}</TableCell>
                      <TableCell>{formatDateBR(v.data_inicio)}</TableCell>
                      <TableCell>{formatDateBR(v.data_fim)}</TableCell>
                      <TableCell>
                        <Badge variant={v.ativo ? "default" : "secondary"}>{v.ativo ? "Ativo" : "Encerrado"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Histórico de Lotação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLotacoes ? (
              <Skeleton className="h-24 w-full" />
            ) : lotacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma lotação registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotacoes.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.unidade ? `${l.unidade.sigla ? l.unidade.sigla + " - " : ""}${l.unidade.nome}` : "-"}</TableCell>
                      <TableCell>{l.cargo?.nome || "-"}</TableCell>
                      <TableCell>{formatDateBR(l.data_inicio)}</TableCell>
                      <TableCell>{formatDateBR(l.data_fim)}</TableCell>
                      <TableCell>
                        <Badge variant={l.ativo ? "default" : "secondary"}>{l.ativo ? "Atual" : "Encerrada"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
