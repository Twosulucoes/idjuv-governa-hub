/**
 * ANIVERSARIANTES - MÓDULO COMUNICAÇÃO
 * Reutiliza a lógica do painel de aniversariantes do RH
 * para o módulo de Comunicação (ASCOM)
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, getMonth, getDate, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Cake, 
  Calendar, 
  Users, 
  Gift, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Phone,
  Building2,
  Copy,
  Check,
  Download,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState, KpiCard, PageHeader } from "@/components/design-system";
import { toast } from "sonner";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface Aniversariante {
  id: string;
  nome_completo: string;
  nome_social?: string;
  data_nascimento: string;
  email?: string;
  telefone?: string;
  foto_url?: string;
  cargo_nome?: string;
  unidade_nome?: string;
  dia: number;
}

export default function AniversariantesComunicacaoPage() {
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: servidores, isLoading, isError, refetch } = useQuery({
    queryKey: ["aniversariantes-comunicacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          nome_social,
          data_nascimento,
          email_institucional,
          email_pessoal,
          telefone_celular,
          foto_url,
          situacao,
          cargo_atual_id,
          cargos:cargo_atual_id (nome),
          lotacoes!lotacoes_servidor_id_fkey (
            unidade:unidade_id (nome)
          )
        `)
        .eq("situacao", "ativo")
        .not("data_nascimento", "is", null);

      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        nome_completo: string;
        nome_social?: string;
        data_nascimento: string;
        email_institucional?: string;
        email_pessoal?: string;
        telefone_celular?: string;
        foto_url?: string;
        situacao: string;
        cargo_atual_id?: string;
        cargos?: { nome: string };
        lotacoes?: Array<{ unidade?: { nome: string } }>;
      }>;
    },
  });

  const aniversariantesDoMes = useMemo(() => {
    if (!servidores) return [];

    const lista: Aniversariante[] = [];

    servidores.forEach((servidor) => {
      if (!servidor.data_nascimento) return;

      try {
        const dataNasc = parseISO(servidor.data_nascimento);
        if (!isValid(dataNasc)) return;

        const mesNascimento = getMonth(dataNasc);
        if (mesNascimento !== mesAtual) return;

        const lotacaoAtiva = servidor.lotacoes?.find((l: any) => l.unidade);
        
        lista.push({
          id: servidor.id,
          nome_completo: servidor.nome_completo,
          nome_social: servidor.nome_social,
          data_nascimento: servidor.data_nascimento,
          email: servidor.email_institucional || servidor.email_pessoal,
          telefone: servidor.telefone_celular,
          foto_url: servidor.foto_url,
          cargo_nome: servidor.cargos?.nome,
          unidade_nome: lotacaoAtiva?.unidade?.nome,
          dia: getDate(dataNasc),
        });
      } catch {
        // Data inválida, ignorar
      }
    });

    // Ordenar por dia do mês
    return lista.sort((a, b) => a.dia - b.dia);
  }, [servidores, mesAtual]);

  // Agrupar por semana do mês
  const aniversariantesPorSemana = useMemo(() => {
    const semanas: Record<string, Aniversariante[]> = {
      "1-7": [],
      "8-14": [],
      "15-21": [],
      "22-31": [],
    };

    aniversariantesDoMes.forEach((a) => {
      if (a.dia <= 7) semanas["1-7"].push(a);
      else if (a.dia <= 14) semanas["8-14"].push(a);
      else if (a.dia <= 21) semanas["15-21"].push(a);
      else semanas["22-31"].push(a);
    });

    return semanas;
  }, [aniversariantesDoMes]);

  const aniversariantesHoje = useMemo(() => {
    const hoje = new Date();
    const diaHoje = getDate(hoje);
    const mesHoje = getMonth(hoje);

    if (mesHoje !== mesAtual) return [];

    return aniversariantesDoMes.filter((a) => a.dia === diaHoje);
  }, [aniversariantesDoMes, mesAtual]);

  const navegarMes = (direcao: number) => {
    setMesAtual((prev) => {
      const novoMes = prev + direcao;
      if (novoMes < 0) return 11;
      if (novoMes > 11) return 0;
      return novoMes;
    });
  };

  const copiarEmail = async (email: string, id: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success("E-mail copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportarLista = () => {
    const texto = aniversariantesDoMes
      .map((a) => `${a.dia}/${mesAtual + 1} - ${a.nome_social || a.nome_completo}${a.email ? ` (${a.email})` : ""}`)
      .join("\n");

    const blob = new Blob([texto], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aniversariantes-${MESES[mesAtual].toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Lista exportada!");
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatarData = (data: string, dia: number) => {
    return `${dia.toString().padStart(2, "0")}/${(mesAtual + 1).toString().padStart(2, "0")}`;
  };

  return (
    <ProtectedRoute>
      <ModuleLayout module="comunicacao">
        <div className="space-y-6">
          <PageHeader
            migalhas={[{ rotulo: "Comunicação", href: "/comunicacao" }, { rotulo: "Aniversariantes" }]}
            titulo="Aniversariantes"
            descricao="Acompanhe os aniversários dos servidores para ações de comunicação interna"
            acoes={
              <>
                <div className="flex items-center gap-2" role="group" aria-label="Mês exibido">
                  <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => navegarMes(-1)}>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>

                  <Select value={mesAtual.toString()} onValueChange={(v) => setMesAtual(parseInt(v))}>
                    <SelectTrigger className="w-[160px]" aria-label="Selecionar mês">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((mes, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {mes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => navegarMes(1)}>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>

                <Button variant="outline" onClick={exportarLista} disabled={aniversariantesDoMes.length === 0}>
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Exportar
                </Button>
              </>
            }
          />

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="flex flex-wrap items-center gap-2">
                Não foi possível carregar os aniversariantes.
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Indicadores do mês */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              rotulo={`Aniversariantes em ${MESES[mesAtual]}`}
              valor={aniversariantesDoMes.length}
              icone={Users}
              carregando={isLoading}
            />
            <KpiCard
              rotulo="Aniversariantes hoje"
              valor={aniversariantesHoje.length}
              icone={Gift}
              carregando={isLoading}
              className={aniversariantesHoje.length > 0 ? "border-primary bg-primary/5" : undefined}
              detalhe={
                aniversariantesHoje.length > 0
                  ? aniversariantesHoje.map((a) => a.nome_social || a.nome_completo.split(" ")[0]).join(", ")
                  : undefined
              }
            />
            {(() => {
              const hoje = getDate(new Date());
              const mesHoje = getMonth(new Date());
              const proximo = aniversariantesDoMes.find(
                (a) => mesAtual > mesHoje || (mesAtual === mesHoje && a.dia >= hoje)
              );
              return (
                <KpiCard
                  rotulo="Próximo aniversário"
                  valor={proximo ? `Dia ${proximo.dia}` : "—"}
                  icone={Calendar}
                  carregando={isLoading}
                  detalhe={proximo ? proximo.nome_social || proximo.nome_completo.split(" ")[0] : undefined}
                />
              );
            })()}
          </div>

          {/* Lista por semana */}
          {isLoading ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground" role="status">
                Carregando aniversariantes...
              </CardContent>
            </Card>
          ) : aniversariantesDoMes.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icone={Cake}
                  titulo={`Nenhum aniversariante em ${MESES[mesAtual]}`}
                  descricao="Escolha outro mês para ver os aniversários."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(aniversariantesPorSemana).map(([semana, lista]) => (
                <Card key={semana}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-h3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      Dias {semana}
                    </CardTitle>
                    <CardDescription>
                      {lista.length} aniversariante{lista.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lista.length === 0 ? (
                      <p className="text-body text-muted-foreground text-center py-4">
                        Nenhum aniversariante neste período
                      </p>
                    ) : (
                      lista.map((aniversariante) => {
                        const hoje = new Date();
                        const isHoje = 
                          aniversariante.dia === getDate(hoje) && 
                          mesAtual === getMonth(hoje);

                        return (
                          <div
                            key={aniversariante.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              isHoje ? "bg-primary/10 border-primary" : "bg-muted/30"
                            }`}
                          >
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={aniversariante.foto_url} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(aniversariante.nome_completo)}
                                </AvatarFallback>
                              </Avatar>
                              {isHoje && (
                                <span className="absolute -top-1 -right-1 text-lg" aria-hidden="true">🎂</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              {isHoje && <span className="sr-only">Aniversário hoje: </span>}
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {aniversariante.nome_social || aniversariante.nome_completo}
                                </p>
                                <Badge variant="outline" className="shrink-0">
                                  {formatarData(aniversariante.data_nascimento, aniversariante.dia)}
                                </Badge>
                              </div>
                              
                              {aniversariante.cargo_nome && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {aniversariante.cargo_nome}
                                </p>
                              )}
                              
                              {aniversariante.unidade_nome && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                  <Building2 className="h-3 w-3" aria-hidden="true" />
                                  {aniversariante.unidade_nome}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {aniversariante.email && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      aria-label={`Copiar e-mail de ${aniversariante.nome_social || aniversariante.nome_completo}`}
                                      onClick={() => copiarEmail(aniversariante.email!, aniversariante.id)}
                                    >
                                      {copiedId === aniversariante.id ? (
                                        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                                      ) : (
                                        <Mail className="h-4 w-4" aria-hidden="true" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copiar e-mail</TooltipContent>
                                </Tooltip>
                              )}
                              
                              {aniversariante.telefone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      asChild
                                    >
                                      <a
                                        href={`tel:${aniversariante.telefone}`}
                                        aria-label={`Ligar para ${aniversariante.nome_social || aniversariante.nome_completo}: ${aniversariante.telefone}`}
                                      >
                                        <Phone className="h-4 w-4" aria-hidden="true" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{aniversariante.telefone}</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
