import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ServidorExistente {
  id: string;
  nome: string;
  matricula: string;
  situacao: string;
}

interface PreCadastroExistente {
  id: string;
  nome: string;
  status: string;
  codigo: string;
}

interface ResultadoVerificacao {
  existeServidor: boolean;
  existePreCadastro: boolean;
  servidor?: ServidorExistente;
  preCadastro?: PreCadastroExistente;
}

export function useVerificarCpf() {
  const [isVerificando, setIsVerificando] = useState(false);

  const verificar = async (cpf: string, codigoAtual?: string): Promise<ResultadoVerificacao> => {
    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      return { existeServidor: false, existePreCadastro: false };
    }

    setIsVerificando(true);

    try {
      // Verificar na tabela servidores
      const { data: servidorData } = await supabase
        .from('servidores')
        .select('id, nome_completo, matricula, situacao')
        .eq('cpf', cpf)
        .maybeSingle();

      // Verificar na tabela pre_cadastros (exceto o código atual se estiver editando)
      let query = supabase
        .from('pre_cadastros')
        .select('id, nome_completo, status, codigo_acesso')
        .eq('cpf', cpf)
        .neq('status', 'convertido'); // Ignora os já convertidos

      if (codigoAtual) {
        query = query.neq('codigo_acesso', codigoAtual);
      }

      const { data: preCadastroData } = await query.maybeSingle();

      return {
        existeServidor: !!servidorData,
        existePreCadastro: !!preCadastroData,
        servidor: servidorData ? {
          id: servidorData.id,
          nome: servidorData.nome_completo,
          matricula: servidorData.matricula,
          situacao: servidorData.situacao,
        } : undefined,
        preCadastro: preCadastroData ? {
          id: preCadastroData.id,
          nome: preCadastroData.nome_completo,
          status: preCadastroData.status,
          codigo: preCadastroData.codigo_acesso,
        } : undefined,
      };
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return { existeServidor: false, existePreCadastro: false };
    } finally {
      setIsVerificando(false);
    }
  };

  return { verificar, isVerificando };
}
