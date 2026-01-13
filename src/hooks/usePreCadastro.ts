import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PreCadastro } from '@/types/preCadastro';
import type { TipoServidor } from '@/types/servidor';
import type { Json } from '@/integrations/supabase/types';
import { gerarMatricula } from '@/lib/matriculaUtils';

// Helper para converter dados do banco para o tipo PreCadastro
function mapToPreCadastro(data: any): PreCadastro {
  return {
    ...data,
    idiomas: data.idiomas || [],
    cursos_complementares: data.cursos_complementares || [],
    dependentes: data.dependentes || [],
    habilidades: data.habilidades || [],
  };
}

// Helper para converter dados do formulário para o banco
function mapToDatabase(dados: Partial<PreCadastro>): Record<string, any> {
  const result: Record<string, any> = { ...dados };
  if (dados.idiomas) result.idiomas = dados.idiomas as unknown as Json;
  if (dados.cursos_complementares) result.cursos_complementares = dados.cursos_complementares as unknown as Json;
  if (dados.dependentes) result.dependentes = dados.dependentes as unknown as Json;
  return result;
}

// Helper para mapear pré-cadastro para servidor
function mapPreCadastroToServidor(
  pc: PreCadastro,
  extras: {
    matricula: string;
    tipoServidor: TipoServidor;
    cargoId?: string;
    unidadeId: string;
    dataAdmissao: string;
  }
): Record<string, any> {
  return {
    nome_completo: pc.nome_completo,
    nome_social: pc.nome_social,
    cpf: pc.cpf,
    rg: pc.rg,
    rg_orgao_expedidor: pc.rg_orgao_expedidor,
    rg_uf: pc.rg_uf,
    data_nascimento: pc.data_nascimento,
    sexo: pc.sexo,
    estado_civil: pc.estado_civil,
    nacionalidade: pc.nacionalidade,
    naturalidade_cidade: pc.naturalidade_cidade,
    naturalidade_uf: pc.naturalidade_uf,
    
    // Documentos
    pis_pasep: pc.pis_pasep,
    titulo_eleitor: pc.titulo_eleitor,
    titulo_eleitor_zona: pc.titulo_zona,
    titulo_eleitor_secao: pc.titulo_secao,
    cnh: pc.cnh_numero,
    cnh_categoria: pc.cnh_categoria,
    cnh_validade: pc.cnh_validade,
    reservista: pc.certificado_reservista,
    
    // Contato
    email: pc.email,
    email_institucional: pc.email,
    telefone_celular: pc.telefone_celular,
    telefone_fixo: pc.telefone_fixo,
    
    // Endereço
    endereco_cep: pc.endereco_cep,
    endereco_logradouro: pc.endereco_logradouro,
    endereco_numero: pc.endereco_numero,
    endereco_complemento: pc.endereco_complemento,
    endereco_bairro: pc.endereco_bairro,
    endereco_cidade: pc.endereco_cidade,
    endereco_uf: pc.endereco_uf,
    
    // Escolaridade
    escolaridade: pc.escolaridade,
    formacao_academica: pc.formacao_academica,
    instituicao_ensino: pc.instituicao_ensino,
    ano_conclusao: pc.ano_conclusao,
    
    // Dados bancários
    banco_codigo: pc.banco_codigo,
    banco_nome: pc.banco_nome,
    banco_agencia: pc.banco_agencia,
    banco_conta: pc.banco_conta,
    banco_tipo_conta: pc.banco_tipo_conta,
    
    // Dados do vínculo
    matricula: extras.matricula,
    tipo_servidor: extras.tipoServidor,
    cargo_atual_id: extras.cargoId || null,
    unidade_atual_id: extras.unidadeId,
    data_admissao: extras.dataAdmissao,
    
    // Status
    situacao: 'ativo',
    ativo: true,
  };
}

export function usePreCadastro(codigoAcesso?: string) {
  const queryClient = useQueryClient();

  // Buscar pré-cadastro pelo código de acesso
  const { data: preCadastro, isLoading } = useQuery({
    queryKey: ['pre-cadastro', codigoAcesso],
    queryFn: async () => {
      if (!codigoAcesso) return null;
      
      const { data, error } = await supabase
        .from('pre_cadastros')
        .select('*')
        .eq('codigo_acesso', codigoAcesso)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      return mapToPreCadastro(data);
    },
    enabled: !!codigoAcesso,
  });

  // Gerar novo código de acesso
  const gerarCodigo = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('gerar_codigo_pre_cadastro');
    if (error) throw error;
    return data as string;
  };

  // Criar novo pré-cadastro
  const criarMutation = useMutation({
    mutationFn: async (dados: Partial<PreCadastro>) => {
      const codigo = await gerarCodigo();
      
      const dbData = mapToDatabase({
        ...dados,
        codigo_acesso: codigo,
        status: 'rascunho',
      });
      
      const { data, error } = await supabase
        .from('pre_cadastros')
        .insert(dbData as any)
        .select()
        .single();
      
      if (error) throw error;
      return mapToPreCadastro(data);
    },
    onSuccess: () => {
      toast.success('Pré-cadastro iniciado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar pré-cadastro: ' + error.message);
    },
  });

  // Atualizar pré-cadastro existente
  const atualizarMutation = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: Partial<PreCadastro> }) => {
      const dbData = mapToDatabase({
        ...dados,
        updated_at: new Date().toISOString(),
      });
      
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapToPreCadastro(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastro'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Enviar pré-cadastro (finalizar)
  const enviarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'enviado',
          data_envio: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapToPreCadastro(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastro'] });
      toast.success('Pré-cadastro enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar: ' + error.message);
    },
  });

  return {
    preCadastro,
    isLoading,
    criar: criarMutation.mutateAsync,
    atualizar: atualizarMutation.mutateAsync,
    enviar: enviarMutation.mutateAsync,
    isSaving: atualizarMutation.isPending,
    isCreating: criarMutation.isPending,
  };
}

// Hook para listar todos os pré-cadastros (admin)
export function usePreCadastros() {
  const queryClient = useQueryClient();

  const { data: preCadastros, isLoading } = useQuery({
    queryKey: ['pre-cadastros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapToPreCadastro);
    },
  });

  // Aprovar pré-cadastro
  const aprovarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'aprovado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapToPreCadastro(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastros'] });
      toast.success('Pré-cadastro aprovado!');
    },
  });

  // Rejeitar pré-cadastro
  const rejeitarMutation = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes?: string }) => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'rejeitado',
          observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapToPreCadastro(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastros'] });
      toast.success('Pré-cadastro rejeitado.');
    },
  });

  // Converter pré-cadastro em servidor
  const converterMutation = useMutation({
    mutationFn: async ({
      preCadastroId,
      tipoServidor,
      cargoId,
      unidadeId,
      dataAdmissao,
    }: {
      preCadastroId: string;
      tipoServidor: TipoServidor;
      cargoId?: string;
      unidadeId: string;
      dataAdmissao: string;
    }) => {
      // 1. Buscar dados do pré-cadastro
      const { data: pcData, error: pcError } = await supabase
        .from('pre_cadastros')
        .select('*')
        .eq('id', preCadastroId)
        .single();
      
      if (pcError) throw pcError;
      const preCadastro = mapToPreCadastro(pcData);
      
      // 2. Verificar se CPF já existe
      const { data: existente } = await supabase
        .from('servidores')
        .select('id')
        .eq('cpf', preCadastro.cpf)
        .maybeSingle();
      
      if (existente) {
        throw new Error('Já existe um servidor cadastrado com este CPF');
      }
      
      // 3. Gerar matrícula
      const matricula = await gerarMatricula();
      
      // 4. Mapear e inserir servidor
      const servidorData = mapPreCadastroToServidor(preCadastro, {
        matricula,
        tipoServidor,
        cargoId,
        unidadeId,
        dataAdmissao,
      });
      
      const { data: novoServidor, error: srvError } = await supabase
        .from('servidores')
        .insert(servidorData as any)
        .select('id')
        .single();
      
      if (srvError) throw srvError;
      
      // 5. Criar lotação inicial
      const { error: lotError } = await supabase
        .from('lotacoes')
        .insert({
          servidor_id: novoServidor.id,
          unidade_id: unidadeId,
          cargo_id: cargoId || null,
          tipo_lotacao: 'lotacao_interna',
          data_inicio: dataAdmissao,
          ativo: true,
        });
      
      if (lotError) {
        console.error('Erro ao criar lotação:', lotError);
        // Não interromper o fluxo
      }
      
      // 6. Atualizar pré-cadastro com referência ao servidor
      const { error: updateError } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'convertido',
          servidor_id: novoServidor.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preCadastroId);
      
      if (updateError) {
        console.error('Erro ao atualizar pré-cadastro:', updateError);
      }
      
      return { servidorId: novoServidor.id, matricula };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastros'] });
      queryClient.invalidateQueries({ queryKey: ['servidores'] });
      toast.success(`Servidor criado com matrícula ${data.matricula}!`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao converter: ' + error.message);
    },
  });

  return {
    preCadastros,
    isLoading,
    aprovar: aprovarMutation.mutateAsync,
    rejeitar: rejeitarMutation.mutateAsync,
    converter: converterMutation.mutateAsync,
    isConverting: converterMutation.isPending,
  };
}
