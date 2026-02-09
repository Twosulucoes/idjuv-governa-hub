/**
 * Hook para gerenciar o calendário integrado do módulo de Comunicação
 * Consolida: demandas ASCOM, aniversariantes, eventos de federações e publicações CMS
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, parseISO, getMonth, getDate, isValid } from "date-fns";

export type TipoEventoCalendario = 
  | "demanda"
  | "aniversario"
  | "evento_federacao"
  | "publicacao"
  | "banner";

export interface EventoCalendario {
  id: string;
  tipo: TipoEventoCalendario;
  titulo: string;
  descricao?: string;
  data: Date;
  dataFim?: Date;
  cor: string;
  icone: string;
  link?: string;
  metadata?: Record<string, any>;
}

// Cores por tipo de evento
const CORES_EVENTOS: Record<TipoEventoCalendario, string> = {
  demanda: "hsl(var(--primary))",
  aniversario: "hsl(340, 82%, 52%)", // Rosa
  evento_federacao: "hsl(142, 76%, 36%)", // Verde
  publicacao: "hsl(221, 83%, 53%)", // Azul
  banner: "hsl(38, 92%, 50%)", // Laranja
};

const ICONES_EVENTOS: Record<TipoEventoCalendario, string> = {
  demanda: "clipboard-list",
  aniversario: "cake",
  evento_federacao: "trophy",
  publicacao: "newspaper",
  banner: "image",
};

interface UseCalendarioComunicacaoOptions {
  mes: number; // 0-11
  ano: number;
}

export function useCalendarioComunicacao({ mes, ano }: UseCalendarioComunicacaoOptions) {
  const dataReferencia = new Date(ano, mes, 1);
  const inicioMes = startOfMonth(dataReferencia);
  const fimMes = endOfMonth(dataReferencia);
  const inicioMesStr = format(inicioMes, "yyyy-MM-dd");
  const fimMesStr = format(fimMes, "yyyy-MM-dd");

  // Buscar demandas ASCOM com prazo no mês
  const { data: demandas = [], isLoading: loadingDemandas } = useQuery({
    queryKey: ["calendario-demandas", mes, ano],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("demandas_ascom")
        .select("id, titulo, prazo_entrega, status, prioridade, categoria")
        .gte("prazo_entrega", inicioMesStr)
        .lte("prazo_entrega", fimMesStr)
        .not("status", "in", "(concluida,cancelada,arquivada)");

      if (error) throw error;

      return (data || []).map((d: any): EventoCalendario => ({
        id: `demanda-${d.id}`,
        tipo: "demanda",
        titulo: d.titulo,
        descricao: `${d.categoria} • ${d.status}`,
        data: parseISO(d.prazo_entrega),
        cor: CORES_EVENTOS.demanda,
        icone: ICONES_EVENTOS.demanda,
        link: `/ascom/demandas/${d.id}`,
        metadata: { prioridade: d.prioridade, status: d.status },
      }));
    },
  });

  // Buscar aniversariantes do mês
  const { data: aniversariantes = [], isLoading: loadingAniversariantes } = useQuery({
    queryKey: ["calendario-aniversariantes", mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo, nome_social, data_nascimento, foto_url")
        .eq("situacao", "ativo")
        .not("data_nascimento", "is", null);

      if (error) throw error;

      const eventos: EventoCalendario[] = [];

      (data || []).forEach((s: any) => {
        if (!s.data_nascimento) return;
        
        try {
          const dataNasc = parseISO(s.data_nascimento);
          if (!isValid(dataNasc)) return;

          const mesNascimento = getMonth(dataNasc);
          if (mesNascimento !== mes) return;

          const diaNascimento = getDate(dataNasc);
          const dataEvento = new Date(ano, mes, diaNascimento);

          eventos.push({
            id: `aniversario-${s.id}`,
            tipo: "aniversario",
            titulo: s.nome_social || s.nome_completo,
            descricao: "Aniversário",
            data: dataEvento,
            cor: CORES_EVENTOS.aniversario,
            icone: ICONES_EVENTOS.aniversario,
            metadata: { foto_url: s.foto_url },
          });
        } catch {
          // Data inválida, ignorar
        }
      });

      return eventos;
    },
  });

  // Buscar eventos de federações
  const { data: eventosFederacao = [], isLoading: loadingEventos } = useQuery({
    queryKey: ["calendario-federacoes", mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendario_federacao")
        .select("id, titulo, data_inicio, data_fim, tipo, local, federacao_id")
        .gte("data_inicio", inicioMesStr)
        .lte("data_inicio", fimMesStr);

      if (error) throw error;

      return (data || []).map((e: any): EventoCalendario => ({
        id: `evento-${e.id}`,
        tipo: "evento_federacao",
        titulo: e.titulo,
        descricao: e.local || e.tipo,
        data: parseISO(e.data_inicio),
        dataFim: e.data_fim ? parseISO(e.data_fim) : undefined,
        cor: CORES_EVENTOS.evento_federacao,
        icone: ICONES_EVENTOS.evento_federacao,
        metadata: { tipo: e.tipo, federacao_id: e.federacao_id },
      }));
    },
  });

  // Buscar publicações agendadas no CMS
  const { data: publicacoes = [], isLoading: loadingPublicacoes } = useQuery({
    queryKey: ["calendario-publicacoes", mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_conteudos")
        .select("id, titulo, tipo, destino, data_publicacao, status")
        .gte("data_publicacao", inicioMesStr)
        .lte("data_publicacao", fimMesStr)
        .in("status", ["aprovado", "publicado", "rascunho"]);

      if (error) throw error;

      return (data || []).map((p: any): EventoCalendario => ({
        id: `publicacao-${p.id}`,
        tipo: "publicacao",
        titulo: p.titulo,
        descricao: `${p.tipo} • ${p.destino}`,
        data: parseISO(p.data_publicacao),
        cor: CORES_EVENTOS.publicacao,
        icone: ICONES_EVENTOS.publicacao,
        link: `/comunicacao/cms/conteudos?id=${p.id}`,
        metadata: { tipo: p.tipo, destino: p.destino, status: p.status },
      }));
    },
  });

  // Buscar banners agendados
  const { data: banners = [], isLoading: loadingBanners } = useQuery({
    queryKey: ["calendario-banners", mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_banners")
        .select("id, titulo, data_inicio, data_fim, destino, ativo")
        .or(`data_inicio.gte.${inicioMesStr},data_fim.lte.${fimMesStr}`);

      if (error) throw error;

      return (data || []).map((b: any): EventoCalendario => ({
        id: `banner-${b.id}`,
        tipo: "banner",
        titulo: b.titulo,
        descricao: `Banner • ${b.destino}`,
        data: parseISO(b.data_inicio),
        dataFim: b.data_fim ? parseISO(b.data_fim) : undefined,
        cor: CORES_EVENTOS.banner,
        icone: ICONES_EVENTOS.banner,
        link: `/comunicacao/cms/banners?id=${b.id}`,
        metadata: { ativo: b.ativo },
      }));
    },
  });

  // Consolidar todos os eventos
  const todosEventos = [
    ...demandas,
    ...aniversariantes,
    ...eventosFederacao,
    ...publicacoes,
    ...banners,
  ].sort((a, b) => a.data.getTime() - b.data.getTime());

  // Agrupar por dia
  const eventosPorDia = todosEventos.reduce((acc, evento) => {
    const dia = format(evento.data, "yyyy-MM-dd");
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(evento);
    return acc;
  }, {} as Record<string, EventoCalendario[]>);

  // Estatísticas
  const estatisticas = {
    totalEventos: todosEventos.length,
    demandas: demandas.length,
    aniversariantes: aniversariantes.length,
    eventosFederacao: eventosFederacao.length,
    publicacoes: publicacoes.length,
    banners: banners.length,
  };

  const isLoading = loadingDemandas || loadingAniversariantes || loadingEventos || loadingPublicacoes || loadingBanners;

  return {
    eventos: todosEventos,
    eventosPorDia,
    estatisticas,
    isLoading,
    cores: CORES_EVENTOS,
  };
}
