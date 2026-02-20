import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Building2, 
  Users, 
  History,
  Download,
  Loader2,
  Briefcase,
  FileCheck,
  ClipboardCheck,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { 
  generateRelatorioServidoresDiretoria,
  generateRelatorioServidoresVinculo,
  generateRelatorioHistoricoFuncional,
  generateRelatorioVagasCargo,
  generateRelatorioServidoresPortarias
} from "@/lib/pdfRelatoriosRH";
import { generateRelatorioSituacaoPortaria, ServidorPortariaItem } from "@/lib/pdfRelatorioSituacaoPortaria";
import { generateRelatorioAgrupadoPortaria, GrupoPortaria, ServidorParaPortaria } from "@/lib/pdfRelatorioAgrupadoPortaria";
import { VINCULO_LABELS, SITUACAO_LABELS, MOVIMENTACAO_LABELS } from "@/types/rh";
import { ExportacaoServidoresCard } from "@/components/rh/ExportacaoServidoresCard";
import { RelatorioServidoresDiretoriaCard } from "@/components/rh/RelatorioServidoresDiretoriaCard";
import { RelatorioSegundoVinculoCard } from "@/components/rh/RelatorioSegundoVinculoCard";
import { RelatorioContatosEstrategicosCard } from "@/components/rh/RelatorioContatosEstrategicosCard";

const NATUREZA_LABELS: Record<string, string> = {
  comissionado: 'Cargos Comissionados',
  efetivo: 'Cargos Efetivos',
  funcao_gratificada: 'Funções Gratificadas',
  temporario: 'Cargos Temporários',
  estagiario: 'Estagiários',
};

export default function RelatoriosRHPage() {
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");
  const [selectedVinculo, setSelectedVinculo] = useState<string>("all");
  const [selectedServidor, setSelectedServidor] = useState<string>("");
  const [selectedNatureza, setSelectedNatureza] = useState<string>("all");
  const [selectedTipoPortaria, setSelectedTipoPortaria] = useState<string>("all");
  const [selectedStatusPortaria, setSelectedStatusPortaria] = useState<string>("all");
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  // Fetch unidades com hierarquia completa
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo, nivel, superior_id")
        .eq("ativo", true)
        .order("nivel")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Função para organizar unidades hierarquicamente para o relatório
  const organizarUnidadesHierarquicamente = (
    unidadesList: typeof unidades,
    servidoresList: typeof servidores
  ) => {
    // Mapear unidades por ID
    const unidadesMap = new Map(unidadesList.map(u => [u.id, u]));
    
    // Obter caminho hierárquico de uma unidade (para ordenação)
    const getCaminhoHierarquico = (unidadeId: string): string[] => {
      const caminho: string[] = [];
      let currentId: string | null = unidadeId;
      while (currentId) {
        const unidade = unidadesMap.get(currentId);
        if (unidade) {
          caminho.unshift(unidade.nome);
          currentId = unidade.superior_id;
        } else {
          break;
        }
      }
      return caminho;
    };

    // Agrupar servidores por unidade
    const servidoresPorUnidade: Record<string, {
      unidade_id: string;
      unidade_nome: string;
      unidade_sigla: string | null;
      unidade_tipo: string;
      nivel: number;
      superior_id: string | null;
      caminho: string[];
      servidores: typeof servidoresList;
    }> = {};

    servidoresList.forEach(s => {
      const unidadeId = s.unidade?.id || "sem_lotacao";
      const unidade = unidadesMap.get(unidadeId);
      
      if (!servidoresPorUnidade[unidadeId]) {
        servidoresPorUnidade[unidadeId] = {
          unidade_id: unidadeId,
          unidade_nome: unidade?.nome || s.unidade?.nome || "Sem Lotação",
          unidade_sigla: unidade?.sigla || s.unidade?.sigla || null,
          unidade_tipo: unidade?.tipo || "outro",
          nivel: unidade?.nivel || 99,
          superior_id: unidade?.superior_id || null,
          caminho: unidade ? getCaminhoHierarquico(unidadeId) : ["ZZZ - Sem Lotação"],
          servidores: []
        };
      }
      servidoresPorUnidade[unidadeId].servidores.push(s);
    });

    // Ordenar grupos pelo caminho hierárquico
    const gruposOrdenados = Object.values(servidoresPorUnidade).sort((a, b) => {
      // Primeiro por caminho hierárquico (para manter Presidência > Diretoria > Divisão > Núcleo)
      const caminhoA = a.caminho.join(' > ');
      const caminhoB = b.caminho.join(' > ');
      return caminhoA.localeCompare(caminhoB, 'pt-BR');
    });

    return gruposOrdenados;
  };

  // Fetch servidores
  const { data: servidores = [] } = useQuery({
    queryKey: ["servidores-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(`
          id, 
          nome_completo, 
          cpf, 
          matricula,
          vinculo,
          situacao,
          data_admissao,
          possui_vinculo_externo,
          vinculo_externo_orgao,
          cargo:cargos(id, nome, sigla),
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
  });

  // Fetch cargos com contagem de vagas ocupadas
  const { data: cargosComVagas = [] } = useQuery({
    queryKey: ["cargos-vagas-relatorio"],
    queryFn: async () => {
      // Buscar cargos
      const { data: cargos, error: cErr } = await supabase
        .from("cargos")
        .select("id, nome, sigla, natureza, quantidade_vagas, vencimento_base")
        .eq("ativo", true)
        .order("natureza")
        .order("nome");
      
      if (cErr) throw cErr;
      
      // Buscar contagem de provimentos ativos por cargo
      const { data: provimentos, error: pErr } = await supabase
        .from("provimentos")
        .select("cargo_id")
        .eq("status", "ativo");
      
      if (pErr) throw pErr;
      
      // Contar ocupação por cargo
      const ocupacaoPorCargo: Record<string, number> = {};
      (provimentos || []).forEach(p => {
        if (p.cargo_id) {
          ocupacaoPorCargo[p.cargo_id] = (ocupacaoPorCargo[p.cargo_id] || 0) + 1;
        }
      });
      
      return (cargos || []).map(c => ({
        ...c,
        vagas_ocupadas: ocupacaoPorCargo[c.id] || 0,
        vagas_disponiveis: Math.max(0, (c.quantidade_vagas || 0) - (ocupacaoPorCargo[c.id] || 0)),
        percentual_ocupacao: c.quantidade_vagas && c.quantidade_vagas > 0 
          ? ((ocupacaoPorCargo[c.id] || 0) / c.quantidade_vagas) * 100 
          : 0
      }));
    },
  });

  const handleGerarRelatorioDiretoria = async () => {
    setLoadingReport("diretoria");
    try {
      const filteredServidores = selectedUnidade === "all" 
        ? servidores 
        : servidores.filter(s => s.unidade?.id === selectedUnidade);

      if (filteredServidores.length === 0) {
        toast.error("Nenhum servidor encontrado para gerar o relatório");
        return;
      }

      // Usar organização hierárquica
      const gruposHierarquicos = organizarUnidadesHierarquicamente(unidades, filteredServidores);

      await generateRelatorioServidoresDiretoria({
        grupos: gruposHierarquicos.map(g => ({
          unidade_nome: g.unidade_nome,
          unidade_sigla: g.unidade_sigla,
          unidade_tipo: g.unidade_tipo,
          nivel: g.nivel,
          caminho_hierarquico: g.caminho.join(' > '),
          servidores: g.servidores.map(s => ({
            nome: s.nome_completo,
            cpf: s.cpf,
            matricula: s.matricula,
            cargo: s.cargo?.nome || "-",
            vinculo: VINCULO_LABELS[s.vinculo as keyof typeof VINCULO_LABELS] || s.vinculo,
            situacao: SITUACAO_LABELS[s.situacao as keyof typeof SITUACAO_LABELS] || s.situacao
          }))
        })),
        totalServidores: filteredServidores.length,
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
        filtroUnidade: selectedUnidade === "all" ? null : unidades.find(u => u.id === selectedUnidade)?.nome || null
      });

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoadingReport(null);
    }
  };

  const handleGerarRelatorioVinculo = async () => {
    setLoadingReport("vinculo");
    try {
      const filteredServidores = selectedVinculo === "all" 
        ? servidores 
        : servidores.filter(s => s.vinculo === selectedVinculo);

      if (filteredServidores.length === 0) {
        toast.error("Nenhum servidor encontrado para gerar o relatório");
        return;
      }

      // Group by vinculo
      const servidoresPorVinculo: Record<string, typeof filteredServidores> = {};

      filteredServidores.forEach(s => {
        if (!servidoresPorVinculo[s.vinculo]) {
          servidoresPorVinculo[s.vinculo] = [];
        }
        servidoresPorVinculo[s.vinculo].push(s);
      });

      await generateRelatorioServidoresVinculo({
        grupos: Object.entries(servidoresPorVinculo).map(([vinculo, lista]) => ({
          vinculo: VINCULO_LABELS[vinculo as keyof typeof VINCULO_LABELS] || vinculo,
          servidores: lista.map(s => ({
            nome: s.nome_completo,
            cpf: s.cpf,
            matricula: s.matricula,
            cargo: s.cargo?.nome || "-",
            unidade: s.unidade?.sigla || s.unidade?.nome || "-",
            situacao: SITUACAO_LABELS[s.situacao as keyof typeof SITUACAO_LABELS] || s.situacao,
            possui_vinculo_externo: s.possui_vinculo_externo,
            vinculo_externo_orgao: s.vinculo_externo_orgao
          }))
        })),
        totalServidores: filteredServidores.length,
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
        filtroVinculo: selectedVinculo === "all" ? null : VINCULO_LABELS[selectedVinculo as keyof typeof VINCULO_LABELS] || null
      });

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoadingReport(null);
    }
  };

  const handleGerarRelatorioHistorico = async () => {
    if (!selectedServidor) {
      toast.error("Selecione um servidor");
      return;
    }

    setLoadingReport("historico");
    try {
      // Fetch servidor completo
      const { data: servidor, error: sErr } = await supabase
        .from("servidores")
        .select(`
          *,
          cargo:cargos(id, nome, sigla),
          unidade:estrutura_organizacional(id, nome, sigla),
          vinculo_externo_ato:documentos!servidores_vinculo_externo_ato_id_fkey(numero, ano)
        `)
        .eq("id", selectedServidor)
        .single();

      if (sErr) throw sErr;

      // Fetch historico funcional
      const { data: historico, error: hErr } = await supabase
        .from("historico_funcional")
        .select(`
          *,
          cargo_anterior:cargos!historico_funcional_cargo_anterior_id_fkey(nome),
          cargo_novo:cargos!historico_funcional_cargo_novo_id_fkey(nome),
          unidade_anterior:estrutura_organizacional!historico_funcional_unidade_anterior_id_fkey(nome, sigla),
          unidade_nova:estrutura_organizacional!historico_funcional_unidade_nova_id_fkey(nome, sigla)
        `)
        .eq("servidor_id", selectedServidor)
        .order("data_evento", { ascending: false });

      if (hErr) throw hErr;

      // Fetch portarias
      const { data: portarias, error: pErr } = await supabase
        .from("portarias_servidor")
        .select("*")
        .eq("servidor_id", selectedServidor)
        .order("data_publicacao", { ascending: false });

      if (pErr) throw pErr;

      // Fetch ferias
      const { data: ferias, error: fErr } = await supabase
        .from("ferias_servidor")
        .select("*")
        .eq("servidor_id", selectedServidor)
        .order("data_inicio", { ascending: false });

      if (fErr) throw fErr;

      // Fetch licencas
      const { data: licencas, error: lErr } = await supabase
        .from("licencas_afastamentos")
        .select("*")
        .eq("servidor_id", selectedServidor)
        .order("data_inicio", { ascending: false });

      if (lErr) throw lErr;

      await generateRelatorioHistoricoFuncional({
        servidor: {
          nome: servidor.nome_completo,
          cpf: servidor.cpf,
          matricula: servidor.matricula,
          cargo: servidor.cargo?.nome || "-",
          unidade: servidor.unidade?.nome || "-",
          vinculo: VINCULO_LABELS[servidor.vinculo as keyof typeof VINCULO_LABELS] || servidor.vinculo,
          situacao: SITUACAO_LABELS[servidor.situacao as keyof typeof SITUACAO_LABELS] || servidor.situacao,
          data_admissao: servidor.data_admissao,
          // Segundo Vínculo
          possui_vinculo_externo: servidor.possui_vinculo_externo,
          vinculo_externo_esfera: servidor.vinculo_externo_esfera,
          vinculo_externo_situacao: servidor.vinculo_externo_situacao,
          vinculo_externo_orgao: servidor.vinculo_externo_orgao,
          vinculo_externo_cargo: servidor.vinculo_externo_cargo,
          vinculo_externo_matricula: servidor.vinculo_externo_matricula,
          vinculo_externo_forma: servidor.vinculo_externo_forma,
          vinculo_externo_ato: servidor.vinculo_externo_ato ? {
            numero: (servidor.vinculo_externo_ato as { numero?: string; ano?: number })?.numero || '',
            ano: (servidor.vinculo_externo_ato as { numero?: string; ano?: number })?.ano || 0
          } : null
        },
        historico: (historico || []).map(h => ({
          data: h.data_evento,
          tipo: MOVIMENTACAO_LABELS[h.tipo as keyof typeof MOVIMENTACAO_LABELS] || h.tipo,
          descricao: h.descricao || "",
          portaria: h.portaria_numero,
          cargo_anterior: h.cargo_anterior?.nome,
          cargo_novo: h.cargo_novo?.nome,
          unidade_anterior: h.unidade_anterior?.nome,
          unidade_nova: h.unidade_nova?.nome
        })),
        portarias: (portarias || []).map(p => ({
          numero: p.numero,
          ano: p.ano,
          tipo: p.tipo,
          assunto: p.assunto,
          data_publicacao: p.data_publicacao
        })),
        ferias: (ferias || []).map(f => ({
          periodo_aquisitivo: `${f.periodo_aquisitivo_inicio} a ${f.periodo_aquisitivo_fim}`,
          data_inicio: f.data_inicio,
          data_fim: f.data_fim,
          dias: f.dias_gozados
        })),
        licencas: (licencas || []).map(l => ({
          tipo: l.tipo_licenca || l.tipo_afastamento,
          data_inicio: l.data_inicio,
          data_fim: l.data_fim,
          dias: l.dias_afastamento
        })),
        dataGeracao: new Date().toLocaleDateString('pt-BR')
      });

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoadingReport(null);
    }
  };

  const handleGerarRelatorioVagas = async () => {
    setLoadingReport("vagas");
    try {
      const filteredCargos = selectedNatureza === "all"
        ? cargosComVagas
        : cargosComVagas.filter(c => c.natureza === selectedNatureza);

      if (filteredCargos.length === 0) {
        toast.error("Nenhum cargo encontrado para gerar o relatório");
        return;
      }

      // Agrupar por natureza
      const cargosPorNatureza: Record<string, typeof filteredCargos> = {};
      filteredCargos.forEach(c => {
        const natureza = c.natureza || 'outros';
        if (!cargosPorNatureza[natureza]) {
          cargosPorNatureza[natureza] = [];
        }
        cargosPorNatureza[natureza].push(c);
      });

      const grupos = Object.entries(cargosPorNatureza).map(([natureza, cargos]) => {
        const total_previstas = cargos.reduce((acc, c) => acc + (c.quantidade_vagas || 0), 0);
        const total_ocupadas = cargos.reduce((acc, c) => acc + c.vagas_ocupadas, 0);
        return {
          natureza,
          natureza_label: NATUREZA_LABELS[natureza] || natureza,
          cargos: cargos.map(c => ({
            id: c.id,
            nome: c.nome,
            sigla: c.sigla,
            natureza: c.natureza || 'outros',
            quantidade_vagas: c.quantidade_vagas || 0,
            vagas_ocupadas: c.vagas_ocupadas,
            vagas_disponiveis: c.vagas_disponiveis,
            percentual_ocupacao: c.percentual_ocupacao,
            vencimento_base: c.vencimento_base
          })),
          total_previstas,
          total_ocupadas,
          total_disponiveis: total_previstas - total_ocupadas
        };
      });

      const totalPrevistas = filteredCargos.reduce((acc, c) => acc + (c.quantidade_vagas || 0), 0);
      const totalOcupadas = filteredCargos.reduce((acc, c) => acc + c.vagas_ocupadas, 0);
      const totalDisponiveis = totalPrevistas - totalOcupadas;
      const percentualGeral = totalPrevistas > 0 ? (totalOcupadas / totalPrevistas) * 100 : 0;

      await generateRelatorioVagasCargo({
        grupos,
        totalCargos: filteredCargos.length,
        totalPrevistas,
        totalOcupadas,
        totalDisponiveis,
        percentualGeral,
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
        filtroNatureza: selectedNatureza === "all" ? null : selectedNatureza
      });

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoadingReport(null);
    }
  };

  const handleGerarRelatorioServidoresPortarias = async () => {
    setLoadingReport("portarias");
    try {
      // Buscar portarias com servidores vinculados
      const { data: portarias, error: pErr } = await supabase
        .from("documentos")
        .select(`
          id,
          numero,
          titulo,
          tipo,
          categoria,
          status,
          data_documento,
          data_publicacao,
          servidores_ids
        `)
        .eq("tipo", "portaria")
        .not("servidores_ids", "is", null);

      if (pErr) throw pErr;

      // Filtrar por tipo e status se selecionados
      let filteredPortarias = portarias || [];
      if (selectedTipoPortaria !== "all") {
        filteredPortarias = filteredPortarias.filter(p => p.categoria === selectedTipoPortaria);
      }
      if (selectedStatusPortaria !== "all") {
        filteredPortarias = filteredPortarias.filter(p => p.status === selectedStatusPortaria);
      }

      // Coletar todos os IDs de servidores únicos
      const allServidorIds = new Set<string>();
      filteredPortarias.forEach(p => {
        if (Array.isArray(p.servidores_ids)) {
          p.servidores_ids.forEach((id: string) => allServidorIds.add(id));
        }
      });

      if (allServidorIds.size === 0) {
        toast.error("Nenhum servidor com portaria encontrado");
        return;
      }

      // Buscar dados dos servidores
      const { data: servidoresData, error: sErr } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          vinculo,
          cargo:cargos(nome),
          unidade:estrutura_organizacional(nome, sigla)
        `)
        .in("id", Array.from(allServidorIds));

      if (sErr) throw sErr;

      // Montar estrutura do relatório
      const servidoresMap = new Map(
        (servidoresData || []).map(s => [s.id, s])
      );

      const servidoresComPortarias: Array<{
        id: string;
        nome: string;
        cpf: string;
        matricula: string | null;
        cargo: string;
        unidade: string;
        vinculo: string;
        portarias: Array<{
          numero: string;
          titulo: string;
          tipo: string;
          categoria: string | null;
          status: string;
          data_documento: string;
          data_publicacao: string | null;
        }>;
      }> = [];

      // Agrupar portarias por servidor
      const portariasPorServidor = new Map<string, typeof filteredPortarias>();
      filteredPortarias.forEach(p => {
        if (Array.isArray(p.servidores_ids)) {
          p.servidores_ids.forEach((servidorId: string) => {
            if (!portariasPorServidor.has(servidorId)) {
              portariasPorServidor.set(servidorId, []);
            }
            portariasPorServidor.get(servidorId)!.push(p);
          });
        }
      });

      // Montar lista final
      portariasPorServidor.forEach((portariasServidor, servidorId) => {
        const servidor = servidoresMap.get(servidorId);
        if (servidor) {
          servidoresComPortarias.push({
            id: servidor.id,
            nome: servidor.nome_completo,
            cpf: servidor.cpf,
            matricula: servidor.matricula,
            cargo: servidor.cargo?.nome || "-",
            unidade: servidor.unidade?.sigla || servidor.unidade?.nome || "-",
            vinculo: servidor.vinculo,
            portarias: portariasServidor.map(p => ({
              numero: p.numero,
              titulo: p.titulo,
              tipo: p.tipo || "portaria",
              categoria: p.categoria,
              status: p.status,
              data_documento: p.data_documento,
              data_publicacao: p.data_publicacao
            }))
          });
        }
      });

      // Ordenar por nome
      servidoresComPortarias.sort((a, b) => a.nome.localeCompare(b.nome));

      const totalPortarias = servidoresComPortarias.reduce((acc, s) => acc + s.portarias.length, 0);

      await generateRelatorioServidoresPortarias({
        servidores: servidoresComPortarias,
        totalServidores: servidoresComPortarias.length,
        totalPortarias,
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
        filtroTipo: selectedTipoPortaria === "all" ? null : selectedTipoPortaria,
        filtroStatus: selectedStatusPortaria === "all" ? null : selectedStatusPortaria
      });

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoadingReport(null);
    }
  };

  const handleGerarRelatorioSituacaoPortaria = async () => {
    setLoadingReport("situacao-portaria");
    try {
      // Buscar servidores ativos da view v_servidores_situacao com provimentos
      const { data: servidoresData, error } = await supabase
        .from("v_servidores_situacao")
        .select(`
          id,
          nome_completo,
          cpf,
          cargo_nome,
          cargo_sigla,
          unidade_sigla,
          unidade_nome,
          provimento_id
        `)
        .eq("situacao", "ativo")
        .order("nome_completo");

      if (error) throw error;

      if (!servidoresData || servidoresData.length === 0) {
        toast.error("Nenhum servidor ativo encontrado");
        return;
      }

      // Buscar portarias de nomeação da Central de Portarias (tabela documentos)
      // Incluir categoria 'nomeacao' e 'pessoal' pois algumas portarias de nomeação estão categorizadas como pessoal
      const { data: portariasNomeacao, error: portErr } = await supabase
        .from("documentos")
        .select("id, numero, servidores_ids")
        .eq("tipo", "portaria")
        .in("categoria", ["nomeacao", "pessoal"]);

      if (portErr) throw portErr;

      // Criar mapa: servidor_id -> lista de números de portaria
      const portariasPorServidor = new Map<string, string[]>();
      
      (portariasNomeacao || []).forEach(portaria => {
        if (portaria.servidores_ids && Array.isArray(portaria.servidores_ids) && portaria.numero) {
          portaria.servidores_ids.forEach((servidorId: string) => {
            const existing = portariasPorServidor.get(servidorId) || [];
            existing.push(portaria.numero);
            portariasPorServidor.set(servidorId, existing);
          });
        }
      });

      // Separar servidores com e sem portaria oficial da Central
      const servidoresComPortaria: ServidorPortariaItem[] = [];
      const servidoresSemPortaria: ServidorPortariaItem[] = [];

      servidoresData.forEach(s => {
        const numerosPortaria = portariasPorServidor.get(s.id);
        const temPortariaOficial = numerosPortaria && numerosPortaria.length > 0;
        
        const item: Omit<ServidorPortariaItem, 'ord'> = {
          nome: s.nome_completo || '',
          cpf: s.cpf || '',
          cargo: s.cargo_nome || '-',
          unidade: s.unidade_sigla || s.unidade_nome || '-',
          codigo: s.cargo_sigla || '-',
          portaria: temPortariaOficial ? numerosPortaria.join(', ') : '-'
        };

        if (temPortariaOficial) {
          servidoresComPortaria.push({ ...item, ord: 0 });
        } else {
          servidoresSemPortaria.push({ ...item, ord: 0 });
        }
      });

      // Ordenar e numerar
      servidoresComPortaria.sort((a, b) => a.nome.localeCompare(b.nome));
      servidoresComPortaria.forEach((s, i) => s.ord = i + 1);

      servidoresSemPortaria.sort((a, b) => a.nome.localeCompare(b.nome));
      servidoresSemPortaria.forEach((s, i) => s.ord = i + 1);

      await generateRelatorioSituacaoPortaria({
        servidoresComPortaria,
        servidoresSemPortaria,
        dataGeracao: new Date().toLocaleDateString('pt-BR')
      });

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoadingReport(null);
    }
  };

  // Relatório de Servidores Agrupado por Portaria
  const handleGerarRelatorioAgrupadoPortaria = async () => {
    setLoadingReport("agrupado-portaria");
    try {
      // Buscar servidores ativos
      const { data: servidoresData, error } = await supabase
        .from("v_servidores_situacao")
        .select(`
          id,
          nome_completo,
          cpf,
          cargo_nome,
          cargo_sigla,
          unidade_sigla,
          unidade_nome
        `)
        .eq("situacao", "ativo")
        .order("nome_completo");

      if (error) throw error;

      if (!servidoresData || servidoresData.length === 0) {
        toast.error("Nenhum servidor ativo encontrado");
        return;
      }

      // Buscar portarias de nomeação (incluindo categoria pessoal)
      const { data: portariasNomeacao, error: portErr } = await supabase
        .from("documentos")
        .select("id, numero, servidores_ids")
        .eq("tipo", "portaria")
        .in("categoria", ["nomeacao", "pessoal"])
        .order("numero");

      if (portErr) throw portErr;

      // Criar mapa de servidor por ID para acesso rápido
      const servidoresMap = new Map(servidoresData.map(s => [s.id, s]));

      // Agrupar servidores por portaria
      const grupos: GrupoPortaria[] = [];
      const servidoresComPortaria = new Set<string>();

      (portariasNomeacao || []).forEach(portaria => {
        if (portaria.servidores_ids && Array.isArray(portaria.servidores_ids) && portaria.numero) {
          const servidoresDoGrupo: ServidorParaPortaria[] = [];
          
          portaria.servidores_ids.forEach((servidorId: string) => {
            const servidor = servidoresMap.get(servidorId);
            if (servidor) {
              servidoresComPortaria.add(servidorId);
              servidoresDoGrupo.push({
                ord: 0,
                nome: servidor.nome_completo || '',
                cpf: servidor.cpf || '',
                cargo: servidor.cargo_nome || '-',
                unidade: servidor.unidade_sigla || servidor.unidade_nome || '-',
                codigo: servidor.cargo_sigla || '-'
              });
            }
          });

          // Ordenar e numerar servidores do grupo
          servidoresDoGrupo.sort((a, b) => a.nome.localeCompare(b.nome));
          servidoresDoGrupo.forEach((s, i) => s.ord = i + 1);

          if (servidoresDoGrupo.length > 0) {
            grupos.push({
              numero: portaria.numero,
              servidores: servidoresDoGrupo
            });
          }
        }
      });

      // Ordenar grupos por número da portaria
      grupos.sort((a, b) => a.numero.localeCompare(b.numero));

      // Servidores sem portaria
      const servidoresSemPortaria: ServidorParaPortaria[] = servidoresData
        .filter(s => !servidoresComPortaria.has(s.id))
        .map(s => ({
          ord: 0,
          nome: s.nome_completo || '',
          cpf: s.cpf || '',
          cargo: s.cargo_nome || '-',
          unidade: s.unidade_sigla || s.unidade_nome || '-',
          codigo: s.cargo_sigla || '-'
        }));

      servidoresSemPortaria.sort((a, b) => a.nome.localeCompare(b.nome));
      servidoresSemPortaria.forEach((s, i) => s.ord = i + 1);

      await generateRelatorioAgrupadoPortaria({
        grupos,
        servidoresSemPortaria,
        dataGeracao: new Date().toLocaleDateString('pt-BR')
      });

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoadingReport(null);
    }
  };

  return (
    <ProtectedRoute requiredModule="rh">
      <ModuleLayout module="rh">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatórios de RH</h1>
              <p className="text-muted-foreground">
                Gere relatórios em PDF do quadro de servidores
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Relatório por Diretoria/Unidade */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Servidores por Diretoria</CardTitle>
                    <CardDescription>Lista de servidores agrupados por unidade organizacional</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filtrar por unidade (opcional)</Label>
                  <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as unidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as unidades</SelectItem>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleGerarRelatorioDiretoria}
                  disabled={loadingReport === "diretoria"}
                >
                  {loadingReport === "diretoria" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório PDF
                </Button>
              </CardContent>
            </Card>

            {/* Relatório por Vínculo */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Users className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Servidores por Vínculo</CardTitle>
                    <CardDescription>Lista de servidores agrupados por tipo de vínculo funcional</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filtrar por vínculo (opcional)</Label>
                  <Select value={selectedVinculo} onValueChange={setSelectedVinculo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os vínculos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os vínculos</SelectItem>
                      {Object.entries(VINCULO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleGerarRelatorioVinculo}
                  disabled={loadingReport === "vinculo"}
                >
                  {loadingReport === "vinculo" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório PDF
                </Button>
              </CardContent>
            </Card>

            {/* Histórico Funcional Individual */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <History className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Histórico Funcional</CardTitle>
                    <CardDescription>Histórico completo de um servidor específico</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecione o servidor *</Label>
                  <Select value={selectedServidor} onValueChange={setSelectedServidor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um servidor" />
                    </SelectTrigger>
                    <SelectContent>
                      {servidores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nome_completo} {s.matricula ? `(${s.matricula})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleGerarRelatorioHistorico}
                  disabled={loadingReport === "historico" || !selectedServidor}
                >
                  {loadingReport === "historico" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório PDF
                </Button>
              </CardContent>
            </Card>

            {/* Relatório de Vagas por Cargo */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Briefcase className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Vagas por Cargo</CardTitle>
                    <CardDescription>Distribuição de vagas ocupadas e disponíveis por cargo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filtrar por natureza (opcional)</Label>
                  <Select value={selectedNatureza} onValueChange={setSelectedNatureza}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as naturezas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as naturezas</SelectItem>
                      {Object.entries(NATUREZA_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleGerarRelatorioVagas}
                  disabled={loadingReport === "vagas"}
                >
                  {loadingReport === "vagas" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório PDF
                </Button>
              </CardContent>
            </Card>

            {/* Relatório de Servidores com Portarias */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <FileCheck className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Servidores com Portarias</CardTitle>
                    <CardDescription>Lista de servidores e suas portarias vinculadas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filtrar por categoria (opcional)</Label>
                  <Select value={selectedTipoPortaria} onValueChange={setSelectedTipoPortaria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      <SelectItem value="nomeacao">Nomeação</SelectItem>
                      <SelectItem value="exoneracao">Exoneração</SelectItem>
                      <SelectItem value="designacao">Designação</SelectItem>
                      <SelectItem value="cessao">Cessão</SelectItem>
                      <SelectItem value="ferias">Férias</SelectItem>
                      <SelectItem value="licenca">Licença</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Filtrar por status (opcional)</Label>
                  <Select value={selectedStatusPortaria} onValueChange={setSelectedStatusPortaria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="minuta">Minuta</SelectItem>
                      <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                      <SelectItem value="assinado">Assinado</SelectItem>
                      <SelectItem value="aguardando_publicacao">Aguardando Publicação</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                      <SelectItem value="vigente">Vigente</SelectItem>
                      <SelectItem value="revogado">Revogado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleGerarRelatorioServidoresPortarias}
                  disabled={loadingReport === "portarias"}
                >
                  {loadingReport === "portarias" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório PDF
                </Button>
              </CardContent>
            </Card>

            {/* Relatório de Situação de Portaria - COM/SEM */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Situação de Portaria</CardTitle>
                    <CardDescription>Lista servidores com e sem portaria de nomeação</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gera relatório comparativo mostrando servidores que possuem ou não 
                  portaria de nomeação registrada no sistema.
                </p>
                <Button 
                  className="w-full" 
                  onClick={handleGerarRelatorioSituacaoPortaria}
                  disabled={loadingReport === "situacao-portaria"}
                >
                  {loadingReport === "situacao-portaria" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório PDF
                </Button>
              </CardContent>
            </Card>

            {/* Relatório Agrupado por Portaria */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Layers className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Servidores por Portaria</CardTitle>
                    <CardDescription>Agrupa servidores por número de portaria</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gera relatório agrupando os servidores por número de portaria de nomeação 
                  (001/2026, 002/2026, 003/2026, etc).
                </p>
                <Button 
                  className="w-full" 
                  onClick={handleGerarRelatorioAgrupadoPortaria}
                  disabled={loadingReport === "agrupado-portaria"}
                >
                  {loadingReport === "agrupado-portaria" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório PDF
                </Button>
              </CardContent>
            </Card>

            {/* Relatório Configurável para Planilha */}
            <ExportacaoServidoresCard />

            {/* Relatório Hierárquico por Diretoria */}
            <RelatorioServidoresDiretoriaCard />

            {/* Relatório de Contatos Estratégicos */}
            <RelatorioContatosEstrategicosCard />

            {/* Relatório de Segundo Vínculo */}
            <RelatorioSegundoVinculoCard />
          </div>

          {/* Summary Cards */}
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Servidores</p>
                  <p className="text-2xl font-bold">{servidores.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unidades</p>
                  <p className="text-2xl font-bold">{unidades.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-info/10 rounded-lg">
                  <Users className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissionados</p>
                  <p className="text-2xl font-bold">
                    {servidores.filter(s => s.vinculo === 'comissionado').length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Efetivos</p>
                  <p className="text-2xl font-bold">
                    {servidores.filter(s => s.vinculo === 'efetivo').length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
