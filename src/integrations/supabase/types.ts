export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acesso_processo_sigiloso: {
        Row: {
          concedido_por: string | null
          created_at: string
          id: string
          motivo: string | null
          nivel_acesso: string
          processo_id: string
          usuario_id: string
        }
        Insert: {
          concedido_por?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          nivel_acesso?: string
          processo_id: string
          usuario_id: string
        }
        Update: {
          concedido_por?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          nivel_acesso?: string
          processo_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acesso_processo_sigiloso_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_administrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acesso_processo_sigiloso_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "v_processos_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      acoes: {
        Row: {
          codigo: string
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          meta_financeira: number | null
          meta_fisica: number | null
          nome: string
          processo_licitatorio_id: string | null
          programa_id: string
          situacao: string | null
          tipo: string | null
          unidade_medida: string | null
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          meta_financeira?: number | null
          meta_fisica?: number | null
          nome: string
          processo_licitatorio_id?: string | null
          programa_id: string
          situacao?: string | null
          tipo?: string | null
          unidade_medida?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          meta_financeira?: number | null
          meta_fisica?: number | null
          nome?: string
          processo_licitatorio_id?: string | null
          programa_id?: string
          situacao?: string | null
          tipo?: string | null
          unidade_medida?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acoes_processo_licitatorio_id_fkey"
            columns: ["processo_licitatorio_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
      aditivos_contrato: {
        Row: {
          contrato_id: string
          created_at: string | null
          created_by: string | null
          data_assinatura: string
          data_publicacao_doe: string | null
          fundamentacao_legal: string | null
          id: string
          justificativa: string | null
          nova_data_fim: string | null
          numero_aditivo: number
          numero_doe: string | null
          objeto: string
          prazo_adicional_dias: number | null
          tipo: Database["public"]["Enums"]["tipo_aditivo"]
          valor_acrescimo: number | null
          valor_supressao: number | null
        }
        Insert: {
          contrato_id: string
          created_at?: string | null
          created_by?: string | null
          data_assinatura: string
          data_publicacao_doe?: string | null
          fundamentacao_legal?: string | null
          id?: string
          justificativa?: string | null
          nova_data_fim?: string | null
          numero_aditivo: number
          numero_doe?: string | null
          objeto: string
          prazo_adicional_dias?: number | null
          tipo: Database["public"]["Enums"]["tipo_aditivo"]
          valor_acrescimo?: number | null
          valor_supressao?: number | null
        }
        Update: {
          contrato_id?: string
          created_at?: string | null
          created_by?: string | null
          data_assinatura?: string
          data_publicacao_doe?: string | null
          fundamentacao_legal?: string | null
          id?: string
          justificativa?: string | null
          nova_data_fim?: string | null
          numero_aditivo?: number
          numero_doe?: string | null
          objeto?: string
          prazo_adicional_dias?: number | null
          tipo?: Database["public"]["Enums"]["tipo_aditivo"]
          valor_acrescimo?: number | null
          valor_supressao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aditivos_contrato_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_unidade: {
        Row: {
          ano_vigencia: number | null
          aprovador_id: string | null
          area_utilizada: string | null
          created_at: string | null
          created_by: string | null
          data_aprovacao: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          documentos_anexos: Json | null
          encerrado_automaticamente: boolean | null
          espaco_especifico: string | null
          finalidade_detalhada: string | null
          historico_status: Json | null
          horario_diario: string | null
          id: string
          motivo_rejeicao: string | null
          numero_protocolo: string | null
          observacoes: string | null
          publico_estimado: number | null
          responsavel_legal: string | null
          responsavel_legal_documento: string | null
          solicitante_cnpj: string | null
          solicitante_documento: string | null
          solicitante_email: string | null
          solicitante_endereco: string | null
          solicitante_nome: string
          solicitante_razao_social: string | null
          solicitante_telefone: string | null
          status: Database["public"]["Enums"]["status_agenda"]
          tipo_solicitante: string | null
          tipo_uso: string
          titulo: string
          unidade_local_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ano_vigencia?: number | null
          aprovador_id?: string | null
          area_utilizada?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          documentos_anexos?: Json | null
          encerrado_automaticamente?: boolean | null
          espaco_especifico?: string | null
          finalidade_detalhada?: string | null
          historico_status?: Json | null
          horario_diario?: string | null
          id?: string
          motivo_rejeicao?: string | null
          numero_protocolo?: string | null
          observacoes?: string | null
          publico_estimado?: number | null
          responsavel_legal?: string | null
          responsavel_legal_documento?: string | null
          solicitante_cnpj?: string | null
          solicitante_documento?: string | null
          solicitante_email?: string | null
          solicitante_endereco?: string | null
          solicitante_nome: string
          solicitante_razao_social?: string | null
          solicitante_telefone?: string | null
          status?: Database["public"]["Enums"]["status_agenda"]
          tipo_solicitante?: string | null
          tipo_uso: string
          titulo: string
          unidade_local_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ano_vigencia?: number | null
          aprovador_id?: string | null
          area_utilizada?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          documentos_anexos?: Json | null
          encerrado_automaticamente?: boolean | null
          espaco_especifico?: string | null
          finalidade_detalhada?: string | null
          historico_status?: Json | null
          horario_diario?: string | null
          id?: string
          motivo_rejeicao?: string | null
          numero_protocolo?: string | null
          observacoes?: string | null
          publico_estimado?: number | null
          responsavel_legal?: string | null
          responsavel_legal_documento?: string | null
          solicitante_cnpj?: string | null
          solicitante_documento?: string | null
          solicitante_email?: string | null
          solicitante_endereco?: string | null
          solicitante_nome?: string
          solicitante_razao_social?: string | null
          solicitante_telefone?: string | null
          status?: Database["public"]["Enums"]["status_agenda"]
          tipo_solicitante?: string | null
          tipo_uso?: string
          titulo?: string
          unidade_local_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_unidade_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_unidade_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "agenda_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "agenda_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      agrupamento_unidade_vinculo: {
        Row: {
          agrupamento_id: string
          created_at: string | null
          id: string
          ordem: number | null
          unidade_id: string
        }
        Insert: {
          agrupamento_id: string
          created_at?: string | null
          id?: string
          ordem?: number | null
          unidade_id: string
        }
        Update: {
          agrupamento_id?: string
          created_at?: string | null
          id?: string
          ordem?: number | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrupamento_unidade_vinculo_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "config_agrupamento_unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agrupamento_unidade_vinculo_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      almoxarifados: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          id: string
          localizacao: string | null
          nome: string
          responsavel_id: string | null
          unidade_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          responsavel_id?: string | null
          unidade_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          responsavel_id?: string | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almoxarifados_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almoxarifados_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almoxarifados_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_delegations: {
        Row: {
          created_at: string | null
          created_by: string | null
          delegate_id: string
          delegator_id: string
          id: string
          is_active: boolean | null
          module_name: string | null
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delegate_id: string
          delegator_id: string
          id?: string
          is_active?: boolean | null
          module_name?: string | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string
          delegator_id?: string
          id?: string
          is_active?: boolean | null
          module_name?: string | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          approved_at: string | null
          approver_decision: string | null
          approver_id: string | null
          attachments: Json | null
          created_at: string | null
          due_date: string | null
          electronic_signature: Json | null
          entity_id: string
          entity_type: string
          id: string
          justification: string | null
          module_name: string
          priority: string | null
          requester_id: string
          requester_org_unit_id: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          status_history: Json | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approver_decision?: string | null
          approver_id?: string | null
          attachments?: Json | null
          created_at?: string | null
          due_date?: string | null
          electronic_signature?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          justification?: string | null
          module_name: string
          priority?: string | null
          requester_id: string
          requester_org_unit_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          status_history?: Json | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approver_decision?: string | null
          approver_id?: string | null
          attachments?: Json | null
          created_at?: string | null
          due_date?: string | null
          electronic_signature?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          justification?: string | null
          module_name?: string
          priority?: string | null
          requester_id?: string
          requester_org_unit_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          status_history?: Json | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_requester_org_unit_id_fkey"
            columns: ["requester_org_unit_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      atas_registro_preco: {
        Row: {
          ano: number
          created_at: string | null
          created_by: string | null
          data_assinatura: string
          data_publicacao_doe: string | null
          data_vigencia_fim: string
          data_vigencia_inicio: string
          fornecedor_id: string
          fundamentacao_legal: string | null
          id: string
          numero_ata: string
          numero_doe: string | null
          objeto: string
          observacoes: string | null
          orgao_gerenciador: string | null
          processo_id: string
          saldo_disponivel: number | null
          situacao: string | null
          updated_at: string | null
          valor_total_registrado: number
        }
        Insert: {
          ano: number
          created_at?: string | null
          created_by?: string | null
          data_assinatura: string
          data_publicacao_doe?: string | null
          data_vigencia_fim: string
          data_vigencia_inicio: string
          fornecedor_id: string
          fundamentacao_legal?: string | null
          id?: string
          numero_ata: string
          numero_doe?: string | null
          objeto: string
          observacoes?: string | null
          orgao_gerenciador?: string | null
          processo_id: string
          saldo_disponivel?: number | null
          situacao?: string | null
          updated_at?: string | null
          valor_total_registrado: number
        }
        Update: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          data_assinatura?: string
          data_publicacao_doe?: string | null
          data_vigencia_fim?: string
          data_vigencia_inicio?: string
          fornecedor_id?: string
          fundamentacao_legal?: string | null
          id?: string
          numero_ata?: string
          numero_doe?: string | null
          objeto?: string
          observacoes?: string | null
          orgao_gerenciador?: string | null
          processo_id?: string
          saldo_disponivel?: number | null
          situacao?: string | null
          updated_at?: string | null
          valor_total_registrado?: number
        }
        Relationships: [
          {
            foreignKeyName: "atas_registro_preco_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atas_registro_preco_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log_licitacoes: {
        Row: {
          acao: string
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: unknown
          motivo: string | null
          registro_id: string
          tabela_origem: string
          user_agent: string | null
          usuario_id: string | null
          usuario_nome: string | null
          usuario_perfil: string | null
        }
        Insert: {
          acao: string
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown
          motivo?: string | null
          registro_id: string
          tabela_origem: string
          user_agent?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          usuario_perfil?: string | null
        }
        Update: {
          acao?: string
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown
          motivo?: string | null
          registro_id?: string
          tabela_origem?: string
          user_agent?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          usuario_perfil?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          after_data: Json | null
          before_data: Json | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          module_name: string | null
          org_unit_id: string | null
          role_at_time: Database["public"]["Enums"]["app_role"] | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          after_data?: Json | null
          before_data?: Json | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          module_name?: string | null
          org_unit_id?: string | null
          role_at_time?: Database["public"]["Enums"]["app_role"] | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          after_data?: Json | null
          before_data?: Json | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          module_name?: string | null
          org_unit_id?: string | null
          role_at_time?: Database["public"]["Enums"]["app_role"] | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_controle: {
        Row: {
          avaliador_id: string | null
          conformidade_procedimento: boolean | null
          controle_id: string
          created_at: string
          created_by: string | null
          data_avaliacao: string
          efetividade: string
          id: string
          periodo_referencia: string | null
          pontos_atencao: string | null
          recomendacoes: string | null
          status_execucao: string
          updated_at: string
          valor_indicador: string | null
        }
        Insert: {
          avaliador_id?: string | null
          conformidade_procedimento?: boolean | null
          controle_id: string
          created_at?: string
          created_by?: string | null
          data_avaliacao?: string
          efetividade: string
          id?: string
          periodo_referencia?: string | null
          pontos_atencao?: string | null
          recomendacoes?: string | null
          status_execucao: string
          updated_at?: string
          valor_indicador?: string | null
        }
        Update: {
          avaliador_id?: string | null
          conformidade_procedimento?: boolean | null
          controle_id?: string
          created_at?: string
          created_by?: string | null
          data_avaliacao?: string
          efetividade?: string
          id?: string
          periodo_referencia?: string | null
          pontos_atencao?: string | null
          recomendacoes?: string | null
          status_execucao?: string
          updated_at?: string
          valor_indicador?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_controle_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_controle_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_controle_controle_id_fkey"
            columns: ["controle_id"]
            isOneToOne: false
            referencedRelation: "controles_internos"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_risco: {
        Row: {
          avaliador_id: string | null
          created_at: string
          created_by: string | null
          data_avaliacao: string
          efetividade_controles: string | null
          id: string
          impacto_avaliado: Database["public"]["Enums"]["nivel_risco"]
          nivel_risco_avaliado: Database["public"]["Enums"]["nivel_risco"]
          observacoes: string | null
          probabilidade_avaliada: Database["public"]["Enums"]["nivel_risco"]
          recomendacoes: string | null
          risco_id: string
          updated_at: string
        }
        Insert: {
          avaliador_id?: string | null
          created_at?: string
          created_by?: string | null
          data_avaliacao?: string
          efetividade_controles?: string | null
          id?: string
          impacto_avaliado: Database["public"]["Enums"]["nivel_risco"]
          nivel_risco_avaliado: Database["public"]["Enums"]["nivel_risco"]
          observacoes?: string | null
          probabilidade_avaliada: Database["public"]["Enums"]["nivel_risco"]
          recomendacoes?: string | null
          risco_id: string
          updated_at?: string
        }
        Update: {
          avaliador_id?: string | null
          created_at?: string
          created_by?: string | null
          data_avaliacao?: string
          efetividade_controles?: string | null
          id?: string
          impacto_avaliado?: Database["public"]["Enums"]["nivel_risco"]
          nivel_risco_avaliado?: Database["public"]["Enums"]["nivel_risco"]
          observacoes?: string | null
          probabilidade_avaliada?: Database["public"]["Enums"]["nivel_risco"]
          recomendacoes?: string | null
          risco_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_risco_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_risco_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_risco_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos_institucionais"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_config: {
        Row: {
          buckets_included: string[] | null
          created_at: string | null
          enabled: boolean | null
          encryption_enabled: boolean | null
          id: string
          last_backup_at: string | null
          last_backup_status:
            | Database["public"]["Enums"]["backup_status"]
            | null
          retention_daily: number | null
          retention_monthly: number | null
          retention_weekly: number | null
          schedule_cron: string | null
          updated_at: string | null
          weekly_day: number | null
        }
        Insert: {
          buckets_included?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          encryption_enabled?: boolean | null
          id?: string
          last_backup_at?: string | null
          last_backup_status?:
            | Database["public"]["Enums"]["backup_status"]
            | null
          retention_daily?: number | null
          retention_monthly?: number | null
          retention_weekly?: number | null
          schedule_cron?: string | null
          updated_at?: string | null
          weekly_day?: number | null
        }
        Update: {
          buckets_included?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          encryption_enabled?: boolean | null
          id?: string
          last_backup_at?: string | null
          last_backup_status?:
            | Database["public"]["Enums"]["backup_status"]
            | null
          retention_daily?: number | null
          retention_monthly?: number | null
          retention_weekly?: number | null
          schedule_cron?: string | null
          updated_at?: string | null
          weekly_day?: number | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_type: Database["public"]["Enums"]["backup_type"]
          completed_at: string | null
          created_at: string | null
          db_checksum: string | null
          db_file_path: string | null
          db_file_size: number | null
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          manifest_checksum: string | null
          manifest_path: string | null
          metadata: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["backup_status"] | null
          storage_checksum: string | null
          storage_file_path: string | null
          storage_file_size: number | null
          storage_objects_count: number | null
          system_version: string | null
          total_size: number | null
          trigger_mode: string | null
          triggered_by: string | null
        }
        Insert: {
          backup_type: Database["public"]["Enums"]["backup_type"]
          completed_at?: string | null
          created_at?: string | null
          db_checksum?: string | null
          db_file_path?: string | null
          db_file_size?: number | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          manifest_checksum?: string | null
          manifest_path?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"] | null
          storage_checksum?: string | null
          storage_file_path?: string | null
          storage_file_size?: number | null
          storage_objects_count?: number | null
          system_version?: string | null
          total_size?: number | null
          trigger_mode?: string | null
          triggered_by?: string | null
        }
        Update: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          completed_at?: string | null
          created_at?: string | null
          db_checksum?: string | null
          db_file_path?: string | null
          db_file_size?: number | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          manifest_checksum?: string | null
          manifest_path?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"] | null
          storage_checksum?: string | null
          storage_file_path?: string | null
          storage_file_size?: number | null
          storage_objects_count?: number | null
          system_version?: string | null
          total_size?: number | null
          trigger_mode?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      backup_integrity_checks: {
        Row: {
          backup_id: string | null
          checked_at: string | null
          checked_by: string | null
          created_at: string | null
          db_checksum_valid: boolean | null
          details: Json | null
          id: string
          is_valid: boolean | null
          manifest_valid: boolean | null
          storage_checksum_valid: boolean | null
        }
        Insert: {
          backup_id?: string | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string | null
          db_checksum_valid?: boolean | null
          details?: Json | null
          id?: string
          is_valid?: boolean | null
          manifest_valid?: boolean | null
          storage_checksum_valid?: boolean | null
        }
        Update: {
          backup_id?: string | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string | null
          db_checksum_valid?: boolean | null
          details?: Json | null
          id?: string
          is_valid?: boolean | null
          manifest_valid?: boolean | null
          storage_checksum_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_integrity_checks_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "backup_history"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_horas: {
        Row: {
          ano: number
          created_at: string | null
          horas_compensadas: number | null
          horas_extras: number | null
          id: string
          mes: number
          saldo_anterior: number | null
          saldo_atual: number | null
          servidor_id: string
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          horas_compensadas?: number | null
          horas_extras?: number | null
          id?: string
          mes: number
          saldo_anterior?: number | null
          saldo_atual?: number | null
          servidor_id: string
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          horas_compensadas?: number | null
          horas_extras?: number | null
          id?: string
          mes?: number
          saldo_anterior?: number | null
          saldo_atual?: number | null
          servidor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banco_horas_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_horas_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      bancos_cnab: {
        Row: {
          ativo: boolean | null
          codigo_banco: string
          configuracao_cnab240: Json | null
          configuracao_cnab400: Json | null
          created_at: string | null
          id: string
          layout_cnab240: boolean | null
          layout_cnab400: boolean | null
          nome: string
          nome_reduzido: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_banco: string
          configuracao_cnab240?: Json | null
          configuracao_cnab400?: Json | null
          created_at?: string | null
          id?: string
          layout_cnab240?: boolean | null
          layout_cnab400?: boolean | null
          nome: string
          nome_reduzido?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_banco?: string
          configuracao_cnab240?: Json | null
          configuracao_cnab400?: Json | null
          created_at?: string | null
          id?: string
          layout_cnab240?: boolean | null
          layout_cnab400?: boolean | null
          nome?: string
          nome_reduzido?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bens_patrimoniais: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_aquisicao: string
          depreciacao_acumulada: number | null
          descricao: string
          empenho_id: string | null
          especificacao: string | null
          estado_conservacao: string | null
          fornecedor_id: string | null
          garantia_ate: string | null
          id: string
          item_id: string | null
          localizacao_especifica: string | null
          marca: string | null
          modelo: string | null
          nota_fiscal: string | null
          numero_patrimonio: string
          numero_serie: string | null
          observacao: string | null
          responsavel_id: string | null
          situacao: string | null
          unidade_id: string | null
          unidade_local_id: string | null
          updated_at: string | null
          valor_aquisicao: number
          valor_liquido: number | null
          valor_residual: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_aquisicao: string
          depreciacao_acumulada?: number | null
          descricao: string
          empenho_id?: string | null
          especificacao?: string | null
          estado_conservacao?: string | null
          fornecedor_id?: string | null
          garantia_ate?: string | null
          id?: string
          item_id?: string | null
          localizacao_especifica?: string | null
          marca?: string | null
          modelo?: string | null
          nota_fiscal?: string | null
          numero_patrimonio: string
          numero_serie?: string | null
          observacao?: string | null
          responsavel_id?: string | null
          situacao?: string | null
          unidade_id?: string | null
          unidade_local_id?: string | null
          updated_at?: string | null
          valor_aquisicao: number
          valor_liquido?: number | null
          valor_residual?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_aquisicao?: string
          depreciacao_acumulada?: number | null
          descricao?: string
          empenho_id?: string | null
          especificacao?: string | null
          estado_conservacao?: string | null
          fornecedor_id?: string | null
          garantia_ate?: string | null
          id?: string
          item_id?: string | null
          localizacao_especifica?: string | null
          marca?: string | null
          modelo?: string | null
          nota_fiscal?: string | null
          numero_patrimonio?: string
          numero_serie?: string | null
          observacao?: string | null
          responsavel_id?: string | null
          situacao?: string | null
          unidade_id?: string | null
          unidade_local_id?: string | null
          updated_at?: string | null
          valor_aquisicao?: number
          valor_liquido?: number | null
          valor_residual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bens_patrimoniais_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "empenhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_material"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      calendario_federacao: {
        Row: {
          categorias: string | null
          cidade: string | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          federacao_id: string
          id: string
          local: string | null
          observacoes: string | null
          publico_estimado: number | null
          status: string
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          categorias?: string | null
          cidade?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          federacao_id: string
          id?: string
          local?: string | null
          observacoes?: string | null
          publico_estimado?: number | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          categorias?: string | null
          cidade?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          federacao_id?: string
          id?: string
          local?: string | null
          observacoes?: string | null
          publico_estimado?: number | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendario_federacao_federacao_id_fkey"
            columns: ["federacao_id"]
            isOneToOne: false
            referencedRelation: "federacoes_esportivas"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_unidade_compatibilidade: {
        Row: {
          cargo_id: string | null
          created_at: string | null
          id: string
          observacao: string | null
          quantidade_maxima: number | null
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade"] | null
          unidade_especifica_id: string | null
        }
        Insert: {
          cargo_id?: string | null
          created_at?: string | null
          id?: string
          observacao?: string | null
          quantidade_maxima?: number | null
          tipo_unidade?: Database["public"]["Enums"]["tipo_unidade"] | null
          unidade_especifica_id?: string | null
        }
        Update: {
          cargo_id?: string | null
          created_at?: string | null
          id?: string
          observacao?: string | null
          quantidade_maxima?: number | null
          tipo_unidade?: Database["public"]["Enums"]["tipo_unidade"] | null
          unidade_especifica_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargo_unidade_compatibilidade_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_unidade_compatibilidade_unidade_especifica_id_fkey"
            columns: ["unidade_especifica_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          ativo: boolean | null
          atribuicoes: string | null
          categoria: Database["public"]["Enums"]["categoria_cargo"]
          cbo: string | null
          competencias: string[] | null
          conhecimentos_necessarios: string[] | null
          created_at: string | null
          escolaridade: string | null
          experiencia_exigida: string | null
          id: string
          lei_criacao_artigo: string | null
          lei_criacao_data: string | null
          lei_criacao_numero: string | null
          lei_documento_url: string | null
          natureza: Database["public"]["Enums"]["natureza_cargo"] | null
          nivel_hierarquico: number | null
          nome: string
          quantidade_vagas: number | null
          requisitos: string[] | null
          responsabilidades: string[] | null
          sigla: string | null
          updated_at: string | null
          vencimento_base: number | null
        }
        Insert: {
          ativo?: boolean | null
          atribuicoes?: string | null
          categoria: Database["public"]["Enums"]["categoria_cargo"]
          cbo?: string | null
          competencias?: string[] | null
          conhecimentos_necessarios?: string[] | null
          created_at?: string | null
          escolaridade?: string | null
          experiencia_exigida?: string | null
          id?: string
          lei_criacao_artigo?: string | null
          lei_criacao_data?: string | null
          lei_criacao_numero?: string | null
          lei_documento_url?: string | null
          natureza?: Database["public"]["Enums"]["natureza_cargo"] | null
          nivel_hierarquico?: number | null
          nome: string
          quantidade_vagas?: number | null
          requisitos?: string[] | null
          responsabilidades?: string[] | null
          sigla?: string | null
          updated_at?: string | null
          vencimento_base?: number | null
        }
        Update: {
          ativo?: boolean | null
          atribuicoes?: string | null
          categoria?: Database["public"]["Enums"]["categoria_cargo"]
          cbo?: string | null
          competencias?: string[] | null
          conhecimentos_necessarios?: string[] | null
          created_at?: string | null
          escolaridade?: string | null
          experiencia_exigida?: string | null
          id?: string
          lei_criacao_artigo?: string | null
          lei_criacao_data?: string | null
          lei_criacao_numero?: string | null
          lei_documento_url?: string | null
          natureza?: Database["public"]["Enums"]["natureza_cargo"] | null
          nivel_hierarquico?: number | null
          nome?: string
          quantidade_vagas?: number | null
          requisitos?: string[] | null
          responsabilidades?: string[] | null
          sigla?: string | null
          updated_at?: string | null
          vencimento_base?: number | null
        }
        Relationships: []
      }
      categorias_material: {
        Row: {
          ativo: boolean | null
          codigo: string
          conta_contabil: string | null
          created_at: string | null
          depreciavel: boolean | null
          id: string
          nome: string
          taxa_depreciacao_anual: number | null
          tipo: string | null
          vida_util_meses: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          conta_contabil?: string | null
          created_at?: string | null
          depreciavel?: boolean | null
          id?: string
          nome: string
          taxa_depreciacao_anual?: number | null
          tipo?: string | null
          vida_util_meses?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          conta_contabil?: string | null
          created_at?: string | null
          depreciavel?: boolean | null
          id?: string
          nome?: string
          taxa_depreciacao_anual?: number | null
          tipo?: string | null
          vida_util_meses?: number | null
        }
        Relationships: []
      }
      centros_custo: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          descricao: string
          elemento_despesa: string | null
          fonte_recurso: string | null
          id: string
          natureza_despesa: string | null
          programa_trabalho: string | null
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          descricao: string
          elemento_despesa?: string | null
          fonte_recurso?: string | null
          id?: string
          natureza_despesa?: string | null
          programa_trabalho?: string | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          elemento_despesa?: string | null
          fonte_recurso?: string | null
          id?: string
          natureza_despesa?: string | null
          programa_trabalho?: string | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      cessoes: {
        Row: {
          ativa: boolean | null
          ato_data: string | null
          ato_doe_data: string | null
          ato_doe_numero: string | null
          ato_numero: string | null
          ato_retorno_data: string | null
          ato_retorno_numero: string | null
          ato_tipo: string | null
          ato_url: string | null
          cargo_destino: string | null
          cargo_origem: string | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          data_retorno: string | null
          funcao_exercida_idjuv: string | null
          fundamentacao_legal: string | null
          id: string
          observacoes: string | null
          onus: string | null
          orgao_destino: string | null
          orgao_origem: string | null
          servidor_id: string
          tipo: string
          unidade_idjuv_id: string | null
          updated_at: string | null
          updated_by: string | null
          vinculo_origem: string | null
        }
        Insert: {
          ativa?: boolean | null
          ato_data?: string | null
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_numero?: string | null
          ato_retorno_data?: string | null
          ato_retorno_numero?: string | null
          ato_tipo?: string | null
          ato_url?: string | null
          cargo_destino?: string | null
          cargo_origem?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          data_retorno?: string | null
          funcao_exercida_idjuv?: string | null
          fundamentacao_legal?: string | null
          id?: string
          observacoes?: string | null
          onus?: string | null
          orgao_destino?: string | null
          orgao_origem?: string | null
          servidor_id: string
          tipo: string
          unidade_idjuv_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vinculo_origem?: string | null
        }
        Update: {
          ativa?: boolean | null
          ato_data?: string | null
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_numero?: string | null
          ato_retorno_data?: string | null
          ato_retorno_numero?: string | null
          ato_tipo?: string | null
          ato_url?: string | null
          cargo_destino?: string | null
          cargo_origem?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_retorno?: string | null
          funcao_exercida_idjuv?: string | null
          fundamentacao_legal?: string | null
          id?: string
          observacoes?: string | null
          onus?: string | null
          orgao_destino?: string | null
          orgao_origem?: string | null
          servidor_id?: string
          tipo?: string
          unidade_idjuv_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vinculo_origem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cessoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cessoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cessoes_unidade_idjuv_id_fkey"
            columns: ["unidade_idjuv_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists_conformidade: {
        Row: {
          ativo: boolean
          base_legal: string | null
          codigo: string
          created_at: string
          created_by: string | null
          data_vigencia_fim: string | null
          data_vigencia_inicio: string | null
          descricao: string | null
          exercicio: number
          id: string
          nome: string
          orgao_fiscalizador: string
          updated_at: string
          updated_by: string | null
          versao: number
        }
        Insert: {
          ativo?: boolean
          base_legal?: string | null
          codigo: string
          created_at?: string
          created_by?: string | null
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          descricao?: string | null
          exercicio: number
          id?: string
          nome: string
          orgao_fiscalizador: string
          updated_at?: string
          updated_by?: string | null
          versao?: number
        }
        Update: {
          ativo?: boolean
          base_legal?: string | null
          codigo?: string
          created_at?: string
          created_by?: string | null
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          descricao?: string | null
          exercicio?: number
          id?: string
          nome?: string
          orgao_fiscalizador?: string
          updated_at?: string
          updated_by?: string | null
          versao?: number
        }
        Relationships: []
      }
      composicao_cargos: {
        Row: {
          cargo_id: string
          created_at: string | null
          id: string
          quantidade_vagas: number | null
          unidade_id: string
        }
        Insert: {
          cargo_id: string
          created_at?: string | null
          id?: string
          quantidade_vagas?: number | null
          unidade_id: string
        }
        Update: {
          cargo_id?: string
          created_at?: string | null
          id?: string
          quantidade_vagas?: number | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "composicao_cargos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "composicao_cargos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_agrupamento_unidades: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      config_assinatura_frequencia: {
        Row: {
          assinatura_chefia_obrigatoria: boolean | null
          assinatura_rh_obrigatoria: boolean | null
          assinatura_servidor_obrigatoria: boolean | null
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          ordem_assinaturas: string[] | null
          padrao: boolean | null
          quem_valida_final: string | null
          texto_declaracao: string | null
          tipo_assinatura: string | null
          updated_at: string | null
        }
        Insert: {
          assinatura_chefia_obrigatoria?: boolean | null
          assinatura_rh_obrigatoria?: boolean | null
          assinatura_servidor_obrigatoria?: boolean | null
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          ordem_assinaturas?: string[] | null
          padrao?: boolean | null
          quem_valida_final?: string | null
          texto_declaracao?: string | null
          tipo_assinatura?: string | null
          updated_at?: string | null
        }
        Update: {
          assinatura_chefia_obrigatoria?: boolean | null
          assinatura_rh_obrigatoria?: boolean | null
          assinatura_servidor_obrigatoria?: boolean | null
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          ordem_assinaturas?: string[] | null
          padrao?: boolean | null
          quem_valida_final?: string | null
          texto_declaracao?: string | null
          tipo_assinatura?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      config_assinatura_reuniao: {
        Row: {
          ativo: boolean | null
          cargo_assinante_1: string | null
          cargo_assinante_2: string | null
          created_at: string | null
          id: string
          nome_assinante_1: string | null
          nome_assinante_2: string | null
          nome_configuracao: string
          padrao: boolean | null
          texto_cabecalho: string | null
          texto_rodape: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo_assinante_1?: string | null
          cargo_assinante_2?: string | null
          created_at?: string | null
          id?: string
          nome_assinante_1?: string | null
          nome_assinante_2?: string | null
          nome_configuracao: string
          padrao?: boolean | null
          texto_cabecalho?: string | null
          texto_rodape?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo_assinante_1?: string | null
          cargo_assinante_2?: string | null
          created_at?: string | null
          id?: string
          nome_assinante_1?: string | null
          nome_assinante_2?: string | null
          nome_configuracao?: string
          padrao?: boolean | null
          texto_cabecalho?: string | null
          texto_rodape?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      config_autarquia: {
        Row: {
          ativo: boolean | null
          cargo_responsavel: string | null
          cnpj: string
          codigo_municipio: string | null
          cpf_contabil: string | null
          cpf_responsavel: string | null
          crc_contabil: string | null
          created_at: string | null
          created_by: string | null
          email_institucional: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          esocial_ambiente: string | null
          esocial_processo_emissao: string | null
          id: string
          natureza_juridica: string | null
          nome_fantasia: string | null
          razao_social: string
          regime_tributario: string | null
          responsavel_contabil: string | null
          responsavel_legal: string | null
          site: string | null
          telefone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo_responsavel?: string | null
          cnpj: string
          codigo_municipio?: string | null
          cpf_contabil?: string | null
          cpf_responsavel?: string | null
          crc_contabil?: string | null
          created_at?: string | null
          created_by?: string | null
          email_institucional?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          esocial_ambiente?: string | null
          esocial_processo_emissao?: string | null
          id?: string
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          razao_social: string
          regime_tributario?: string | null
          responsavel_contabil?: string | null
          responsavel_legal?: string | null
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo_responsavel?: string | null
          cnpj?: string
          codigo_municipio?: string | null
          cpf_contabil?: string | null
          cpf_responsavel?: string | null
          crc_contabil?: string | null
          created_at?: string | null
          created_by?: string | null
          email_institucional?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          esocial_ambiente?: string | null
          esocial_processo_emissao?: string | null
          id?: string
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          regime_tributario?: string | null
          responsavel_contabil?: string | null
          responsavel_legal?: string | null
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_autarquia_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_autarquia_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_autarquia_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_autarquia_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      config_compensacao: {
        Row: {
          aplicar_a_todos: boolean | null
          ativo: boolean | null
          compensacao_automatica: boolean | null
          compensacao_manual: boolean | null
          created_at: string | null
          created_by: string | null
          exibe_na_frequencia: boolean | null
          exibe_na_impressao: boolean | null
          id: string
          limite_acumulo_horas: number | null
          limite_horas_extras_dia: number | null
          limite_horas_extras_mes: number | null
          nome: string
          padrao: boolean | null
          permite_banco_horas: boolean | null
          prazo_compensar_dias: number | null
          quem_autoriza: string | null
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          aplicar_a_todos?: boolean | null
          ativo?: boolean | null
          compensacao_automatica?: boolean | null
          compensacao_manual?: boolean | null
          created_at?: string | null
          created_by?: string | null
          exibe_na_frequencia?: boolean | null
          exibe_na_impressao?: boolean | null
          id?: string
          limite_acumulo_horas?: number | null
          limite_horas_extras_dia?: number | null
          limite_horas_extras_mes?: number | null
          nome: string
          padrao?: boolean | null
          permite_banco_horas?: boolean | null
          prazo_compensar_dias?: number | null
          quem_autoriza?: string | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aplicar_a_todos?: boolean | null
          ativo?: boolean | null
          compensacao_automatica?: boolean | null
          compensacao_manual?: boolean | null
          created_at?: string | null
          created_by?: string | null
          exibe_na_frequencia?: boolean | null
          exibe_na_impressao?: boolean | null
          id?: string
          limite_acumulo_horas?: number | null
          limite_horas_extras_dia?: number | null
          limite_horas_extras_mes?: number | null
          nome?: string
          padrao?: boolean | null
          permite_banco_horas?: boolean | null
          prazo_compensar_dias?: number | null
          quem_autoriza?: string | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_compensacao_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_fechamento_frequencia: {
        Row: {
          ano: number
          chefia_pode_fechar: boolean | null
          consolidado_em: string | null
          consolidado_por: string | null
          created_at: string | null
          data_limite_chefia: string | null
          data_limite_rh: string | null
          data_limite_servidor: string | null
          fechado_em: string | null
          fechado_por: string | null
          id: string
          mes: number
          permite_reabertura: boolean | null
          prazo_reabertura_dias: number | null
          reabertura_exige_justificativa: boolean | null
          rh_pode_fechar: boolean | null
          servidor_pode_fechar: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          chefia_pode_fechar?: boolean | null
          consolidado_em?: string | null
          consolidado_por?: string | null
          created_at?: string | null
          data_limite_chefia?: string | null
          data_limite_rh?: string | null
          data_limite_servidor?: string | null
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          permite_reabertura?: boolean | null
          prazo_reabertura_dias?: number | null
          reabertura_exige_justificativa?: boolean | null
          rh_pode_fechar?: boolean | null
          servidor_pode_fechar?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          chefia_pode_fechar?: boolean | null
          consolidado_em?: string | null
          consolidado_por?: string | null
          created_at?: string | null
          data_limite_chefia?: string | null
          data_limite_rh?: string | null
          data_limite_servidor?: string | null
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          permite_reabertura?: boolean | null
          prazo_reabertura_dias?: number | null
          reabertura_exige_justificativa?: boolean | null
          rh_pode_fechar?: boolean | null
          servidor_pode_fechar?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      config_jornada_padrao: {
        Row: {
          ativo: boolean | null
          banco_tolerancia_diario: boolean | null
          banco_tolerancia_mensal: boolean | null
          carga_horaria_diaria: number
          carga_horaria_semanal: number
          cargo_id: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          entrada_manha: string | null
          entrada_tarde: string | null
          escopo: string | null
          id: string
          intervalo_maximo: number | null
          intervalo_minimo: number | null
          intervalo_obrigatorio: boolean | null
          intervalo_remunerado: boolean | null
          nome: string
          padrao: boolean | null
          saida_manha: string | null
          saida_tarde: string | null
          servidor_id: string | null
          tolerancia_atraso: number | null
          tolerancia_intervalo: number | null
          tolerancia_saida_antecipada: number | null
          unidade_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          banco_tolerancia_diario?: boolean | null
          banco_tolerancia_mensal?: boolean | null
          carga_horaria_diaria?: number
          carga_horaria_semanal?: number
          cargo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          entrada_manha?: string | null
          entrada_tarde?: string | null
          escopo?: string | null
          id?: string
          intervalo_maximo?: number | null
          intervalo_minimo?: number | null
          intervalo_obrigatorio?: boolean | null
          intervalo_remunerado?: boolean | null
          nome: string
          padrao?: boolean | null
          saida_manha?: string | null
          saida_tarde?: string | null
          servidor_id?: string | null
          tolerancia_atraso?: number | null
          tolerancia_intervalo?: number | null
          tolerancia_saida_antecipada?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          banco_tolerancia_diario?: boolean | null
          banco_tolerancia_mensal?: boolean | null
          carga_horaria_diaria?: number
          carga_horaria_semanal?: number
          cargo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          entrada_manha?: string | null
          entrada_tarde?: string | null
          escopo?: string | null
          id?: string
          intervalo_maximo?: number | null
          intervalo_minimo?: number | null
          intervalo_obrigatorio?: boolean | null
          intervalo_remunerado?: boolean | null
          nome?: string
          padrao?: boolean | null
          saida_manha?: string | null
          saida_tarde?: string | null
          servidor_id?: string | null
          tolerancia_atraso?: number | null
          tolerancia_intervalo?: number | null
          tolerancia_saida_antecipada?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_jornada_padrao_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_jornada_padrao_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_jornada_padrao_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_jornada_padrao_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_jornada: {
        Row: {
          carga_horaria_semanal: number | null
          created_at: string | null
          dias_trabalho: number[] | null
          exige_foto: boolean | null
          exige_localizacao: boolean | null
          horas_por_dia: number | null
          id: string
          limite_banco_horas: number | null
          permite_compensacao: boolean | null
          permite_ponto_remoto: boolean | null
          servidor_id: string
          tolerancia_atraso: number | null
          tolerancia_saida_antecipada: number | null
          updated_at: string | null
        }
        Insert: {
          carga_horaria_semanal?: number | null
          created_at?: string | null
          dias_trabalho?: number[] | null
          exige_foto?: boolean | null
          exige_localizacao?: boolean | null
          horas_por_dia?: number | null
          id?: string
          limite_banco_horas?: number | null
          permite_compensacao?: boolean | null
          permite_ponto_remoto?: boolean | null
          servidor_id: string
          tolerancia_atraso?: number | null
          tolerancia_saida_antecipada?: number | null
          updated_at?: string | null
        }
        Update: {
          carga_horaria_semanal?: number | null
          created_at?: string | null
          dias_trabalho?: number[] | null
          exige_foto?: boolean | null
          exige_localizacao?: boolean | null
          horas_por_dia?: number | null
          id?: string
          limite_banco_horas?: number | null
          permite_compensacao?: boolean | null
          permite_ponto_remoto?: boolean | null
          servidor_id?: string
          tolerancia_atraso?: number | null
          tolerancia_saida_antecipada?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_jornada_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracao_jornada_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: true
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      consignacoes: {
        Row: {
          ativo: boolean | null
          competencia_fim: string | null
          competencia_inicio: string | null
          consignataria_cnpj: string | null
          consignataria_codigo: string | null
          consignataria_nome: string
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          data_quitacao: string | null
          data_suspensao: string | null
          id: string
          motivo_suspensao: string | null
          numero_contrato: string | null
          observacoes: string | null
          parcelas_pagas: number | null
          quitado: boolean | null
          rubrica_id: string | null
          saldo_devedor: number | null
          servidor_id: string | null
          suspenso: boolean | null
          tipo_consignacao: string | null
          total_parcelas: number
          updated_at: string | null
          valor_parcela: number
          valor_total: number | null
        }
        Insert: {
          ativo?: boolean | null
          competencia_fim?: string | null
          competencia_inicio?: string | null
          consignataria_cnpj?: string | null
          consignataria_codigo?: string | null
          consignataria_nome: string
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          data_quitacao?: string | null
          data_suspensao?: string | null
          id?: string
          motivo_suspensao?: string | null
          numero_contrato?: string | null
          observacoes?: string | null
          parcelas_pagas?: number | null
          quitado?: boolean | null
          rubrica_id?: string | null
          saldo_devedor?: number | null
          servidor_id?: string | null
          suspenso?: boolean | null
          tipo_consignacao?: string | null
          total_parcelas: number
          updated_at?: string | null
          valor_parcela: number
          valor_total?: number | null
        }
        Update: {
          ativo?: boolean | null
          competencia_fim?: string | null
          competencia_inicio?: string | null
          consignataria_cnpj?: string | null
          consignataria_codigo?: string | null
          consignataria_nome?: string
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_quitacao?: string | null
          data_suspensao?: string | null
          id?: string
          motivo_suspensao?: string | null
          numero_contrato?: string | null
          observacoes?: string | null
          parcelas_pagas?: number | null
          quitado?: boolean | null
          rubrica_id?: string | null
          saldo_devedor?: number | null
          servidor_id?: string | null
          suspenso?: boolean | null
          tipo_consignacao?: string | null
          total_parcelas?: number
          updated_at?: string | null
          valor_parcela?: number
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consignacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignacoes_rubrica_id_fkey"
            columns: ["rubrica_id"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_autarquia: {
        Row: {
          agencia: string
          agencia_digito: string | null
          ativo: boolean | null
          banco_id: string | null
          codigo_cedente: string | null
          codigo_transmissao: string | null
          conta: string
          conta_digito: string | null
          convenio_pagamento: string | null
          created_at: string | null
          created_by: string | null
          descricao: string
          id: string
          tipo_conta: string | null
          updated_at: string | null
          uso_principal: string | null
        }
        Insert: {
          agencia: string
          agencia_digito?: string | null
          ativo?: boolean | null
          banco_id?: string | null
          codigo_cedente?: string | null
          codigo_transmissao?: string | null
          conta: string
          conta_digito?: string | null
          convenio_pagamento?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao: string
          id?: string
          tipo_conta?: string | null
          updated_at?: string | null
          uso_principal?: string | null
        }
        Update: {
          agencia?: string
          agencia_digito?: string | null
          ativo?: boolean | null
          banco_id?: string | null
          codigo_cedente?: string | null
          codigo_transmissao?: string | null
          conta?: string
          conta_digito?: string | null
          convenio_pagamento?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          id?: string
          tipo_conta?: string | null
          updated_at?: string | null
          uso_principal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_autarquia_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos_cnab"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_autarquia_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_autarquia_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_rascunho: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          atualizado_por: string | null
          conteudo: string
          conteudo_estruturado: Json | null
          created_at: string | null
          criado_por: string | null
          id: string
          identificador: string | null
          motivo_rejeicao: string | null
          status: Database["public"]["Enums"]["status_conteudo"] | null
          tipo: Database["public"]["Enums"]["tipo_conteudo_institucional"]
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          atualizado_por?: string | null
          conteudo: string
          conteudo_estruturado?: Json | null
          created_at?: string | null
          criado_por?: string | null
          id?: string
          identificador?: string | null
          motivo_rejeicao?: string | null
          status?: Database["public"]["Enums"]["status_conteudo"] | null
          tipo: Database["public"]["Enums"]["tipo_conteudo_institucional"]
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          atualizado_por?: string | null
          conteudo?: string
          conteudo_estruturado?: Json | null
          created_at?: string | null
          criado_por?: string | null
          id?: string
          identificador?: string | null
          motivo_rejeicao?: string | null
          status?: Database["public"]["Enums"]["status_conteudo"] | null
          tipo?: Database["public"]["Enums"]["tipo_conteudo_institucional"]
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contratos: {
        Row: {
          ano: number
          created_at: string | null
          created_by: string | null
          data_assinatura: string
          data_fim: string
          data_fim_atual: string | null
          data_inicio: string
          data_publicacao_doe: string | null
          dotacao_orcamentaria: string | null
          fiscal_id: string | null
          fonte_recurso: string | null
          fornecedor_id: string
          garantia_tipo: string | null
          garantia_valor: number | null
          garantia_vencimento: string | null
          gestor_id: string | null
          id: string
          numero_contrato: string
          numero_doe: string | null
          objeto: string
          objeto_resumido: string | null
          observacoes: string | null
          processo_licitatorio_id: string | null
          saldo_contrato: number | null
          status: Database["public"]["Enums"]["status_contrato"] | null
          updated_at: string | null
          updated_by: string | null
          valor_atual: number
          valor_executado: number | null
          valor_inicial: number
        }
        Insert: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          data_assinatura: string
          data_fim: string
          data_fim_atual?: string | null
          data_inicio: string
          data_publicacao_doe?: string | null
          dotacao_orcamentaria?: string | null
          fiscal_id?: string | null
          fonte_recurso?: string | null
          fornecedor_id: string
          garantia_tipo?: string | null
          garantia_valor?: number | null
          garantia_vencimento?: string | null
          gestor_id?: string | null
          id?: string
          numero_contrato: string
          numero_doe?: string | null
          objeto: string
          objeto_resumido?: string | null
          observacoes?: string | null
          processo_licitatorio_id?: string | null
          saldo_contrato?: number | null
          status?: Database["public"]["Enums"]["status_contrato"] | null
          updated_at?: string | null
          updated_by?: string | null
          valor_atual: number
          valor_executado?: number | null
          valor_inicial: number
        }
        Update: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          data_assinatura?: string
          data_fim?: string
          data_fim_atual?: string | null
          data_inicio?: string
          data_publicacao_doe?: string | null
          dotacao_orcamentaria?: string | null
          fiscal_id?: string | null
          fonte_recurso?: string | null
          fornecedor_id?: string
          garantia_tipo?: string | null
          garantia_valor?: number | null
          garantia_vencimento?: string | null
          gestor_id?: string | null
          id?: string
          numero_contrato?: string
          numero_doe?: string | null
          objeto?: string
          objeto_resumido?: string | null
          observacoes?: string | null
          processo_licitatorio_id?: string | null
          saldo_contrato?: number | null
          status?: Database["public"]["Enums"]["status_contrato"] | null
          updated_at?: string | null
          updated_by?: string | null
          valor_atual?: number
          valor_executado?: number | null
          valor_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_fiscal_id_fkey"
            columns: ["fiscal_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_fiscal_id_fkey"
            columns: ["fiscal_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_processo_licitatorio_id_fkey"
            columns: ["processo_licitatorio_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_internos: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          indicador_efetividade: string | null
          meta_indicador: string | null
          modulo_sistema: string | null
          nome: string
          objetivo: string | null
          periodicidade: Database["public"]["Enums"]["periodicidade_controle"]
          procedimento: string | null
          processo_raci_id: string | null
          responsavel_id: string | null
          risco_id: string | null
          tipo: Database["public"]["Enums"]["tipo_controle"]
          unidade_responsavel_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          indicador_efetividade?: string | null
          meta_indicador?: string | null
          modulo_sistema?: string | null
          nome: string
          objetivo?: string | null
          periodicidade: Database["public"]["Enums"]["periodicidade_controle"]
          procedimento?: string | null
          processo_raci_id?: string | null
          responsavel_id?: string | null
          risco_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_controle"]
          unidade_responsavel_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          indicador_efetividade?: string | null
          meta_indicador?: string | null
          modulo_sistema?: string | null
          nome?: string
          objetivo?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicidade_controle"]
          procedimento?: string | null
          processo_raci_id?: string | null
          responsavel_id?: string | null
          risco_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_controle"]
          unidade_responsavel_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "controles_internos_processo_raci_id_fkey"
            columns: ["processo_raci_id"]
            isOneToOne: false
            referencedRelation: "matriz_raci_processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_internos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_internos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_internos_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos_institucionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_internos_unidade_responsavel_id_fkey"
            columns: ["unidade_responsavel_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      creditos_adicionais: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_decreto: string | null
          dotacao_id: string
          dotacao_origem_id: string | null
          id: string
          justificativa: string | null
          numero_decreto: string | null
          origem: string | null
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_decreto?: string | null
          dotacao_id: string
          dotacao_origem_id?: string | null
          id?: string
          justificativa?: string | null
          numero_decreto?: string | null
          origem?: string | null
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_decreto?: string | null
          dotacao_id?: string
          dotacao_origem_id?: string | null
          id?: string
          justificativa?: string | null
          numero_decreto?: string | null
          origem?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "creditos_adicionais_dotacao_id_fkey"
            columns: ["dotacao_id"]
            isOneToOne: false
            referencedRelation: "dotacoes_orcamentarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_adicionais_dotacao_origem_id_fkey"
            columns: ["dotacao_origem_id"]
            isOneToOne: false
            referencedRelation: "dotacoes_orcamentarias"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_oficiais: {
        Row: {
          bloqueado: boolean | null
          categoria: string | null
          chave: string
          created_at: string | null
          descricao: string | null
          documento_url: string | null
          id: string
          lei_referencia: string | null
          motivo_alteracao: string | null
          ultima_alteracao_em: string | null
          ultima_alteracao_por: string | null
          updated_at: string | null
          valor: string
        }
        Insert: {
          bloqueado?: boolean | null
          categoria?: string | null
          chave: string
          created_at?: string | null
          descricao?: string | null
          documento_url?: string | null
          id?: string
          lei_referencia?: string | null
          motivo_alteracao?: string | null
          ultima_alteracao_em?: string | null
          ultima_alteracao_por?: string | null
          updated_at?: string | null
          valor: string
        }
        Update: {
          bloqueado?: boolean | null
          categoria?: string | null
          chave?: string
          created_at?: string | null
          descricao?: string | null
          documento_url?: string | null
          id?: string
          lei_referencia?: string | null
          motivo_alteracao?: string | null
          ultima_alteracao_em?: string | null
          ultima_alteracao_por?: string | null
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      debitos_tecnicos: {
        Row: {
          codigo: string
          created_at: string | null
          created_by: string | null
          data_identificacao: string | null
          data_prevista: string | null
          data_resolucao: string | null
          dependencias: string[] | null
          descricao: string | null
          estimativa_esforco: string | null
          fase_destino: string | null
          fase_origem: string | null
          id: string
          impacto: string | null
          modulo: string | null
          observacoes: string | null
          prioridade: Database["public"]["Enums"]["prioridade_debito"] | null
          responsavel_id: string | null
          solucao_proposta: string | null
          status: Database["public"]["Enums"]["status_debito"] | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          created_by?: string | null
          data_identificacao?: string | null
          data_prevista?: string | null
          data_resolucao?: string | null
          dependencias?: string[] | null
          descricao?: string | null
          estimativa_esforco?: string | null
          fase_destino?: string | null
          fase_origem?: string | null
          id?: string
          impacto?: string | null
          modulo?: string | null
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_debito"] | null
          responsavel_id?: string | null
          solucao_proposta?: string | null
          status?: Database["public"]["Enums"]["status_debito"] | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          data_identificacao?: string | null
          data_prevista?: string | null
          data_resolucao?: string | null
          dependencias?: string[] | null
          descricao?: string | null
          estimativa_esforco?: string | null
          fase_destino?: string | null
          fase_origem?: string | null
          id?: string
          impacto?: string | null
          modulo?: string | null
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_debito"] | null
          responsavel_id?: string | null
          solucao_proposta?: string | null
          status?: Database["public"]["Enums"]["status_debito"] | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      decisoes_administrativas: {
        Row: {
          ano: number
          autoridade_id: string | null
          created_at: string
          created_by: string | null
          data_decisao: string
          data_publicacao: string | null
          dispositivo: string
          ementa: string
          entidade_origem_id: string | null
          entidade_origem_tipo: string | null
          fundamentacao: string | null
          id: string
          modulo_origem: string | null
          numero_decisao: string
          processo_sei: string | null
          publicado: boolean
          tipo: Database["public"]["Enums"]["tipo_decisao"]
          unidade_origem_id: string | null
          updated_at: string
          updated_by: string | null
          veiculo_publicacao: string | null
        }
        Insert: {
          ano: number
          autoridade_id?: string | null
          created_at?: string
          created_by?: string | null
          data_decisao: string
          data_publicacao?: string | null
          dispositivo: string
          ementa: string
          entidade_origem_id?: string | null
          entidade_origem_tipo?: string | null
          fundamentacao?: string | null
          id?: string
          modulo_origem?: string | null
          numero_decisao: string
          processo_sei?: string | null
          publicado?: boolean
          tipo: Database["public"]["Enums"]["tipo_decisao"]
          unidade_origem_id?: string | null
          updated_at?: string
          updated_by?: string | null
          veiculo_publicacao?: string | null
        }
        Update: {
          ano?: number
          autoridade_id?: string | null
          created_at?: string
          created_by?: string | null
          data_decisao?: string
          data_publicacao?: string | null
          dispositivo?: string
          ementa?: string
          entidade_origem_id?: string | null
          entidade_origem_tipo?: string | null
          fundamentacao?: string | null
          id?: string
          modulo_origem?: string | null
          numero_decisao?: string
          processo_sei?: string | null
          publicado?: boolean
          tipo?: Database["public"]["Enums"]["tipo_decisao"]
          unidade_origem_id?: string | null
          updated_at?: string
          updated_by?: string | null
          veiculo_publicacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisoes_administrativas_autoridade_id_fkey"
            columns: ["autoridade_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisoes_administrativas_autoridade_id_fkey"
            columns: ["autoridade_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisoes_administrativas_unidade_origem_id_fkey"
            columns: ["unidade_origem_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_ascom: {
        Row: {
          ano: number
          aprovado_por_id: string | null
          autorizado_presidencia_por_id: string | null
          cargo_funcao: string | null
          categoria: Database["public"]["Enums"]["categoria_demanda_ascom"]
          contato_email: string | null
          contato_telefone: string | null
          created_at: string | null
          created_by: string | null
          data_aprovacao: string | null
          data_autorizacao_presidencia: string | null
          data_conclusao: string | null
          data_evento: string | null
          data_inicio_execucao: string | null
          descricao_detalhada: string
          email_solicitante: string | null
          historico_status: Json | null
          hora_evento: string | null
          id: string
          justificativa_indeferimento: string | null
          local_evento: string | null
          nome_responsavel: string
          numero_demanda: string | null
          objetivo_institucional: string | null
          observacoes_internas_ascom: string | null
          prazo_entrega: string
          prioridade: Database["public"]["Enums"]["prioridade_demanda_ascom"]
          publico_alvo: string | null
          requer_autorizacao_presidencia: boolean | null
          responsavel_ascom_id: string | null
          servidor_solicitante_id: string | null
          status: Database["public"]["Enums"]["status_demanda_ascom"]
          telefone_solicitante: string | null
          tipo: Database["public"]["Enums"]["tipo_demanda_ascom"]
          titulo: string
          unidade_solicitante_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ano?: number
          aprovado_por_id?: string | null
          autorizado_presidencia_por_id?: string | null
          cargo_funcao?: string | null
          categoria: Database["public"]["Enums"]["categoria_demanda_ascom"]
          contato_email?: string | null
          contato_telefone?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          data_autorizacao_presidencia?: string | null
          data_conclusao?: string | null
          data_evento?: string | null
          data_inicio_execucao?: string | null
          descricao_detalhada: string
          email_solicitante?: string | null
          historico_status?: Json | null
          hora_evento?: string | null
          id?: string
          justificativa_indeferimento?: string | null
          local_evento?: string | null
          nome_responsavel: string
          numero_demanda?: string | null
          objetivo_institucional?: string | null
          observacoes_internas_ascom?: string | null
          prazo_entrega: string
          prioridade?: Database["public"]["Enums"]["prioridade_demanda_ascom"]
          publico_alvo?: string | null
          requer_autorizacao_presidencia?: boolean | null
          responsavel_ascom_id?: string | null
          servidor_solicitante_id?: string | null
          status?: Database["public"]["Enums"]["status_demanda_ascom"]
          telefone_solicitante?: string | null
          tipo: Database["public"]["Enums"]["tipo_demanda_ascom"]
          titulo: string
          unidade_solicitante_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ano?: number
          aprovado_por_id?: string | null
          autorizado_presidencia_por_id?: string | null
          cargo_funcao?: string | null
          categoria?: Database["public"]["Enums"]["categoria_demanda_ascom"]
          contato_email?: string | null
          contato_telefone?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          data_autorizacao_presidencia?: string | null
          data_conclusao?: string | null
          data_evento?: string | null
          data_inicio_execucao?: string | null
          descricao_detalhada?: string
          email_solicitante?: string | null
          historico_status?: Json | null
          hora_evento?: string | null
          id?: string
          justificativa_indeferimento?: string | null
          local_evento?: string | null
          nome_responsavel?: string
          numero_demanda?: string | null
          objetivo_institucional?: string | null
          observacoes_internas_ascom?: string | null
          prazo_entrega?: string
          prioridade?: Database["public"]["Enums"]["prioridade_demanda_ascom"]
          publico_alvo?: string | null
          requer_autorizacao_presidencia?: boolean | null
          responsavel_ascom_id?: string | null
          servidor_solicitante_id?: string | null
          status?: Database["public"]["Enums"]["status_demanda_ascom"]
          telefone_solicitante?: string | null
          tipo?: Database["public"]["Enums"]["tipo_demanda_ascom"]
          titulo?: string
          unidade_solicitante_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_ascom_aprovado_por_id_fkey"
            columns: ["aprovado_por_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_ascom_aprovado_por_id_fkey"
            columns: ["aprovado_por_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_ascom_autorizado_presidencia_por_id_fkey"
            columns: ["autorizado_presidencia_por_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_ascom_autorizado_presidencia_por_id_fkey"
            columns: ["autorizado_presidencia_por_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_ascom_responsavel_ascom_id_fkey"
            columns: ["responsavel_ascom_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_ascom_responsavel_ascom_id_fkey"
            columns: ["responsavel_ascom_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_ascom_servidor_solicitante_id_fkey"
            columns: ["servidor_solicitante_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_ascom_servidor_solicitante_id_fkey"
            columns: ["servidor_solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_ascom_unidade_solicitante_id_fkey"
            columns: ["unidade_solicitante_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_ascom_anexos: {
        Row: {
          created_at: string | null
          created_by: string | null
          demanda_id: string
          descricao: string | null
          id: string
          nome_arquivo: string
          tamanho_bytes: number | null
          tipo_anexo: string
          tipo_mime: string | null
          url_arquivo: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          demanda_id: string
          descricao?: string | null
          id?: string
          nome_arquivo: string
          tamanho_bytes?: number | null
          tipo_anexo: string
          tipo_mime?: string | null
          url_arquivo: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          demanda_id?: string
          descricao?: string | null
          id?: string
          nome_arquivo?: string
          tamanho_bytes?: number | null
          tipo_anexo?: string
          tipo_mime?: string | null
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_ascom_anexos_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas_ascom"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_ascom_comentarios: {
        Row: {
          conteudo: string
          created_at: string | null
          created_by: string | null
          demanda_id: string
          id: string
          tipo: string
          visivel_solicitante: boolean | null
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          created_by?: string | null
          demanda_id: string
          id?: string
          tipo?: string
          visivel_solicitante?: boolean | null
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          created_by?: string | null
          demanda_id?: string
          id?: string
          tipo?: string
          visivel_solicitante?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_ascom_comentarios_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas_ascom"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_ascom_entregaveis: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_entrega: string | null
          demanda_id: string
          descricao: string
          id: string
          link_drive: string | null
          link_publicacao: string | null
          metricas: Json | null
          relatorio_cobertura: string | null
          tipo_entregavel: string
          url_arquivo: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_entrega?: string | null
          demanda_id: string
          descricao: string
          id?: string
          link_drive?: string | null
          link_publicacao?: string | null
          metricas?: Json | null
          relatorio_cobertura?: string | null
          tipo_entregavel: string
          url_arquivo?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_entrega?: string | null
          demanda_id?: string
          descricao?: string
          id?: string
          link_drive?: string | null
          link_publicacao?: string | null
          metricas?: Json | null
          relatorio_cobertura?: string | null
          tipo_entregavel?: string
          url_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_ascom_entregaveis_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas_ascom"
            referencedColumns: ["id"]
          },
        ]
      }
      dependentes_irrf: {
        Row: {
          ativo: boolean | null
          certidao_url: string | null
          cpf: string | null
          created_at: string | null
          created_by: string | null
          data_fim_deducao: string | null
          data_inicio_deducao: string
          data_nascimento: string
          deduz_irrf: boolean | null
          documento_url: string | null
          grau_instrucao: string | null
          id: string
          nome: string
          observacoes: string | null
          servidor_id: string | null
          tipo_dependente: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          certidao_url?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim_deducao?: string | null
          data_inicio_deducao: string
          data_nascimento: string
          deduz_irrf?: boolean | null
          documento_url?: string | null
          grau_instrucao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          servidor_id?: string | null
          tipo_dependente: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          certidao_url?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim_deducao?: string | null
          data_inicio_deducao?: string
          data_nascimento?: string
          deduz_irrf?: boolean | null
          documento_url?: string | null
          grau_instrucao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          servidor_id?: string | null
          tipo_dependente?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependentes_irrf_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependentes_irrf_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependentes_irrf_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependentes_irrf_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      designacoes: {
        Row: {
          aprovado_por: string | null
          ativo: boolean | null
          ato_data: string | null
          ato_doe_data: string | null
          ato_doe_numero: string | null
          ato_numero: string | null
          ato_tipo: string | null
          created_at: string | null
          created_by: string | null
          data_aprovacao: string | null
          data_fim: string | null
          data_inicio: string
          id: string
          justificativa: string | null
          lotacao_id: string | null
          motivo_rejeicao: string | null
          observacao: string | null
          servidor_id: string
          status: string | null
          unidade_destino_id: string
          unidade_origem_id: string
          updated_at: string | null
        }
        Insert: {
          aprovado_por?: string | null
          ativo?: boolean | null
          ato_data?: string | null
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_numero?: string | null
          ato_tipo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          data_fim?: string | null
          data_inicio: string
          id?: string
          justificativa?: string | null
          lotacao_id?: string | null
          motivo_rejeicao?: string | null
          observacao?: string | null
          servidor_id: string
          status?: string | null
          unidade_destino_id: string
          unidade_origem_id: string
          updated_at?: string | null
        }
        Update: {
          aprovado_por?: string | null
          ativo?: boolean | null
          ato_data?: string | null
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_numero?: string | null
          ato_tipo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          justificativa?: string | null
          lotacao_id?: string | null
          motivo_rejeicao?: string | null
          observacao?: string | null
          servidor_id?: string
          status?: string | null
          unidade_destino_id?: string
          unidade_origem_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "designacoes_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "lotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_unidade_destino_id_fkey"
            columns: ["unidade_destino_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_unidade_origem_id_fkey"
            columns: ["unidade_origem_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      despachos: {
        Row: {
          autoridade_id: string | null
          created_at: string
          created_by: string | null
          data_despacho: string
          decisao: Database["public"]["Enums"]["decisao_despacho"] | null
          fundamentacao_legal: string | null
          id: string
          movimentacao_id: string | null
          numero_despacho: number
          processo_id: string
          texto_despacho: string
          tipo_despacho: Database["public"]["Enums"]["tipo_despacho"]
          updated_at: string
        }
        Insert: {
          autoridade_id?: string | null
          created_at?: string
          created_by?: string | null
          data_despacho?: string
          decisao?: Database["public"]["Enums"]["decisao_despacho"] | null
          fundamentacao_legal?: string | null
          id?: string
          movimentacao_id?: string | null
          numero_despacho?: number
          processo_id: string
          texto_despacho: string
          tipo_despacho?: Database["public"]["Enums"]["tipo_despacho"]
          updated_at?: string
        }
        Update: {
          autoridade_id?: string | null
          created_at?: string
          created_by?: string | null
          data_despacho?: string
          decisao?: Database["public"]["Enums"]["decisao_despacho"] | null
          fundamentacao_legal?: string | null
          id?: string
          movimentacao_id?: string | null
          numero_despacho?: number
          processo_id?: string
          texto_despacho?: string
          tipo_despacho?: Database["public"]["Enums"]["tipo_despacho"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "despachos_autoridade_id_fkey"
            columns: ["autoridade_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_autoridade_id_fkey"
            columns: ["autoridade_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_processo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_administrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "v_processos_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      dias_nao_uteis: {
        Row: {
          abrangencia: string | null
          ativo: boolean | null
          conta_frequencia: boolean | null
          created_at: string | null
          created_by: string | null
          data: string
          dia_recorrente: number | null
          exige_compensacao: boolean | null
          horas_expediente: number | null
          id: string
          mes_recorrente: number | null
          nome: string
          observacao: string | null
          recorrente: boolean | null
          tipo: string
          unidades_aplicaveis: string[] | null
        }
        Insert: {
          abrangencia?: string | null
          ativo?: boolean | null
          conta_frequencia?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data: string
          dia_recorrente?: number | null
          exige_compensacao?: boolean | null
          horas_expediente?: number | null
          id?: string
          mes_recorrente?: number | null
          nome: string
          observacao?: string | null
          recorrente?: boolean | null
          tipo: string
          unidades_aplicaveis?: string[] | null
        }
        Update: {
          abrangencia?: string | null
          ativo?: boolean | null
          conta_frequencia?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          dia_recorrente?: number | null
          exige_compensacao?: boolean | null
          horas_expediente?: number | null
          id?: string
          mes_recorrente?: number | null
          nome?: string
          observacao?: string | null
          recorrente?: boolean | null
          tipo?: string
          unidades_aplicaveis?: string[] | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          arquivo_assinado_url: string | null
          arquivo_url: string | null
          assinado_por: string | null
          cargo_id: string | null
          categoria: Database["public"]["Enums"]["categoria_portaria"] | null
          conteudo_html: string | null
          conteudo_unificado: Json | null
          created_at: string
          created_by: string | null
          data_assinatura: string | null
          data_documento: string
          data_publicacao: string | null
          data_vigencia_fim: string | null
          data_vigencia_inicio: string | null
          designacao_id: string | null
          doe_data: string | null
          doe_link: string | null
          doe_numero: string | null
          ementa: string | null
          id: string
          numero: string
          observacoes: string | null
          provimento_id: string | null
          servidores_ids: string[] | null
          status: Database["public"]["Enums"]["status_documento"]
          tipo: Database["public"]["Enums"]["tipo_documento"]
          titulo: string
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          arquivo_assinado_url?: string | null
          arquivo_url?: string | null
          assinado_por?: string | null
          cargo_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_portaria"] | null
          conteudo_html?: string | null
          conteudo_unificado?: Json | null
          created_at?: string
          created_by?: string | null
          data_assinatura?: string | null
          data_documento?: string
          data_publicacao?: string | null
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          designacao_id?: string | null
          doe_data?: string | null
          doe_link?: string | null
          doe_numero?: string | null
          ementa?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          provimento_id?: string | null
          servidores_ids?: string[] | null
          status?: Database["public"]["Enums"]["status_documento"]
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          titulo: string
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          arquivo_assinado_url?: string | null
          arquivo_url?: string | null
          assinado_por?: string | null
          cargo_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_portaria"] | null
          conteudo_html?: string | null
          conteudo_unificado?: Json | null
          created_at?: string
          created_by?: string | null
          data_assinatura?: string | null
          data_documento?: string
          data_publicacao?: string | null
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          designacao_id?: string | null
          doe_data?: string | null
          doe_link?: string | null
          doe_numero?: string | null
          ementa?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          provimento_id?: string | null
          servidores_ids?: string[] | null
          status?: Database["public"]["Enums"]["status_documento"]
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          titulo?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_designacao_id_fkey"
            columns: ["designacao_id"]
            isOneToOne: false
            referencedRelation: "designacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_provimento_id_fkey"
            columns: ["provimento_id"]
            isOneToOne: false
            referencedRelation: "provimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_provimento_id_fkey"
            columns: ["provimento_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["provimento_id"]
          },
          {
            foreignKeyName: "documentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_cedencia: {
        Row: {
          agenda_id: string
          created_at: string | null
          documento_principal: boolean | null
          id: string
          mime_type: string | null
          nome_arquivo: string
          observacoes: string | null
          tamanho_bytes: number | null
          tipo_documento: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          url_arquivo: string
          versao: number | null
        }
        Insert: {
          agenda_id: string
          created_at?: string | null
          documento_principal?: boolean | null
          id?: string
          mime_type?: string | null
          nome_arquivo: string
          observacoes?: string | null
          tamanho_bytes?: number | null
          tipo_documento: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          url_arquivo: string
          versao?: number | null
        }
        Update: {
          agenda_id?: string
          created_at?: string | null
          documento_principal?: boolean | null
          id?: string
          mime_type?: string | null
          nome_arquivo?: string
          observacoes?: string | null
          tamanho_bytes?: number | null
          tipo_documento?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          url_arquivo?: string
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cedencia_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agenda_unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cedencia_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["agenda_id"]
          },
          {
            foreignKeyName: "documentos_cedencia_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["agenda_id"]
          },
        ]
      }
      documentos_preparatorios_licitacao: {
        Row: {
          aprovado: boolean | null
          aprovado_em: string | null
          aprovado_por: string | null
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string | null
          created_by: string | null
          data_documento: string | null
          descricao: string | null
          id: string
          numero_documento: string | null
          observacoes: string | null
          processo_licitatorio_id: string
          responsavel_id: string | null
          tipo: Database["public"]["Enums"]["tipo_documento_licitacao"]
          titulo: string
          updated_at: string | null
          updated_by: string | null
          versao: number | null
        }
        Insert: {
          aprovado?: boolean | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data_documento?: string | null
          descricao?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          processo_licitatorio_id: string
          responsavel_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_documento_licitacao"]
          titulo: string
          updated_at?: string | null
          updated_by?: string | null
          versao?: number | null
        }
        Update: {
          aprovado?: boolean | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data_documento?: string | null
          descricao?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          processo_licitatorio_id?: string
          responsavel_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_documento_licitacao"]
          titulo?: string
          updated_at?: string | null
          updated_by?: string | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_preparatorios_licitacao_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_preparatorios_licitacao_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_preparatorios_licitacao_processo_licitatorio_id_fkey"
            columns: ["processo_licitatorio_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_preparatorios_licitacao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_preparatorios_licitacao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_processo: {
        Row: {
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          arquivo_url: string | null
          conteudo_textual: string | null
          created_at: string
          created_by: string | null
          hash_sha256: string | null
          id: string
          numero_documento: string | null
          ordem: number
          processo_id: string
          sigilo: Database["public"]["Enums"]["nivel_sigilo_processo"]
          tipo_documento: Database["public"]["Enums"]["tipo_documento_processo"]
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          conteudo_textual?: string | null
          created_at?: string
          created_by?: string | null
          hash_sha256?: string | null
          id?: string
          numero_documento?: string | null
          ordem?: number
          processo_id: string
          sigilo?: Database["public"]["Enums"]["nivel_sigilo_processo"]
          tipo_documento?: Database["public"]["Enums"]["tipo_documento_processo"]
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          conteudo_textual?: string | null
          created_at?: string
          created_by?: string | null
          hash_sha256?: string | null
          id?: string
          numero_documento?: string | null
          ordem?: number
          processo_id?: string
          sigilo?: Database["public"]["Enums"]["nivel_sigilo_processo"]
          tipo_documento?: Database["public"]["Enums"]["tipo_documento_processo"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_administrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "v_processos_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      dotacoes_orcamentarias: {
        Row: {
          acao_orcamentaria: string
          categoria_economica: string
          centro_custo_id: string | null
          classificacao_completa: string | null
          created_at: string | null
          created_by: string | null
          descricao_fonte: string | null
          elemento_despesa: string
          exercicio: number
          fonte_recurso: string
          funcao: string
          grupo_despesa: string
          id: string
          modalidade_aplicacao: string
          programa: string
          saldo_disponivel: number | null
          subfuncao: string
          unidade_orcamentaria: string
          updated_at: string | null
          valor_anulado: number
          valor_atual: number | null
          valor_empenhado: number
          valor_inicial: number
          valor_liquidado: number
          valor_pago: number
          valor_suplementado: number
        }
        Insert: {
          acao_orcamentaria: string
          categoria_economica: string
          centro_custo_id?: string | null
          classificacao_completa?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao_fonte?: string | null
          elemento_despesa: string
          exercicio: number
          fonte_recurso: string
          funcao: string
          grupo_despesa: string
          id?: string
          modalidade_aplicacao: string
          programa: string
          saldo_disponivel?: number | null
          subfuncao: string
          unidade_orcamentaria: string
          updated_at?: string | null
          valor_anulado?: number
          valor_atual?: number | null
          valor_empenhado?: number
          valor_inicial?: number
          valor_liquidado?: number
          valor_pago?: number
          valor_suplementado?: number
        }
        Update: {
          acao_orcamentaria?: string
          categoria_economica?: string
          centro_custo_id?: string | null
          classificacao_completa?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao_fonte?: string | null
          elemento_despesa?: string
          exercicio?: number
          fonte_recurso?: string
          funcao?: string
          grupo_despesa?: string
          id?: string
          modalidade_aplicacao?: string
          programa?: string
          saldo_disponivel?: number | null
          subfuncao?: string
          unidade_orcamentaria?: string
          updated_at?: string | null
          valor_anulado?: number
          valor_atual?: number | null
          valor_empenhado?: number
          valor_inicial?: number
          valor_liquidado?: number
          valor_pago?: number
          valor_suplementado?: number
        }
        Relationships: [
          {
            foreignKeyName: "dotacoes_orcamentarias_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
        ]
      }
      empenhos: {
        Row: {
          contrato_id: string | null
          created_at: string | null
          created_by: string | null
          data_empenho: string
          dotacao_id: string
          exercicio: number
          fornecedor_id: string
          historico: string
          id: string
          modalidade: string
          numero_empenho: string
          observacao: string | null
          processo_licitatorio_id: string | null
          saldo_empenho: number | null
          situacao: string | null
          tipo: string
          updated_at: string | null
          valor_anulado: number
          valor_empenhado: number
          valor_liquidado: number
          valor_pago: number
        }
        Insert: {
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_empenho: string
          dotacao_id: string
          exercicio: number
          fornecedor_id: string
          historico: string
          id?: string
          modalidade: string
          numero_empenho: string
          observacao?: string | null
          processo_licitatorio_id?: string | null
          saldo_empenho?: number | null
          situacao?: string | null
          tipo: string
          updated_at?: string | null
          valor_anulado?: number
          valor_empenhado: number
          valor_liquidado?: number
          valor_pago?: number
        }
        Update: {
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_empenho?: string
          dotacao_id?: string
          exercicio?: number
          fornecedor_id?: string
          historico?: string
          id?: string
          modalidade?: string
          numero_empenho?: string
          observacao?: string | null
          processo_licitatorio_id?: string | null
          saldo_empenho?: number | null
          situacao?: string | null
          tipo?: string
          updated_at?: string | null
          valor_anulado?: number
          valor_empenhado?: number
          valor_liquidado?: number
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "empenhos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empenhos_dotacao_id_fkey"
            columns: ["dotacao_id"]
            isOneToOne: false
            referencedRelation: "dotacoes_orcamentarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empenhos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empenhos_processo_licitatorio_id_fkey"
            columns: ["processo_licitatorio_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      encaminhamentos: {
        Row: {
          assunto: string
          created_at: string
          created_by: string | null
          data_encaminhamento: string
          data_recebimento: string | null
          despacho: string
          id: string
          numero_sequencial: number
          origem_id: string
          prazo_resposta: string | null
          recebido_por: string | null
          servidor_destino_id: string | null
          status: string
          tipo_origem: string
          unidade_destino_id: string | null
          updated_at: string
          urgente: boolean
        }
        Insert: {
          assunto: string
          created_at?: string
          created_by?: string | null
          data_encaminhamento?: string
          data_recebimento?: string | null
          despacho: string
          id?: string
          numero_sequencial: number
          origem_id: string
          prazo_resposta?: string | null
          recebido_por?: string | null
          servidor_destino_id?: string | null
          status?: string
          tipo_origem: string
          unidade_destino_id?: string | null
          updated_at?: string
          urgente?: boolean
        }
        Update: {
          assunto?: string
          created_at?: string
          created_by?: string | null
          data_encaminhamento?: string
          data_recebimento?: string | null
          despacho?: string
          id?: string
          numero_sequencial?: number
          origem_id?: string
          prazo_resposta?: string | null
          recebido_por?: string | null
          servidor_destino_id?: string | null
          status?: string
          tipo_origem?: string
          unidade_destino_id?: string | null
          updated_at?: string
          urgente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "encaminhamentos_servidor_destino_id_fkey"
            columns: ["servidor_destino_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_servidor_destino_id_fkey"
            columns: ["servidor_destino_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_unidade_destino_id_fkey"
            columns: ["unidade_destino_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          almoxarifado_id: string
          id: string
          item_id: string
          quantidade: number
          ultima_movimentacao: string | null
          valor_total: number
        }
        Insert: {
          almoxarifado_id: string
          id?: string
          item_id: string
          quantidade?: number
          ultima_movimentacao?: string | null
          valor_total?: number
        }
        Update: {
          almoxarifado_id?: string
          id?: string
          item_id?: string
          quantidade?: number
          ultima_movimentacao?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_almoxarifado_id_fkey"
            columns: ["almoxarifado_id"]
            isOneToOne: false
            referencedRelation: "almoxarifados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_material"
            referencedColumns: ["id"]
          },
        ]
      }
      estrutura_organizacional: {
        Row: {
          ativo: boolean | null
          atribuicoes: string | null
          base_legal: boolean | null
          cargo_chefe_id: string | null
          competencias: string[] | null
          created_at: string | null
          data_extincao: string | null
          descricao: string | null
          email: string | null
          id: string
          lei_criacao_artigo: string | null
          lei_criacao_data: string | null
          lei_criacao_ementa: string | null
          lei_criacao_numero: string | null
          lei_documento_url: string | null
          localizacao: string | null
          nivel: number
          nome: string
          ordem: number | null
          ordem_exibicao: number | null
          ramal: string | null
          servidor_responsavel_id: string | null
          sigla: string | null
          superior_id: string | null
          telefone: string | null
          tipo: Database["public"]["Enums"]["tipo_unidade"]
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          atribuicoes?: string | null
          base_legal?: boolean | null
          cargo_chefe_id?: string | null
          competencias?: string[] | null
          created_at?: string | null
          data_extincao?: string | null
          descricao?: string | null
          email?: string | null
          id?: string
          lei_criacao_artigo?: string | null
          lei_criacao_data?: string | null
          lei_criacao_ementa?: string | null
          lei_criacao_numero?: string | null
          lei_documento_url?: string | null
          localizacao?: string | null
          nivel?: number
          nome: string
          ordem?: number | null
          ordem_exibicao?: number | null
          ramal?: string | null
          servidor_responsavel_id?: string | null
          sigla?: string | null
          superior_id?: string | null
          telefone?: string | null
          tipo: Database["public"]["Enums"]["tipo_unidade"]
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          atribuicoes?: string | null
          base_legal?: boolean | null
          cargo_chefe_id?: string | null
          competencias?: string[] | null
          created_at?: string | null
          data_extincao?: string | null
          descricao?: string | null
          email?: string | null
          id?: string
          lei_criacao_artigo?: string | null
          lei_criacao_data?: string | null
          lei_criacao_ementa?: string | null
          lei_criacao_numero?: string | null
          lei_documento_url?: string | null
          localizacao?: string | null
          nivel?: number
          nome?: string
          ordem?: number | null
          ordem_exibicao?: number | null
          ramal?: string | null
          servidor_responsavel_id?: string | null
          sigla?: string | null
          superior_id?: string | null
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["tipo_unidade"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estrutura_organizacional_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrutura_organizacional_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrutura_organizacional_superior_id_fkey"
            columns: ["superior_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cargo_chefe"
            columns: ["cargo_chefe_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_esocial: {
        Row: {
          competencia_ano: number | null
          competencia_mes: number | null
          created_at: string | null
          data_envio: string | null
          data_geracao: string | null
          data_retorno: string | null
          folha_id: string | null
          gerado_por: string | null
          id: string
          id_evento: string | null
          lote_id: string | null
          mensagem_retorno: string | null
          payload: Json
          payload_xml: string | null
          protocolo_envio: string | null
          recibo: string | null
          sequencia_lote: number | null
          servidor_id: string | null
          status: Database["public"]["Enums"]["status_evento_esocial"] | null
          tentativas_envio: number | null
          tipo_evento: string
          updated_at: string | null
        }
        Insert: {
          competencia_ano?: number | null
          competencia_mes?: number | null
          created_at?: string | null
          data_envio?: string | null
          data_geracao?: string | null
          data_retorno?: string | null
          folha_id?: string | null
          gerado_por?: string | null
          id?: string
          id_evento?: string | null
          lote_id?: string | null
          mensagem_retorno?: string | null
          payload: Json
          payload_xml?: string | null
          protocolo_envio?: string | null
          recibo?: string | null
          sequencia_lote?: number | null
          servidor_id?: string | null
          status?: Database["public"]["Enums"]["status_evento_esocial"] | null
          tentativas_envio?: number | null
          tipo_evento: string
          updated_at?: string | null
        }
        Update: {
          competencia_ano?: number | null
          competencia_mes?: number | null
          created_at?: string | null
          data_envio?: string | null
          data_geracao?: string | null
          data_retorno?: string | null
          folha_id?: string | null
          gerado_por?: string | null
          id?: string
          id_evento?: string | null
          lote_id?: string | null
          mensagem_retorno?: string | null
          payload?: Json
          payload_xml?: string | null
          protocolo_envio?: string | null
          recibo?: string | null
          sequencia_lote?: number | null
          servidor_id?: string | null
          status?: Database["public"]["Enums"]["status_evento_esocial"] | null
          tentativas_envio?: number | null
          tipo_evento?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_esocial_folha_id_fkey"
            columns: ["folha_id"]
            isOneToOne: false
            referencedRelation: "folhas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_esocial_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_esocial_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_esocial_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_esocial_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias_controle: {
        Row: {
          arquivo_hash_sha512: string | null
          arquivo_nome: string | null
          arquivo_url: string | null
          controle_id: string
          created_at: string
          created_by: string | null
          data_evidencia: string
          descricao: string | null
          id: string
          link_externo: string | null
          observacoes: string | null
          tipo_evidencia: string
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_hash_sha512?: string | null
          arquivo_nome?: string | null
          arquivo_url?: string | null
          controle_id: string
          created_at?: string
          created_by?: string | null
          data_evidencia: string
          descricao?: string | null
          id?: string
          link_externo?: string | null
          observacoes?: string | null
          tipo_evidencia: string
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_hash_sha512?: string | null
          arquivo_nome?: string | null
          arquivo_url?: string | null
          controle_id?: string
          created_at?: string
          created_by?: string | null
          data_evidencia?: string
          descricao?: string | null
          id?: string
          link_externo?: string | null
          observacoes?: string | null
          tipo_evidencia?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_controle_controle_id_fkey"
            columns: ["controle_id"]
            isOneToOne: false
            referencedRelation: "controles_internos"
            referencedColumns: ["id"]
          },
        ]
      }
      exportacoes_folha: {
        Row: {
          arquivo_url: string | null
          banco_id: string | null
          enviado_em: string | null
          enviado_por: string | null
          folha_id: string | null
          gerado_em: string | null
          gerado_por: string | null
          hash_arquivo: string | null
          id: string
          mensagem_status: string | null
          nome_arquivo: string
          quantidade_registros: number | null
          status: string | null
          tamanho_bytes: number | null
          tipo_exportacao: string
          valor_total: number | null
        }
        Insert: {
          arquivo_url?: string | null
          banco_id?: string | null
          enviado_em?: string | null
          enviado_por?: string | null
          folha_id?: string | null
          gerado_em?: string | null
          gerado_por?: string | null
          hash_arquivo?: string | null
          id?: string
          mensagem_status?: string | null
          nome_arquivo: string
          quantidade_registros?: number | null
          status?: string | null
          tamanho_bytes?: number | null
          tipo_exportacao: string
          valor_total?: number | null
        }
        Update: {
          arquivo_url?: string | null
          banco_id?: string | null
          enviado_em?: string | null
          enviado_por?: string | null
          folha_id?: string | null
          gerado_em?: string | null
          gerado_por?: string | null
          hash_arquivo?: string | null
          id?: string
          mensagem_status?: string | null
          nome_arquivo?: string
          quantidade_registros?: number | null
          status?: string | null
          tamanho_bytes?: number | null
          tipo_exportacao?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exportacoes_folha_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos_cnab"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exportacoes_folha_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exportacoes_folha_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exportacoes_folha_folha_id_fkey"
            columns: ["folha_id"]
            isOneToOne: false
            referencedRelation: "folhas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exportacoes_folha_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exportacoes_folha_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      federacoes_esportivas: {
        Row: {
          analisado_por: string | null
          cnpj: string | null
          created_at: string
          data_analise: string | null
          data_criacao: string
          diretor_tecnico_data_nascimento: string | null
          diretor_tecnico_facebook: string | null
          diretor_tecnico_instagram: string | null
          diretor_tecnico_nome: string | null
          diretor_tecnico_telefone: string | null
          email: string
          endereco: string
          endereco_bairro: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          facebook: string | null
          id: string
          instagram: string | null
          mandato_fim: string
          mandato_inicio: string
          nome: string
          observacoes_internas: string | null
          presidente_email: string
          presidente_endereco: string | null
          presidente_endereco_bairro: string | null
          presidente_endereco_logradouro: string | null
          presidente_endereco_numero: string | null
          presidente_facebook: string | null
          presidente_instagram: string | null
          presidente_nascimento: string
          presidente_nome: string
          presidente_telefone: string
          sigla: string
          site: string | null
          status: string
          telefone: string
          updated_at: string
          vice_presidente_data_nascimento: string | null
          vice_presidente_facebook: string | null
          vice_presidente_instagram: string | null
          vice_presidente_nome: string
          vice_presidente_telefone: string
        }
        Insert: {
          analisado_por?: string | null
          cnpj?: string | null
          created_at?: string
          data_analise?: string | null
          data_criacao: string
          diretor_tecnico_data_nascimento?: string | null
          diretor_tecnico_facebook?: string | null
          diretor_tecnico_instagram?: string | null
          diretor_tecnico_nome?: string | null
          diretor_tecnico_telefone?: string | null
          email: string
          endereco: string
          endereco_bairro?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          mandato_fim: string
          mandato_inicio: string
          nome: string
          observacoes_internas?: string | null
          presidente_email: string
          presidente_endereco?: string | null
          presidente_endereco_bairro?: string | null
          presidente_endereco_logradouro?: string | null
          presidente_endereco_numero?: string | null
          presidente_facebook?: string | null
          presidente_instagram?: string | null
          presidente_nascimento: string
          presidente_nome: string
          presidente_telefone: string
          sigla: string
          site?: string | null
          status?: string
          telefone: string
          updated_at?: string
          vice_presidente_data_nascimento?: string | null
          vice_presidente_facebook?: string | null
          vice_presidente_instagram?: string | null
          vice_presidente_nome: string
          vice_presidente_telefone: string
        }
        Update: {
          analisado_por?: string | null
          cnpj?: string | null
          created_at?: string
          data_analise?: string | null
          data_criacao?: string
          diretor_tecnico_data_nascimento?: string | null
          diretor_tecnico_facebook?: string | null
          diretor_tecnico_instagram?: string | null
          diretor_tecnico_nome?: string | null
          diretor_tecnico_telefone?: string | null
          email?: string
          endereco?: string
          endereco_bairro?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          mandato_fim?: string
          mandato_inicio?: string
          nome?: string
          observacoes_internas?: string | null
          presidente_email?: string
          presidente_endereco?: string | null
          presidente_endereco_bairro?: string | null
          presidente_endereco_logradouro?: string | null
          presidente_endereco_numero?: string | null
          presidente_facebook?: string | null
          presidente_instagram?: string | null
          presidente_nascimento?: string
          presidente_nome?: string
          presidente_telefone?: string
          sigla?: string
          site?: string | null
          status?: string
          telefone?: string
          updated_at?: string
          vice_presidente_data_nascimento?: string | null
          vice_presidente_facebook?: string | null
          vice_presidente_instagram?: string | null
          vice_presidente_nome?: string
          vice_presidente_telefone?: string
        }
        Relationships: []
      }
      feriados: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data: string
          id: string
          nome: string
          recorrente: boolean | null
          tipo: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data: string
          id?: string
          nome: string
          recorrente?: boolean | null
          tipo?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data?: string
          id?: string
          nome?: string
          recorrente?: boolean | null
          tipo?: string | null
        }
        Relationships: []
      }
      ferias_servidor: {
        Row: {
          abono_pecuniario: boolean | null
          created_at: string | null
          created_by: string | null
          data_fim: string
          data_inicio: string
          dias_abono: number | null
          dias_gozados: number
          id: string
          observacoes: string | null
          parcela: number | null
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          portaria_data: string | null
          portaria_numero: string | null
          portaria_url: string | null
          servidor_id: string
          status: string | null
          total_parcelas: number | null
        }
        Insert: {
          abono_pecuniario?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim: string
          data_inicio: string
          dias_abono?: number | null
          dias_gozados: number
          id?: string
          observacoes?: string | null
          parcela?: number | null
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          portaria_data?: string | null
          portaria_numero?: string | null
          portaria_url?: string | null
          servidor_id: string
          status?: string | null
          total_parcelas?: number | null
        }
        Update: {
          abono_pecuniario?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          dias_abono?: number | null
          dias_gozados?: number
          id?: string
          observacoes?: string | null
          parcela?: number | null
          periodo_aquisitivo_fim?: string
          periodo_aquisitivo_inicio?: string
          portaria_data?: string | null
          portaria_numero?: string | null
          portaria_url?: string | null
          servidor_id?: string
          status?: string | null
          total_parcelas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ferias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ferias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_financeiras: {
        Row: {
          banco_agencia: string | null
          banco_codigo: string | null
          banco_conta: string | null
          banco_nome: string | null
          banco_tipo_conta: string | null
          base_consignavel: number | null
          base_inss: number | null
          base_irrf: number | null
          cargo_id: string | null
          cargo_nome: string | null
          cargo_vencimento: number | null
          centro_custo_codigo: string | null
          centro_custo_id: string | null
          competencia_ano: number | null
          competencia_mes: number | null
          created_at: string | null
          data_processamento: string | null
          folha_id: string | null
          id: string
          inconsistencias: Json | null
          inss_patronal: number | null
          lotacao_id: string | null
          margem_consignavel_usada: number | null
          outras_entidades: number | null
          processado: boolean | null
          quantidade_dependentes: number | null
          rat: number | null
          servidor_id: string | null
          tem_inconsistencia: boolean | null
          tipo_folha: string | null
          total_descontos: number | null
          total_encargos: number | null
          total_proventos: number | null
          unidade_id: string | null
          unidade_nome: string | null
          updated_at: string | null
          valor_deducao_dependentes: number | null
          valor_inss: number | null
          valor_irrf: number | null
          valor_liquido: number | null
        }
        Insert: {
          banco_agencia?: string | null
          banco_codigo?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_tipo_conta?: string | null
          base_consignavel?: number | null
          base_inss?: number | null
          base_irrf?: number | null
          cargo_id?: string | null
          cargo_nome?: string | null
          cargo_vencimento?: number | null
          centro_custo_codigo?: string | null
          centro_custo_id?: string | null
          competencia_ano?: number | null
          competencia_mes?: number | null
          created_at?: string | null
          data_processamento?: string | null
          folha_id?: string | null
          id?: string
          inconsistencias?: Json | null
          inss_patronal?: number | null
          lotacao_id?: string | null
          margem_consignavel_usada?: number | null
          outras_entidades?: number | null
          processado?: boolean | null
          quantidade_dependentes?: number | null
          rat?: number | null
          servidor_id?: string | null
          tem_inconsistencia?: boolean | null
          tipo_folha?: string | null
          total_descontos?: number | null
          total_encargos?: number | null
          total_proventos?: number | null
          unidade_id?: string | null
          unidade_nome?: string | null
          updated_at?: string | null
          valor_deducao_dependentes?: number | null
          valor_inss?: number | null
          valor_irrf?: number | null
          valor_liquido?: number | null
        }
        Update: {
          banco_agencia?: string | null
          banco_codigo?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_tipo_conta?: string | null
          base_consignavel?: number | null
          base_inss?: number | null
          base_irrf?: number | null
          cargo_id?: string | null
          cargo_nome?: string | null
          cargo_vencimento?: number | null
          centro_custo_codigo?: string | null
          centro_custo_id?: string | null
          competencia_ano?: number | null
          competencia_mes?: number | null
          created_at?: string | null
          data_processamento?: string | null
          folha_id?: string | null
          id?: string
          inconsistencias?: Json | null
          inss_patronal?: number | null
          lotacao_id?: string | null
          margem_consignavel_usada?: number | null
          outras_entidades?: number | null
          processado?: boolean | null
          quantidade_dependentes?: number | null
          rat?: number | null
          servidor_id?: string | null
          tem_inconsistencia?: boolean | null
          tipo_folha?: string | null
          total_descontos?: number | null
          total_encargos?: number | null
          total_proventos?: number | null
          unidade_id?: string | null
          unidade_nome?: string | null
          updated_at?: string | null
          valor_deducao_dependentes?: number | null
          valor_inss?: number | null
          valor_irrf?: number | null
          valor_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_financeiras_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_financeiras_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_financeiras_folha_id_fkey"
            columns: ["folha_id"]
            isOneToOne: false
            referencedRelation: "folhas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_financeiras_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "lotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_financeiras_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_financeiras_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_financeiras_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      folhas_pagamento: {
        Row: {
          competencia_ano: number
          competencia_mes: number
          created_at: string | null
          created_by: string | null
          data_fechamento: string | null
          data_processamento: string | null
          fechado_por: string | null
          hash_fechamento: string | null
          id: string
          justificativa_reabertura: string | null
          observacoes: string | null
          processado_por: string | null
          quantidade_reaberturas: number | null
          quantidade_servidores: number | null
          reaberto: boolean | null
          reaberto_em: string | null
          reaberto_por: string | null
          status: Database["public"]["Enums"]["status_folha"] | null
          tempo_processamento_ms: number | null
          tipo_folha: Database["public"]["Enums"]["tipo_folha"]
          total_bruto: number | null
          total_descontos: number | null
          total_encargos_patronais: number | null
          total_inss_patronal: number | null
          total_inss_servidor: number | null
          total_irrf: number | null
          total_liquido: number | null
          updated_at: string | null
        }
        Insert: {
          competencia_ano: number
          competencia_mes: number
          created_at?: string | null
          created_by?: string | null
          data_fechamento?: string | null
          data_processamento?: string | null
          fechado_por?: string | null
          hash_fechamento?: string | null
          id?: string
          justificativa_reabertura?: string | null
          observacoes?: string | null
          processado_por?: string | null
          quantidade_reaberturas?: number | null
          quantidade_servidores?: number | null
          reaberto?: boolean | null
          reaberto_em?: string | null
          reaberto_por?: string | null
          status?: Database["public"]["Enums"]["status_folha"] | null
          tempo_processamento_ms?: number | null
          tipo_folha: Database["public"]["Enums"]["tipo_folha"]
          total_bruto?: number | null
          total_descontos?: number | null
          total_encargos_patronais?: number | null
          total_inss_patronal?: number | null
          total_inss_servidor?: number | null
          total_irrf?: number | null
          total_liquido?: number | null
          updated_at?: string | null
        }
        Update: {
          competencia_ano?: number
          competencia_mes?: number
          created_at?: string | null
          created_by?: string | null
          data_fechamento?: string | null
          data_processamento?: string | null
          fechado_por?: string | null
          hash_fechamento?: string | null
          id?: string
          justificativa_reabertura?: string | null
          observacoes?: string | null
          processado_por?: string | null
          quantidade_reaberturas?: number | null
          quantidade_servidores?: number | null
          reaberto?: boolean | null
          reaberto_em?: string | null
          reaberto_por?: string | null
          status?: Database["public"]["Enums"]["status_folha"] | null
          tempo_processamento_ms?: number | null
          tipo_folha?: Database["public"]["Enums"]["tipo_folha"]
          total_bruto?: number | null
          total_descontos?: number | null
          total_encargos_patronais?: number | null
          total_inss_patronal?: number | null
          total_inss_servidor?: number | null
          total_irrf?: number | null
          total_liquido?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folhas_pagamento_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folhas_pagamento_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folhas_pagamento_fechado_por_fkey"
            columns: ["fechado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folhas_pagamento_fechado_por_fkey"
            columns: ["fechado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folhas_pagamento_processado_por_fkey"
            columns: ["processado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folhas_pagamento_processado_por_fkey"
            columns: ["processado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folhas_pagamento_reaberto_por_fkey"
            columns: ["reaberto_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folhas_pagamento_reaberto_por_fkey"
            columns: ["reaberto_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          banco_codigo: string | null
          banco_nome: string | null
          conta: string | null
          cpf_cnpj: string
          created_at: string | null
          created_by: string | null
          data_cadastro: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome_fantasia: string | null
          observacoes: string | null
          razao_social: string
          representante_cpf: string | null
          representante_email: string | null
          representante_nome: string | null
          representante_telefone: string | null
          site: string | null
          telefone: string | null
          tipo_conta: string | null
          tipo_pessoa: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          banco_codigo?: string | null
          banco_nome?: string | null
          conta?: string | null
          cpf_cnpj: string
          created_at?: string | null
          created_by?: string | null
          data_cadastro?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social: string
          representante_cpf?: string | null
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          site?: string | null
          telefone?: string | null
          tipo_conta?: string | null
          tipo_pessoa: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          banco_codigo?: string | null
          banco_nome?: string | null
          conta?: string | null
          cpf_cnpj?: string
          created_at?: string | null
          created_by?: string | null
          data_cadastro?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social?: string
          representante_cpf?: string | null
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          site?: string | null
          telefone?: string | null
          tipo_conta?: string | null
          tipo_pessoa?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      frequencia_arquivos: {
        Row: {
          ano: number
          arquivo_nome: string
          arquivo_path: string
          arquivo_tamanho: number | null
          created_at: string
          created_by: string | null
          hash_conteudo: string | null
          id: string
          mes: number
          periodo: string
          servidor_id: string | null
          servidor_matricula: string | null
          servidor_nome: string | null
          tipo: string
          unidade_id: string | null
          unidade_nome: string | null
          unidade_sigla: string | null
        }
        Insert: {
          ano: number
          arquivo_nome: string
          arquivo_path: string
          arquivo_tamanho?: number | null
          created_at?: string
          created_by?: string | null
          hash_conteudo?: string | null
          id?: string
          mes: number
          periodo: string
          servidor_id?: string | null
          servidor_matricula?: string | null
          servidor_nome?: string | null
          tipo?: string
          unidade_id?: string | null
          unidade_nome?: string | null
          unidade_sigla?: string | null
        }
        Update: {
          ano?: number
          arquivo_nome?: string
          arquivo_path?: string
          arquivo_tamanho?: number | null
          created_at?: string
          created_by?: string | null
          hash_conteudo?: string | null
          id?: string
          mes?: number
          periodo?: string
          servidor_id?: string | null
          servidor_matricula?: string | null
          servidor_nome?: string | null
          tipo?: string
          unidade_id?: string | null
          unidade_nome?: string | null
          unidade_sigla?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_arquivos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_arquivos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_arquivos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencia_fechamento: {
        Row: {
          ano: number
          assinado_servidor: boolean | null
          assinado_servidor_em: string | null
          consolidado_rh: boolean | null
          consolidado_rh_em: string | null
          consolidado_rh_por: string | null
          created_at: string | null
          id: string
          justificativa_reabertura: string | null
          mes: number
          observacoes: string | null
          reaberto: boolean | null
          reaberto_em: string | null
          reaberto_por: string | null
          servidor_id: string
          updated_at: string | null
          validado_chefia: boolean | null
          validado_chefia_em: string | null
          validado_chefia_por: string | null
        }
        Insert: {
          ano: number
          assinado_servidor?: boolean | null
          assinado_servidor_em?: string | null
          consolidado_rh?: boolean | null
          consolidado_rh_em?: string | null
          consolidado_rh_por?: string | null
          created_at?: string | null
          id?: string
          justificativa_reabertura?: string | null
          mes: number
          observacoes?: string | null
          reaberto?: boolean | null
          reaberto_em?: string | null
          reaberto_por?: string | null
          servidor_id: string
          updated_at?: string | null
          validado_chefia?: boolean | null
          validado_chefia_em?: string | null
          validado_chefia_por?: string | null
        }
        Update: {
          ano?: number
          assinado_servidor?: boolean | null
          assinado_servidor_em?: string | null
          consolidado_rh?: boolean | null
          consolidado_rh_em?: string | null
          consolidado_rh_por?: string | null
          created_at?: string | null
          id?: string
          justificativa_reabertura?: string | null
          mes?: number
          observacoes?: string | null
          reaberto?: boolean | null
          reaberto_em?: string | null
          reaberto_por?: string | null
          servidor_id?: string
          updated_at?: string | null
          validado_chefia?: boolean | null
          validado_chefia_em?: string | null
          validado_chefia_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_fechamento_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_fechamento_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencia_mensal: {
        Row: {
          ano: number
          created_at: string | null
          data_fechamento: string | null
          dias_atestado: number | null
          dias_falta: number | null
          dias_ferias: number | null
          dias_folga: number | null
          dias_licenca: number | null
          dias_trabalhados: number | null
          fechado: boolean | null
          horas_devidas: number | null
          horas_extras: number | null
          horas_trabalhadas: number | null
          id: string
          mes: number
          percentual_presenca: number | null
          servidor_id: string
          total_atrasos: number | null
          total_saidas_antecipadas: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          data_fechamento?: string | null
          dias_atestado?: number | null
          dias_falta?: number | null
          dias_ferias?: number | null
          dias_folga?: number | null
          dias_licenca?: number | null
          dias_trabalhados?: number | null
          fechado?: boolean | null
          horas_devidas?: number | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          mes: number
          percentual_presenca?: number | null
          servidor_id: string
          total_atrasos?: number | null
          total_saidas_antecipadas?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          data_fechamento?: string | null
          dias_atestado?: number | null
          dias_falta?: number | null
          dias_ferias?: number | null
          dias_folga?: number | null
          dias_licenca?: number | null
          dias_trabalhados?: number | null
          fechado?: boolean | null
          horas_devidas?: number | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          mes?: number
          percentual_presenca?: number | null
          servidor_id?: string
          total_atrasos?: number | null
          total_saidas_antecipadas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_mensal_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_mensal_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencia_pacotes: {
        Row: {
          agrupamento_id: string | null
          agrupamento_nome: string | null
          ano: number
          arquivo_nome: string | null
          arquivo_path: string | null
          arquivo_tamanho: number | null
          created_at: string
          created_by: string | null
          erro_mensagem: string | null
          gerado_em: string | null
          id: string
          link_download: string | null
          link_expira_em: string | null
          mes: number
          periodo: string
          status: string
          tipo: string
          total_arquivos: number | null
          unidade_id: string | null
          unidade_nome: string | null
          updated_at: string
        }
        Insert: {
          agrupamento_id?: string | null
          agrupamento_nome?: string | null
          ano: number
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          created_at?: string
          created_by?: string | null
          erro_mensagem?: string | null
          gerado_em?: string | null
          id?: string
          link_download?: string | null
          link_expira_em?: string | null
          mes: number
          periodo: string
          status?: string
          tipo?: string
          total_arquivos?: number | null
          unidade_id?: string | null
          unidade_nome?: string | null
          updated_at?: string
        }
        Update: {
          agrupamento_id?: string | null
          agrupamento_nome?: string | null
          ano?: number
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          created_at?: string
          created_by?: string | null
          erro_mensagem?: string | null
          gerado_em?: string | null
          id?: string
          link_download?: string | null
          link_expira_em?: string | null
          mes?: number
          periodo?: string
          status?: string
          tipo?: string
          total_arquivos?: number | null
          unidade_id?: string | null
          unidade_nome?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_pacotes_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "config_agrupamento_unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_pacotes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      funcoes_sistema: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          funcao_pai_id: string | null
          icone: string | null
          id: string
          modulo: string
          nome: string
          ordem: number
          rota: string | null
          submodulo: string | null
          tipo_acao: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          funcao_pai_id?: string | null
          icone?: string | null
          id?: string
          modulo: string
          nome: string
          ordem?: number
          rota?: string | null
          submodulo?: string | null
          tipo_acao?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          funcao_pai_id?: string | null
          icone?: string | null
          id?: string
          modulo?: string
          nome?: string
          ordem?: number
          rota?: string | null
          submodulo?: string | null
          tipo_acao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcoes_sistema_funcao_pai_id_fkey"
            columns: ["funcao_pai_id"]
            isOneToOne: false
            referencedRelation: "funcoes_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_conteudo_oficial: {
        Row: {
          conteudo: string
          conteudo_estruturado: Json | null
          created_at: string | null
          documento_aprovacao_url: string | null
          id: string
          identificador: string | null
          justificativa: string | null
          promovido_em: string | null
          promovido_por: string | null
          tipo: Database["public"]["Enums"]["tipo_conteudo_institucional"]
          titulo: string | null
          versao: number
        }
        Insert: {
          conteudo: string
          conteudo_estruturado?: Json | null
          created_at?: string | null
          documento_aprovacao_url?: string | null
          id?: string
          identificador?: string | null
          justificativa?: string | null
          promovido_em?: string | null
          promovido_por?: string | null
          tipo: Database["public"]["Enums"]["tipo_conteudo_institucional"]
          titulo?: string | null
          versao?: number
        }
        Update: {
          conteudo?: string
          conteudo_estruturado?: Json | null
          created_at?: string | null
          documento_aprovacao_url?: string | null
          id?: string
          identificador?: string | null
          justificativa?: string | null
          promovido_em?: string | null
          promovido_por?: string | null
          tipo?: Database["public"]["Enums"]["tipo_conteudo_institucional"]
          titulo?: string | null
          versao?: number
        }
        Relationships: []
      }
      historico_convites_reuniao: {
        Row: {
          assunto: string | null
          conteudo: string | null
          created_at: string | null
          created_by: string | null
          data_envio: string | null
          destinatario: string
          erro_envio: string | null
          id: string
          modelo_id: string | null
          participante_id: string
          reuniao_id: string
          status_envio: string | null
          tipo_envio: string
        }
        Insert: {
          assunto?: string | null
          conteudo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_envio?: string | null
          destinatario: string
          erro_envio?: string | null
          id?: string
          modelo_id?: string | null
          participante_id: string
          reuniao_id: string
          status_envio?: string | null
          tipo_envio?: string
        }
        Update: {
          assunto?: string | null
          conteudo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_envio?: string | null
          destinatario?: string
          erro_envio?: string | null
          id?: string
          modelo_id?: string | null
          participante_id?: string
          reuniao_id?: string
          status_envio?: string | null
          tipo_envio?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_convites_reuniao_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos_mensagem_reuniao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_convites_reuniao_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes_reuniao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_convites_reuniao_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_funcional: {
        Row: {
          cargo_anterior_id: string | null
          cargo_novo_id: string | null
          created_at: string | null
          created_by: string | null
          data_evento: string
          data_vigencia_fim: string | null
          data_vigencia_inicio: string | null
          descricao: string | null
          diario_oficial_data: string | null
          diario_oficial_numero: string | null
          documento_url: string | null
          fundamentacao_legal: string | null
          id: string
          observacoes: string | null
          portaria_data: string | null
          portaria_numero: string | null
          servidor_id: string
          tipo: Database["public"]["Enums"]["tipo_movimentacao_funcional"]
          unidade_anterior_id: string | null
          unidade_nova_id: string | null
        }
        Insert: {
          cargo_anterior_id?: string | null
          cargo_novo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_evento: string
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          descricao?: string | null
          diario_oficial_data?: string | null
          diario_oficial_numero?: string | null
          documento_url?: string | null
          fundamentacao_legal?: string | null
          id?: string
          observacoes?: string | null
          portaria_data?: string | null
          portaria_numero?: string | null
          servidor_id: string
          tipo: Database["public"]["Enums"]["tipo_movimentacao_funcional"]
          unidade_anterior_id?: string | null
          unidade_nova_id?: string | null
        }
        Update: {
          cargo_anterior_id?: string | null
          cargo_novo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_evento?: string
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          descricao?: string | null
          diario_oficial_data?: string | null
          diario_oficial_numero?: string | null
          documento_url?: string | null
          fundamentacao_legal?: string | null
          id?: string
          observacoes?: string | null
          portaria_data?: string | null
          portaria_numero?: string | null
          servidor_id?: string
          tipo?: Database["public"]["Enums"]["tipo_movimentacao_funcional"]
          unidade_anterior_id?: string | null
          unidade_nova_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_funcional_cargo_anterior_id_fkey"
            columns: ["cargo_anterior_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_funcional_cargo_novo_id_fkey"
            columns: ["cargo_novo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_funcional_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_funcional_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_funcional_unidade_anterior_id_fkey"
            columns: ["unidade_anterior_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_funcional_unidade_nova_id_fkey"
            columns: ["unidade_nova_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_lai: {
        Row: {
          created_at: string | null
          created_by: string | null
          dados_adicionais: Json | null
          id: string
          ip_address: unknown
          justificativa: string | null
          observacao: string | null
          prazo_anterior: string | null
          prazo_novo: string | null
          responsavel_anterior_id: string | null
          responsavel_novo_id: string | null
          solicitacao_id: string
          status_anterior: string | null
          status_novo: string | null
          tipo_evento: Database["public"]["Enums"]["tipo_evento_lai"]
          unidade_anterior_id: string | null
          unidade_nova_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dados_adicionais?: Json | null
          id?: string
          ip_address?: unknown
          justificativa?: string | null
          observacao?: string | null
          prazo_anterior?: string | null
          prazo_novo?: string | null
          responsavel_anterior_id?: string | null
          responsavel_novo_id?: string | null
          solicitacao_id: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo_evento: Database["public"]["Enums"]["tipo_evento_lai"]
          unidade_anterior_id?: string | null
          unidade_nova_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dados_adicionais?: Json | null
          id?: string
          ip_address?: unknown
          justificativa?: string | null
          observacao?: string | null
          prazo_anterior?: string | null
          prazo_novo?: string | null
          responsavel_anterior_id?: string | null
          responsavel_novo_id?: string | null
          solicitacao_id?: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo_evento?: Database["public"]["Enums"]["tipo_evento_lai"]
          unidade_anterior_id?: string | null
          unidade_nova_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_lai_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_sic"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_jornada: {
        Row: {
          configuracao_id: string
          dia_semana: number
          entrada1: string | null
          entrada2: string | null
          id: string
          saida1: string | null
          saida2: string | null
        }
        Insert: {
          configuracao_id: string
          dia_semana: number
          entrada1?: string | null
          entrada2?: string | null
          id?: string
          saida1?: string | null
          saida2?: string | null
        }
        Update: {
          configuracao_id?: string
          dia_semana?: number
          entrada1?: string | null
          entrada2?: string | null
          id?: string
          saida1?: string | null
          saida2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horarios_jornada_configuracao_id_fkey"
            columns: ["configuracao_id"]
            isOneToOne: false
            referencedRelation: "configuracao_jornada"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_ata_registro_preco: {
        Row: {
          ata_id: string
          created_at: string | null
          descricao: string
          id: string
          item_licitatorio_id: string | null
          marca: string | null
          modelo: string | null
          numero_item: number
          quantidade_consumida: number | null
          quantidade_registrada: number
          saldo_quantidade: number | null
          situacao: string | null
          unidade_medida: string
          updated_at: string | null
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          ata_id: string
          created_at?: string | null
          descricao: string
          id?: string
          item_licitatorio_id?: string | null
          marca?: string | null
          modelo?: string | null
          numero_item: number
          quantidade_consumida?: number | null
          quantidade_registrada: number
          saldo_quantidade?: number | null
          situacao?: string | null
          unidade_medida: string
          updated_at?: string | null
          valor_total?: number | null
          valor_unitario: number
        }
        Update: {
          ata_id?: string
          created_at?: string | null
          descricao?: string
          id?: string
          item_licitatorio_id?: string | null
          marca?: string | null
          modelo?: string | null
          numero_item?: number
          quantidade_consumida?: number | null
          quantidade_registrada?: number
          saldo_quantidade?: number | null
          situacao?: string | null
          unidade_medida?: string
          updated_at?: string | null
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_ata_registro_preco_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "atas_registro_preco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_ata_registro_preco_item_licitatorio_id_fkey"
            columns: ["item_licitatorio_id"]
            isOneToOne: false
            referencedRelation: "itens_processo_licitatorio"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_checklist: {
        Row: {
          ativo: boolean
          categoria: string | null
          checklist_id: string
          created_at: string
          created_by: string | null
          descricao: string
          fundamentacao_legal: string | null
          id: string
          numero_item: string
          obrigatorio: boolean
          ordem: number
          peso: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          checklist_id: string
          created_at?: string
          created_by?: string | null
          descricao: string
          fundamentacao_legal?: string | null
          id?: string
          numero_item: string
          obrigatorio?: boolean
          ordem?: number
          peso?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          checklist_id?: string
          created_at?: string
          created_by?: string | null
          descricao?: string
          fundamentacao_legal?: string | null
          id?: string
          numero_item?: string
          obrigatorio?: boolean
          ordem?: number
          peso?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_checklist_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists_conformidade"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_contrato: {
        Row: {
          contrato_id: string
          created_at: string | null
          descricao: string
          id: string
          item_ata_id: string | null
          numero_item: number
          quantidade: number
          quantidade_entregue: number | null
          saldo_quantidade: number | null
          situacao: string | null
          unidade_medida: string
          updated_at: string | null
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          contrato_id: string
          created_at?: string | null
          descricao: string
          id?: string
          item_ata_id?: string | null
          numero_item: number
          quantidade: number
          quantidade_entregue?: number | null
          saldo_quantidade?: number | null
          situacao?: string | null
          unidade_medida: string
          updated_at?: string | null
          valor_total?: number | null
          valor_unitario: number
        }
        Update: {
          contrato_id?: string
          created_at?: string | null
          descricao?: string
          id?: string
          item_ata_id?: string | null
          numero_item?: number
          quantidade?: number
          quantidade_entregue?: number | null
          saldo_quantidade?: number | null
          situacao?: string | null
          unidade_medida?: string
          updated_at?: string | null
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_contrato_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_contrato_item_ata_id_fkey"
            columns: ["item_ata_id"]
            isOneToOne: false
            referencedRelation: "itens_ata_registro_preco"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_ficha_financeira: {
        Row: {
          base_calculo: number | null
          created_at: string | null
          descricao: string
          ficha_id: string
          id: string
          ordem: number | null
          percentual: number | null
          referencia: string | null
          rubrica_id: string | null
          tipo: string
          valor: number
        }
        Insert: {
          base_calculo?: number | null
          created_at?: string | null
          descricao: string
          ficha_id: string
          id?: string
          ordem?: number | null
          percentual?: number | null
          referencia?: string | null
          rubrica_id?: string | null
          tipo: string
          valor?: number
        }
        Update: {
          base_calculo?: number | null
          created_at?: string | null
          descricao?: string
          ficha_id?: string
          id?: string
          ordem?: number | null
          percentual?: number | null
          referencia?: string | null
          rubrica_id?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_ficha_financeira_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_ficha_financeira_rubrica_id_fkey"
            columns: ["rubrica_id"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_licitacao: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          numero_item: number
          observacoes: string | null
          processo_id: string
          quantidade: number
          situacao: string | null
          unidade_medida: string | null
          valor_total_estimado: number | null
          valor_total_final: number | null
          valor_unitario_estimado: number | null
          valor_unitario_final: number | null
          vencedor_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          numero_item: number
          observacoes?: string | null
          processo_id: string
          quantidade?: number
          situacao?: string | null
          unidade_medida?: string | null
          valor_total_estimado?: number | null
          valor_total_final?: number | null
          valor_unitario_estimado?: number | null
          valor_unitario_final?: number | null
          vencedor_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          numero_item?: number
          observacoes?: string | null
          processo_id?: string
          quantidade?: number
          situacao?: string | null
          unidade_medida?: string | null
          valor_total_estimado?: number | null
          valor_total_final?: number | null
          valor_unitario_estimado?: number | null
          valor_unitario_final?: number | null
          vencedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_licitacao_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_licitacao_vencedor_id_fkey"
            columns: ["vencedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_material: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          codigo: string
          created_at: string | null
          descricao: string
          especificacao: string | null
          estoque_maximo: number | null
          estoque_minimo: number | null
          id: string
          ponto_reposicao: number | null
          ultimo_valor_compra: number | null
          unidade_medida: string
          updated_at: string | null
          valor_unitario_medio: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          codigo: string
          created_at?: string | null
          descricao: string
          especificacao?: string | null
          estoque_maximo?: number | null
          estoque_minimo?: number | null
          id?: string
          ponto_reposicao?: number | null
          ultimo_valor_compra?: number | null
          unidade_medida: string
          updated_at?: string | null
          valor_unitario_medio?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          especificacao?: string | null
          estoque_maximo?: number | null
          estoque_minimo?: number | null
          id?: string
          ponto_reposicao?: number | null
          ultimo_valor_compra?: number | null
          unidade_medida?: string
          updated_at?: string | null
          valor_unitario_medio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_material_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_material"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_processo_licitatorio: {
        Row: {
          catmat_catser: string | null
          created_at: string | null
          descricao: string
          especificacao_tecnica: string | null
          id: string
          marca_referencia: string | null
          numero_item: number
          observacoes: string | null
          processo_id: string
          quantidade: number
          situacao: string | null
          unidade_medida: string
          updated_at: string | null
          valor_estimado_total: number | null
          valor_estimado_unitario: number | null
        }
        Insert: {
          catmat_catser?: string | null
          created_at?: string | null
          descricao: string
          especificacao_tecnica?: string | null
          id?: string
          marca_referencia?: string | null
          numero_item: number
          observacoes?: string | null
          processo_id: string
          quantidade: number
          situacao?: string | null
          unidade_medida: string
          updated_at?: string | null
          valor_estimado_total?: number | null
          valor_estimado_unitario?: number | null
        }
        Update: {
          catmat_catser?: string | null
          created_at?: string | null
          descricao?: string
          especificacao_tecnica?: string | null
          id?: string
          marca_referencia?: string | null
          numero_item?: number
          observacoes?: string | null
          processo_id?: string
          quantidade?: number
          situacao?: string | null
          unidade_medida?: string
          updated_at?: string | null
          valor_estimado_total?: number | null
          valor_estimado_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_processo_licitatorio_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_retorno_bancario: {
        Row: {
          codigo_ocorrencia: string | null
          created_at: string | null
          data_pagamento: string | null
          descricao_ocorrencia: string | null
          ficha_id: string | null
          id: string
          retorno_id: string
          servidor_id: string | null
          status: string | null
          valor: number | null
        }
        Insert: {
          codigo_ocorrencia?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao_ocorrencia?: string | null
          ficha_id?: string | null
          id?: string
          retorno_id: string
          servidor_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Update: {
          codigo_ocorrencia?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao_ocorrencia?: string | null
          ficha_id?: string | null
          id?: string
          retorno_id?: string
          servidor_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_retorno_bancario_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_retorno_bancario_retorno_id_fkey"
            columns: ["retorno_id"]
            isOneToOne: false
            referencedRelation: "retornos_bancarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_retorno_bancario_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_retorno_bancario_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      justificativas_ponto: {
        Row: {
          aprovador_id: string | null
          arquivo_url: string | null
          created_at: string | null
          data_aprovacao: string | null
          descricao: string
          id: string
          observacao_aprovador: string | null
          registro_ponto_id: string
          status: Database["public"]["Enums"]["status_solicitacao"] | null
          tipo: Database["public"]["Enums"]["tipo_justificativa"]
          updated_at: string | null
        }
        Insert: {
          aprovador_id?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          descricao: string
          id?: string
          observacao_aprovador?: string | null
          registro_ponto_id: string
          status?: Database["public"]["Enums"]["status_solicitacao"] | null
          tipo: Database["public"]["Enums"]["tipo_justificativa"]
          updated_at?: string | null
        }
        Update: {
          aprovador_id?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          descricao?: string
          id?: string
          observacao_aprovador?: string | null
          registro_ponto_id?: string
          status?: Database["public"]["Enums"]["status_solicitacao"] | null
          tipo?: Database["public"]["Enums"]["tipo_justificativa"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "justificativas_ponto_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justificativas_ponto_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justificativas_ponto_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_banco_horas: {
        Row: {
          banco_horas_id: string
          created_at: string | null
          data: string
          horas: number
          id: string
          motivo: string | null
          registro_ponto_id: string | null
          tipo: Database["public"]["Enums"]["tipo_lancamento_horas"]
        }
        Insert: {
          banco_horas_id: string
          created_at?: string | null
          data: string
          horas: number
          id?: string
          motivo?: string | null
          registro_ponto_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_lancamento_horas"]
        }
        Update: {
          banco_horas_id?: string
          created_at?: string | null
          data?: string
          horas?: number
          id?: string
          motivo?: string | null
          registro_ponto_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_lancamento_horas"]
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_banco_horas_banco_horas_id_fkey"
            columns: ["banco_horas_id"]
            isOneToOne: false
            referencedRelation: "banco_horas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_banco_horas_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_folha: {
        Row: {
          competencia_referencia: string | null
          created_at: string | null
          ficha_id: string | null
          id: string
          incidiu_inss: boolean | null
          incidiu_irrf: boolean | null
          observacao: string | null
          origem: Database["public"]["Enums"]["origem_lancamento"] | null
          referencia: number | null
          rubrica_codigo: string
          rubrica_descricao: string
          rubrica_id: string | null
          rubrica_tipo: Database["public"]["Enums"]["tipo_rubrica"]
          valor_base: number | null
          valor_calculado: number
        }
        Insert: {
          competencia_referencia?: string | null
          created_at?: string | null
          ficha_id?: string | null
          id?: string
          incidiu_inss?: boolean | null
          incidiu_irrf?: boolean | null
          observacao?: string | null
          origem?: Database["public"]["Enums"]["origem_lancamento"] | null
          referencia?: number | null
          rubrica_codigo: string
          rubrica_descricao: string
          rubrica_id?: string | null
          rubrica_tipo: Database["public"]["Enums"]["tipo_rubrica"]
          valor_base?: number | null
          valor_calculado: number
        }
        Update: {
          competencia_referencia?: string | null
          created_at?: string | null
          ficha_id?: string | null
          id?: string
          incidiu_inss?: boolean | null
          incidiu_irrf?: boolean | null
          observacao?: string | null
          origem?: Database["public"]["Enums"]["origem_lancamento"] | null
          referencia?: number | null
          rubrica_codigo?: string
          rubrica_descricao?: string
          rubrica_id?: string | null
          rubrica_tipo?: Database["public"]["Enums"]["tipo_rubrica"]
          valor_base?: number | null
          valor_calculado?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_folha_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_folha_rubrica_id_fkey"
            columns: ["rubrica_id"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["id"]
          },
        ]
      }
      licencas_afastamentos: {
        Row: {
          cid: string | null
          created_at: string | null
          created_by: string | null
          crm: string | null
          data_fim: string | null
          data_inicio: string
          dias_afastamento: number | null
          documento_comprobatorio_url: string | null
          fundamentacao_legal: string | null
          id: string
          medico_nome: string | null
          observacoes: string | null
          onus_origem: boolean | null
          orgao_destino: string | null
          portaria_data: string | null
          portaria_numero: string | null
          portaria_url: string | null
          servidor_id: string
          status: string | null
          tipo_afastamento: Database["public"]["Enums"]["tipo_afastamento"]
          tipo_licenca: Database["public"]["Enums"]["tipo_licenca"] | null
        }
        Insert: {
          cid?: string | null
          created_at?: string | null
          created_by?: string | null
          crm?: string | null
          data_fim?: string | null
          data_inicio: string
          dias_afastamento?: number | null
          documento_comprobatorio_url?: string | null
          fundamentacao_legal?: string | null
          id?: string
          medico_nome?: string | null
          observacoes?: string | null
          onus_origem?: boolean | null
          orgao_destino?: string | null
          portaria_data?: string | null
          portaria_numero?: string | null
          portaria_url?: string | null
          servidor_id: string
          status?: string | null
          tipo_afastamento: Database["public"]["Enums"]["tipo_afastamento"]
          tipo_licenca?: Database["public"]["Enums"]["tipo_licenca"] | null
        }
        Update: {
          cid?: string | null
          created_at?: string | null
          created_by?: string | null
          crm?: string | null
          data_fim?: string | null
          data_inicio?: string
          dias_afastamento?: number | null
          documento_comprobatorio_url?: string | null
          fundamentacao_legal?: string | null
          id?: string
          medico_nome?: string | null
          observacoes?: string | null
          onus_origem?: boolean | null
          orgao_destino?: string | null
          portaria_data?: string | null
          portaria_numero?: string | null
          portaria_url?: string | null
          servidor_id?: string
          status?: string | null
          tipo_afastamento?: Database["public"]["Enums"]["tipo_afastamento"]
          tipo_licenca?: Database["public"]["Enums"]["tipo_licenca"] | null
        }
        Relationships: [
          {
            foreignKeyName: "licencas_afastamentos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licencas_afastamentos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidacoes: {
        Row: {
          atestado_por: string | null
          created_at: string | null
          created_by: string | null
          data_atestado: string | null
          data_liquidacao: string
          data_nota_fiscal: string | null
          empenho_id: string
          id: string
          medicao_id: string | null
          nota_fiscal: string | null
          numero_liquidacao: string
          observacao: string | null
          outras_retencoes: number | null
          retencao_inss: number | null
          retencao_irrf: number | null
          retencao_iss: number | null
          situacao: string | null
          updated_at: string | null
          valor_liquidado: number
          valor_liquido: number | null
          valor_retido: number
        }
        Insert: {
          atestado_por?: string | null
          created_at?: string | null
          created_by?: string | null
          data_atestado?: string | null
          data_liquidacao: string
          data_nota_fiscal?: string | null
          empenho_id: string
          id?: string
          medicao_id?: string | null
          nota_fiscal?: string | null
          numero_liquidacao: string
          observacao?: string | null
          outras_retencoes?: number | null
          retencao_inss?: number | null
          retencao_irrf?: number | null
          retencao_iss?: number | null
          situacao?: string | null
          updated_at?: string | null
          valor_liquidado: number
          valor_liquido?: number | null
          valor_retido?: number
        }
        Update: {
          atestado_por?: string | null
          created_at?: string | null
          created_by?: string | null
          data_atestado?: string | null
          data_liquidacao?: string
          data_nota_fiscal?: string | null
          empenho_id?: string
          id?: string
          medicao_id?: string | null
          nota_fiscal?: string | null
          numero_liquidacao?: string
          observacao?: string | null
          outras_retencoes?: number | null
          retencao_inss?: number | null
          retencao_irrf?: number | null
          retencao_iss?: number | null
          situacao?: string | null
          updated_at?: string | null
          valor_liquidado?: number
          valor_liquido?: number | null
          valor_retido?: number
        }
        Relationships: [
          {
            foreignKeyName: "liquidacoes_atestado_por_fkey"
            columns: ["atestado_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacoes_atestado_por_fkey"
            columns: ["atestado_por"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacoes_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "empenhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacoes_medicao_id_fkey"
            columns: ["medicao_id"]
            isOneToOne: false
            referencedRelation: "medicoes_contrato"
            referencedColumns: ["id"]
          },
        ]
      }
      lotacoes: {
        Row: {
          ativo: boolean | null
          ato_data: string | null
          ato_doe_data: string | null
          ato_doe_numero: string | null
          ato_numero: string | null
          ato_tipo: string | null
          ato_url: string | null
          cargo_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          documento_referencia: string | null
          funcao_exercida: string | null
          id: string
          observacao: string | null
          orgao_externo: string | null
          servidor_id: string
          tipo_lotacao: Database["public"]["Enums"]["tipo_lotacao"] | null
          tipo_movimentacao: string | null
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          ato_data?: string | null
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_numero?: string | null
          ato_tipo?: string | null
          ato_url?: string | null
          cargo_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          documento_referencia?: string | null
          funcao_exercida?: string | null
          id?: string
          observacao?: string | null
          orgao_externo?: string | null
          servidor_id: string
          tipo_lotacao?: Database["public"]["Enums"]["tipo_lotacao"] | null
          tipo_movimentacao?: string | null
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          ato_data?: string | null
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_numero?: string | null
          ato_tipo?: string | null
          ato_url?: string | null
          cargo_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          documento_referencia?: string | null
          funcao_exercida?: string | null
          id?: string
          observacao?: string | null
          orgao_externo?: string | null
          servidor_id?: string
          tipo_lotacao?: Database["public"]["Enums"]["tipo_lotacao"] | null
          tipo_movimentacao?: string | null
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotacoes_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotacoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_raci_atribuicoes: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          etapa_processo: string | null
          id: string
          observacoes: string | null
          papel_id: string
          processo_id: string
          tipo_papel: Database["public"]["Enums"]["tipo_papel_raci"]
          updated_at: string
          updated_by: string | null
          versao: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          etapa_processo?: string | null
          id?: string
          observacoes?: string | null
          papel_id: string
          processo_id: string
          tipo_papel: Database["public"]["Enums"]["tipo_papel_raci"]
          updated_at?: string
          updated_by?: string | null
          versao?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          etapa_processo?: string | null
          id?: string
          observacoes?: string | null
          papel_id?: string
          processo_id?: string
          tipo_papel?: Database["public"]["Enums"]["tipo_papel_raci"]
          updated_at?: string
          updated_by?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "matriz_raci_atribuicoes_papel_id_fkey"
            columns: ["papel_id"]
            isOneToOne: false
            referencedRelation: "matriz_raci_papeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriz_raci_atribuicoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "matriz_raci_processos"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_raci_papeis: {
        Row: {
          ativo: boolean
          cargo_id: string | null
          codigo: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          unidade_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          cargo_id?: string | null
          codigo: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          unidade_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          cargo_id?: string | null
          codigo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          unidade_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matriz_raci_papeis_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriz_raci_papeis_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_raci_processos: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          modulo_sistema: string | null
          nome: string
          updated_at: string
          updated_by: string | null
          versao: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          modulo_sistema?: string | null
          nome: string
          updated_at?: string
          updated_by?: string | null
          versao?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          modulo_sistema?: string | null
          nome?: string
          updated_at?: string
          updated_by?: string | null
          versao?: number
        }
        Relationships: []
      }
      medicoes_contrato: {
        Row: {
          aprovado_por: string | null
          contrato_id: string
          created_at: string | null
          created_by: string | null
          data_aprovacao: string | null
          data_envio: string | null
          data_pagamento: string | null
          id: string
          motivo_rejeicao: string | null
          nota_fiscal_data: string | null
          nota_fiscal_numero: string | null
          nota_fiscal_valor: number | null
          numero_medicao: number
          observacoes: string | null
          periodo_fim: string
          periodo_inicio: string
          status: Database["public"]["Enums"]["status_medicao"] | null
          valor_aprovado: number | null
          valor_medido: number
        }
        Insert: {
          aprovado_por?: string | null
          contrato_id: string
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          data_envio?: string | null
          data_pagamento?: string | null
          id?: string
          motivo_rejeicao?: string | null
          nota_fiscal_data?: string | null
          nota_fiscal_numero?: string | null
          nota_fiscal_valor?: number | null
          numero_medicao: number
          observacoes?: string | null
          periodo_fim: string
          periodo_inicio: string
          status?: Database["public"]["Enums"]["status_medicao"] | null
          valor_aprovado?: number | null
          valor_medido: number
        }
        Update: {
          aprovado_por?: string | null
          contrato_id?: string
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          data_envio?: string | null
          data_pagamento?: string | null
          id?: string
          motivo_rejeicao?: string | null
          nota_fiscal_data?: string | null
          nota_fiscal_numero?: string | null
          nota_fiscal_valor?: number | null
          numero_medicao?: number
          observacoes?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          status?: Database["public"]["Enums"]["status_medicao"] | null
          valor_aprovado?: number | null
          valor_medido?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicoes_contrato_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_contrato_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_contrato_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      memorandos_lotacao: {
        Row: {
          ano: number
          assinatura_recebimento: string | null
          cargo_id: string | null
          cargo_nome: string | null
          created_at: string | null
          data_emissao: string
          data_entrega: string | null
          data_inicio_exercicio: string
          documento_url: string | null
          emitido_por: string | null
          emitido_por_nome: string | null
          entregue: boolean | null
          id: string
          lotacao_id: string
          numero_protocolo: string
          observacoes: string | null
          observacoes_entrega: string | null
          recebido_por: string | null
          servidor_id: string
          servidor_matricula: string | null
          servidor_nome: string
          status: string | null
          tipo_movimentacao: string
          unidade_destino_id: string
          unidade_destino_nome: string
          updated_at: string | null
        }
        Insert: {
          ano?: number
          assinatura_recebimento?: string | null
          cargo_id?: string | null
          cargo_nome?: string | null
          created_at?: string | null
          data_emissao?: string
          data_entrega?: string | null
          data_inicio_exercicio: string
          documento_url?: string | null
          emitido_por?: string | null
          emitido_por_nome?: string | null
          entregue?: boolean | null
          id?: string
          lotacao_id: string
          numero_protocolo: string
          observacoes?: string | null
          observacoes_entrega?: string | null
          recebido_por?: string | null
          servidor_id: string
          servidor_matricula?: string | null
          servidor_nome: string
          status?: string | null
          tipo_movimentacao: string
          unidade_destino_id: string
          unidade_destino_nome: string
          updated_at?: string | null
        }
        Update: {
          ano?: number
          assinatura_recebimento?: string | null
          cargo_id?: string | null
          cargo_nome?: string | null
          created_at?: string | null
          data_emissao?: string
          data_entrega?: string | null
          data_inicio_exercicio?: string
          documento_url?: string | null
          emitido_por?: string | null
          emitido_por_nome?: string | null
          entregue?: boolean | null
          id?: string
          lotacao_id?: string
          numero_protocolo?: string
          observacoes?: string | null
          observacoes_entrega?: string | null
          recebido_por?: string | null
          servidor_id?: string
          servidor_matricula?: string | null
          servidor_nome?: string
          status?: string | null
          tipo_movimentacao?: string
          unidade_destino_id?: string
          unidade_destino_nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memorandos_lotacao_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorandos_lotacao_emitido_por_fkey"
            columns: ["emitido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorandos_lotacao_emitido_por_fkey"
            columns: ["emitido_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorandos_lotacao_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "lotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorandos_lotacao_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorandos_lotacao_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorandos_lotacao_unidade_destino_id_fkey"
            columns: ["unidade_destino_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_mensagem_reuniao: {
        Row: {
          assunto: string
          ativo: boolean | null
          conteudo_html: string
          created_at: string | null
          created_by: string | null
          id: string
          nome: string
          padrao: boolean | null
          tipo: string
          updated_at: string | null
          variaveis_disponiveis: string[] | null
        }
        Insert: {
          assunto: string
          ativo?: boolean | null
          conteudo_html: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          nome: string
          padrao?: boolean | null
          tipo?: string
          updated_at?: string | null
          variaveis_disponiveis?: string[] | null
        }
        Update: {
          assunto?: string
          ativo?: boolean | null
          conteudo_html?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          nome?: string
          padrao?: boolean | null
          tipo?: string
          updated_at?: string | null
          variaveis_disponiveis?: string[] | null
        }
        Relationships: []
      }
      module_access_scopes: {
        Row: {
          access_scope: Database["public"]["Enums"]["access_scope"]
          can_approve: boolean | null
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          created_at: string | null
          id: string
          module_name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          access_scope?: Database["public"]["Enums"]["access_scope"]
          can_approve?: boolean | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          created_at?: string | null
          id?: string
          module_name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          access_scope?: Database["public"]["Enums"]["access_scope"]
          can_approve?: boolean | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          created_at?: string | null
          id?: string
          module_name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      movimentacoes_bem: {
        Row: {
          bem_id: string
          created_at: string | null
          created_by: string | null
          data_movimentacao: string
          data_previsao_retorno: string | null
          data_retorno: string | null
          id: string
          motivo: string | null
          numero_termo: string | null
          observacao: string | null
          responsavel_destino_id: string | null
          responsavel_origem_id: string | null
          tipo: string
          unidade_destino_id: string | null
          unidade_origem_id: string | null
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          bem_id: string
          created_at?: string | null
          created_by?: string | null
          data_movimentacao: string
          data_previsao_retorno?: string | null
          data_retorno?: string | null
          id?: string
          motivo?: string | null
          numero_termo?: string | null
          observacao?: string | null
          responsavel_destino_id?: string | null
          responsavel_origem_id?: string | null
          tipo: string
          unidade_destino_id?: string | null
          unidade_origem_id?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          bem_id?: string
          created_at?: string | null
          created_by?: string | null
          data_movimentacao?: string
          data_previsao_retorno?: string | null
          data_retorno?: string | null
          id?: string
          motivo?: string | null
          numero_termo?: string | null
          observacao?: string | null
          responsavel_destino_id?: string | null
          responsavel_origem_id?: string | null
          tipo?: string
          unidade_destino_id?: string | null
          unidade_origem_id?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_bem_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_bem_responsavel_destino_id_fkey"
            columns: ["responsavel_destino_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_bem_responsavel_destino_id_fkey"
            columns: ["responsavel_destino_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_bem_responsavel_origem_id_fkey"
            columns: ["responsavel_origem_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_bem_responsavel_origem_id_fkey"
            columns: ["responsavel_origem_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_bem_unidade_destino_id_fkey"
            columns: ["unidade_destino_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_bem_unidade_origem_id_fkey"
            columns: ["unidade_origem_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          almoxarifado_destino_id: string | null
          almoxarifado_id: string
          created_at: string | null
          created_by: string | null
          empenho_id: string | null
          id: string
          item_id: string
          nota_fiscal: string | null
          observacao: string | null
          quantidade: number
          requisicao_id: string | null
          servidor_responsavel_id: string | null
          setor_destino_id: string | null
          subtipo: string | null
          tipo: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          almoxarifado_destino_id?: string | null
          almoxarifado_id: string
          created_at?: string | null
          created_by?: string | null
          empenho_id?: string | null
          id?: string
          item_id: string
          nota_fiscal?: string | null
          observacao?: string | null
          quantidade: number
          requisicao_id?: string | null
          servidor_responsavel_id?: string | null
          setor_destino_id?: string | null
          subtipo?: string | null
          tipo: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          almoxarifado_destino_id?: string | null
          almoxarifado_id?: string
          created_at?: string | null
          created_by?: string | null
          empenho_id?: string | null
          id?: string
          item_id?: string
          nota_fiscal?: string | null
          observacao?: string | null
          quantidade?: number
          requisicao_id?: string | null
          servidor_responsavel_id?: string | null
          setor_destino_id?: string | null
          subtipo?: string | null
          tipo?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_almoxarifado_destino_id_fkey"
            columns: ["almoxarifado_destino_id"]
            isOneToOne: false
            referencedRelation: "almoxarifados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_almoxarifado_id_fkey"
            columns: ["almoxarifado_id"]
            isOneToOne: false
            referencedRelation: "almoxarifados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "empenhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_material"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_setor_destino_id_fkey"
            columns: ["setor_destino_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_processo: {
        Row: {
          created_at: string
          created_by: string | null
          data_recebimento: string | null
          data_resposta: string | null
          descricao: string
          id: string
          numero_sequencial: number
          observacoes: string | null
          prazo_dias: number | null
          prazo_limite: string | null
          processo_id: string
          servidor_destino_id: string | null
          servidor_origem_id: string | null
          status: Database["public"]["Enums"]["status_movimentacao_processo"]
          tipo_movimentacao: Database["public"]["Enums"]["tipo_movimentacao_processo"]
          unidade_destino_id: string | null
          unidade_origem_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          data_resposta?: string | null
          descricao: string
          id?: string
          numero_sequencial?: number
          observacoes?: string | null
          prazo_dias?: number | null
          prazo_limite?: string | null
          processo_id: string
          servidor_destino_id?: string | null
          servidor_origem_id?: string | null
          status?: Database["public"]["Enums"]["status_movimentacao_processo"]
          tipo_movimentacao?: Database["public"]["Enums"]["tipo_movimentacao_processo"]
          unidade_destino_id?: string | null
          unidade_origem_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          data_resposta?: string | null
          descricao?: string
          id?: string
          numero_sequencial?: number
          observacoes?: string | null
          prazo_dias?: number | null
          prazo_limite?: string | null
          processo_id?: string
          servidor_destino_id?: string | null
          servidor_origem_id?: string | null
          status?: Database["public"]["Enums"]["status_movimentacao_processo"]
          tipo_movimentacao?: Database["public"]["Enums"]["tipo_movimentacao_processo"]
          unidade_destino_id?: string | null
          unidade_origem_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_administrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "v_processos_resumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_servidor_destino_id_fkey"
            columns: ["servidor_destino_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_servidor_destino_id_fkey"
            columns: ["servidor_destino_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_servidor_origem_id_fkey"
            columns: ["servidor_origem_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_servidor_origem_id_fkey"
            columns: ["servidor_origem_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_unidade_destino_id_fkey"
            columns: ["unidade_destino_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_unidade_origem_id_fkey"
            columns: ["unidade_origem_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      nomeacoes_chefe_unidade: {
        Row: {
          ato_data_publicacao: string
          ato_doe_data: string | null
          ato_doe_numero: string | null
          ato_nomeacao_tipo: Database["public"]["Enums"]["tipo_ato_nomeacao"]
          ato_numero: string
          cargo: string
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          documento_nomeacao_url: string | null
          id: string
          observacoes: string | null
          servidor_id: string
          status: Database["public"]["Enums"]["status_nomeacao"]
          unidade_local_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ato_data_publicacao: string
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_nomeacao_tipo: Database["public"]["Enums"]["tipo_ato_nomeacao"]
          ato_numero: string
          cargo?: string
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          documento_nomeacao_url?: string | null
          id?: string
          observacoes?: string | null
          servidor_id: string
          status?: Database["public"]["Enums"]["status_nomeacao"]
          unidade_local_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ato_data_publicacao?: string
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_nomeacao_tipo?: Database["public"]["Enums"]["tipo_ato_nomeacao"]
          ato_numero?: string
          cargo?: string
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          documento_nomeacao_url?: string | null
          id?: string
          observacoes?: string | null
          servidor_id?: string
          status?: Database["public"]["Enums"]["status_nomeacao"]
          unidade_local_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nomeacoes_chefe_unidade_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      ocorrencias_servidor: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_ocorrencia: string
          descricao: string
          documento_url: string | null
          id: string
          servidor_id: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_ocorrencia: string
          descricao: string
          documento_url?: string | null
          id?: string
          servidor_id: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_ocorrencia?: string
          descricao?: string
          documento_url?: string | null
          id?: string
          servidor_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          agencia: string | null
          banco: string | null
          conta: string | null
          conta_autarquia_id: string | null
          created_at: string | null
          created_by: string | null
          data_pagamento: string
          forma_pagamento: string | null
          id: string
          liquidacao_id: string
          numero_documento_bancario: string | null
          numero_pagamento: string
          observacao: string | null
          situacao: string | null
          valor_pago: number
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          conta_autarquia_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_pagamento: string
          forma_pagamento?: string | null
          id?: string
          liquidacao_id: string
          numero_documento_bancario?: string | null
          numero_pagamento: string
          observacao?: string | null
          situacao?: string | null
          valor_pago: number
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          conta_autarquia_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_pagamento?: string
          forma_pagamento?: string | null
          id?: string
          liquidacao_id?: string
          numero_documento_bancario?: string | null
          numero_pagamento?: string
          observacao?: string | null
          situacao?: string | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_conta_autarquia_id_fkey"
            columns: ["conta_autarquia_id"]
            isOneToOne: false
            referencedRelation: "contas_autarquia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_liquidacao_id_fkey"
            columns: ["liquidacao_id"]
            isOneToOne: false
            referencedRelation: "liquidacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_folha: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          observacoes: string | null
          tipo_parametro: string
          updated_at: string | null
          updated_by: string | null
          valor: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          tipo_parametro: string
          updated_at?: string | null
          updated_by?: string | null
          valor: number
          vigencia_fim?: string | null
          vigencia_inicio: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          tipo_parametro?: string
          updated_at?: string | null
          updated_by?: string | null
          valor?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "parametros_folha_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametros_folha_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametros_folha_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametros_folha_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      pareceres_tecnicos: {
        Row: {
          analise: string
          ano: number
          assunto: string
          autor_id: string | null
          conclusao: string
          created_at: string
          created_by: string | null
          data_parecer: string
          decisao_vinculada_id: string | null
          entidade_origem_id: string | null
          entidade_origem_tipo: string | null
          fundamentacao: string | null
          id: string
          modulo_origem: string | null
          numero_parecer: string
          processo_sei: string | null
          recomendacoes: string | null
          tipo: Database["public"]["Enums"]["tipo_parecer"]
          unidade_origem_id: string | null
          updated_at: string
        }
        Insert: {
          analise: string
          ano: number
          assunto: string
          autor_id?: string | null
          conclusao: string
          created_at?: string
          created_by?: string | null
          data_parecer: string
          decisao_vinculada_id?: string | null
          entidade_origem_id?: string | null
          entidade_origem_tipo?: string | null
          fundamentacao?: string | null
          id?: string
          modulo_origem?: string | null
          numero_parecer: string
          processo_sei?: string | null
          recomendacoes?: string | null
          tipo: Database["public"]["Enums"]["tipo_parecer"]
          unidade_origem_id?: string | null
          updated_at?: string
        }
        Update: {
          analise?: string
          ano?: number
          assunto?: string
          autor_id?: string | null
          conclusao?: string
          created_at?: string
          created_by?: string | null
          data_parecer?: string
          decisao_vinculada_id?: string | null
          entidade_origem_id?: string | null
          entidade_origem_tipo?: string | null
          fundamentacao?: string | null
          id?: string
          modulo_origem?: string | null
          numero_parecer?: string
          processo_sei?: string | null
          recomendacoes?: string | null
          tipo?: Database["public"]["Enums"]["tipo_parecer"]
          unidade_origem_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pareceres_tecnicos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pareceres_tecnicos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pareceres_tecnicos_decisao_vinculada_id_fkey"
            columns: ["decisao_vinculada_id"]
            isOneToOne: false
            referencedRelation: "decisoes_administrativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pareceres_tecnicos_unidade_origem_id_fkey"
            columns: ["unidade_origem_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      participantes_reuniao: {
        Row: {
          assinatura_presenca: boolean | null
          cargo_funcao: string | null
          convite_canal: string | null
          convite_enviado: boolean | null
          convite_enviado_em: string | null
          convite_enviado_por: string | null
          created_at: string | null
          data_assinatura: string | null
          data_confirmacao: string | null
          email_externo: string | null
          id: string
          instituicao_externa: string | null
          justificativa_ausencia: string | null
          nome_externo: string | null
          obrigatorio: boolean | null
          observacoes: string | null
          reuniao_id: string
          servidor_id: string | null
          status: Database["public"]["Enums"]["status_participante"] | null
          telefone_externo: string | null
          tipo_participante: string | null
          updated_at: string | null
        }
        Insert: {
          assinatura_presenca?: boolean | null
          cargo_funcao?: string | null
          convite_canal?: string | null
          convite_enviado?: boolean | null
          convite_enviado_em?: string | null
          convite_enviado_por?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          data_confirmacao?: string | null
          email_externo?: string | null
          id?: string
          instituicao_externa?: string | null
          justificativa_ausencia?: string | null
          nome_externo?: string | null
          obrigatorio?: boolean | null
          observacoes?: string | null
          reuniao_id: string
          servidor_id?: string | null
          status?: Database["public"]["Enums"]["status_participante"] | null
          telefone_externo?: string | null
          tipo_participante?: string | null
          updated_at?: string | null
        }
        Update: {
          assinatura_presenca?: boolean | null
          cargo_funcao?: string | null
          convite_canal?: string | null
          convite_enviado?: boolean | null
          convite_enviado_em?: string | null
          convite_enviado_por?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          data_confirmacao?: string | null
          email_externo?: string | null
          id?: string
          instituicao_externa?: string | null
          justificativa_ausencia?: string | null
          nome_externo?: string | null
          obrigatorio?: boolean | null
          observacoes?: string | null
          reuniao_id?: string
          servidor_id?: string | null
          status?: Database["public"]["Enums"]["status_participante"] | null
          telefone_externo?: string | null
          tipo_participante?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participantes_reuniao_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participantes_reuniao_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participantes_reuniao_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimonio_unidade: {
        Row: {
          anexos: string[] | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          data_aquisicao: string | null
          descricao: string | null
          estado_conservacao:
            | Database["public"]["Enums"]["estado_conservacao"]
            | null
          id: string
          item: string
          numero_tombo: string | null
          observacoes: string | null
          quantidade: number | null
          situacao: Database["public"]["Enums"]["situacao_patrimonio"] | null
          unidade_local_id: string
          updated_at: string | null
          updated_by: string | null
          valor_estimado: number | null
        }
        Insert: {
          anexos?: string[] | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aquisicao?: string | null
          descricao?: string | null
          estado_conservacao?:
            | Database["public"]["Enums"]["estado_conservacao"]
            | null
          id?: string
          item: string
          numero_tombo?: string | null
          observacoes?: string | null
          quantidade?: number | null
          situacao?: Database["public"]["Enums"]["situacao_patrimonio"] | null
          unidade_local_id: string
          updated_at?: string | null
          updated_by?: string | null
          valor_estimado?: number | null
        }
        Update: {
          anexos?: string[] | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aquisicao?: string | null
          descricao?: string | null
          estado_conservacao?:
            | Database["public"]["Enums"]["estado_conservacao"]
            | null
          id?: string
          item?: string
          numero_tombo?: string | null
          observacoes?: string | null
          quantidade?: number | null
          situacao?: Database["public"]["Enums"]["situacao_patrimonio"] | null
          unidade_local_id?: string
          updated_at?: string | null
          updated_by?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patrimonio_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrimonio_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "patrimonio_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "patrimonio_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrimonio_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      pensoes_alimenticias: {
        Row: {
          ativo: boolean | null
          banco_agencia: string | null
          banco_codigo: string | null
          banco_conta: string | null
          banco_nome: string | null
          banco_tipo_conta: string | null
          base_calculo: string | null
          beneficiario_cpf: string | null
          beneficiario_data_nascimento: string | null
          beneficiario_nome: string
          beneficiario_parentesco: string | null
          comarca: string | null
          created_at: string | null
          created_by: string | null
          data_decisao: string | null
          data_fim: string | null
          data_inicio: string
          decisao_judicial_url: string | null
          id: string
          numero_processo: string | null
          observacoes: string | null
          percentual: number | null
          pix_chave: string | null
          pix_tipo: string | null
          prioridade: number | null
          servidor_id: string | null
          tipo_calculo: string
          updated_at: string | null
          valor_fixo: number | null
          vara_judicial: string | null
        }
        Insert: {
          ativo?: boolean | null
          banco_agencia?: string | null
          banco_codigo?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_tipo_conta?: string | null
          base_calculo?: string | null
          beneficiario_cpf?: string | null
          beneficiario_data_nascimento?: string | null
          beneficiario_nome: string
          beneficiario_parentesco?: string | null
          comarca?: string | null
          created_at?: string | null
          created_by?: string | null
          data_decisao?: string | null
          data_fim?: string | null
          data_inicio: string
          decisao_judicial_url?: string | null
          id?: string
          numero_processo?: string | null
          observacoes?: string | null
          percentual?: number | null
          pix_chave?: string | null
          pix_tipo?: string | null
          prioridade?: number | null
          servidor_id?: string | null
          tipo_calculo: string
          updated_at?: string | null
          valor_fixo?: number | null
          vara_judicial?: string | null
        }
        Update: {
          ativo?: boolean | null
          banco_agencia?: string | null
          banco_codigo?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_tipo_conta?: string | null
          base_calculo?: string | null
          beneficiario_cpf?: string | null
          beneficiario_data_nascimento?: string | null
          beneficiario_nome?: string
          beneficiario_parentesco?: string | null
          comarca?: string | null
          created_at?: string | null
          created_by?: string | null
          data_decisao?: string | null
          data_fim?: string | null
          data_inicio?: string
          decisao_judicial_url?: string | null
          id?: string
          numero_processo?: string | null
          observacoes?: string | null
          percentual?: number | null
          pix_chave?: string | null
          pix_tipo?: string | null
          prioridade?: number | null
          servidor_id?: string | null
          tipo_calculo?: string
          updated_at?: string | null
          valor_fixo?: number | null
          vara_judicial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pensoes_alimenticias_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pensoes_alimenticias_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pensoes_alimenticias_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pensoes_alimenticias_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_funcoes: {
        Row: {
          concedido: boolean
          created_at: string
          created_by: string | null
          funcao_id: string
          id: string
          perfil_id: string
        }
        Insert: {
          concedido?: boolean
          created_at?: string
          created_by?: string | null
          funcao_id: string
          id?: string
          perfil_id: string
        }
        Update: {
          concedido?: boolean
          created_at?: string
          created_by?: string | null
          funcao_id?: string
          id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_funcoes_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_funcoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_permissoes: {
        Row: {
          concedido: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          perfil_id: string
          permissao_id: string
        }
        Insert: {
          concedido?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          perfil_id: string
          permissao_id: string
        }
        Update: {
          concedido?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          perfil_id?: string
          permissao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_permissoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_permissoes_permissao_id_fkey"
            columns: ["permissao_id"]
            isOneToOne: false
            referencedRelation: "permissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          ativo: boolean
          codigo: string | null
          cor: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          icone: string | null
          id: string
          is_sistema: boolean
          nivel: Database["public"]["Enums"]["nivel_perfil"]
          nivel_hierarquia: number
          nome: string
          perfil_pai_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          cor?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          is_sistema?: boolean
          nivel?: Database["public"]["Enums"]["nivel_perfil"]
          nivel_hierarquia?: number
          nome: string
          perfil_pai_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          cor?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          is_sistema?: boolean
          nivel?: Database["public"]["Enums"]["nivel_perfil"]
          nivel_hierarquia?: number
          nome?: string
          perfil_pai_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfis_perfil_pai_id_fkey"
            columns: ["perfil_pai_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes: {
        Row: {
          ativo: boolean | null
          capacidade: string
          codigo: string
          created_at: string | null
          descricao: string | null
          dominio: string
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          ativo?: boolean | null
          capacidade: string
          codigo: string
          created_at?: string | null
          descricao?: string | null
          dominio: string
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          ativo?: boolean | null
          capacidade?: string
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          dominio?: string
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      planos_tratamento_risco: {
        Row: {
          acao_proposta: string
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          percentual_execucao: number | null
          prazo_conclusao: string | null
          prazo_inicio: string | null
          recursos_necessarios: string | null
          responsavel_id: string | null
          resultado_obtido: string | null
          risco_id: string
          status: string
          tipo_resposta: string
          titulo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acao_proposta: string
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          percentual_execucao?: number | null
          prazo_conclusao?: string | null
          prazo_inicio?: string | null
          recursos_necessarios?: string | null
          responsavel_id?: string | null
          resultado_obtido?: string | null
          risco_id: string
          status?: string
          tipo_resposta: string
          titulo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acao_proposta?: string
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          percentual_execucao?: number | null
          prazo_conclusao?: string | null
          prazo_inicio?: string | null
          recursos_necessarios?: string | null
          responsavel_id?: string | null
          resultado_obtido?: string | null
          risco_id?: string
          status?: string
          tipo_resposta?: string
          titulo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_tratamento_risco_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_tratamento_risco_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_tratamento_risco_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos_institucionais"
            referencedColumns: ["id"]
          },
        ]
      }
      portarias_servidor: {
        Row: {
          ano: number
          assunto: string
          conteudo: string | null
          created_at: string | null
          created_by: string | null
          data_publicacao: string
          data_vigencia_fim: string | null
          data_vigencia_inicio: string | null
          diario_oficial_data: string | null
          diario_oficial_numero: string | null
          documento_url: string | null
          ementa: string | null
          historico_id: string | null
          id: string
          numero: string
          observacoes: string | null
          portaria_revogadora_id: string | null
          servidor_id: string
          status: string | null
          tipo: Database["public"]["Enums"]["tipo_portaria_rh"]
        }
        Insert: {
          ano: number
          assunto: string
          conteudo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_publicacao: string
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          diario_oficial_data?: string | null
          diario_oficial_numero?: string | null
          documento_url?: string | null
          ementa?: string | null
          historico_id?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          portaria_revogadora_id?: string | null
          servidor_id: string
          status?: string | null
          tipo: Database["public"]["Enums"]["tipo_portaria_rh"]
        }
        Update: {
          ano?: number
          assunto?: string
          conteudo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_publicacao?: string
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          diario_oficial_data?: string | null
          diario_oficial_numero?: string | null
          documento_url?: string | null
          ementa?: string | null
          historico_id?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          portaria_revogadora_id?: string | null
          servidor_id?: string
          status?: string | null
          tipo?: Database["public"]["Enums"]["tipo_portaria_rh"]
        }
        Relationships: [
          {
            foreignKeyName: "portarias_servidor_historico_id_fkey"
            columns: ["historico_id"]
            isOneToOne: false
            referencedRelation: "historico_funcional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portarias_servidor_portaria_revogadora_id_fkey"
            columns: ["portaria_revogadora_id"]
            isOneToOne: false
            referencedRelation: "portarias_servidor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portarias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portarias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      prazos_lai: {
        Row: {
          ativo: boolean | null
          base_legal: string | null
          created_at: string | null
          descricao: string | null
          dias_uteis: boolean | null
          id: string
          prazo_dias: number
          prorrogacao_dias: number | null
          prorrogavel: boolean | null
          tipo_prazo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          base_legal?: string | null
          created_at?: string | null
          descricao?: string | null
          dias_uteis?: boolean | null
          id?: string
          prazo_dias: number
          prorrogacao_dias?: number | null
          prorrogavel?: boolean | null
          tipo_prazo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          base_legal?: string | null
          created_at?: string | null
          descricao?: string | null
          dias_uteis?: boolean | null
          id?: string
          prazo_dias?: number
          prorrogacao_dias?: number | null
          prorrogavel?: boolean | null
          tipo_prazo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prazos_processo: {
        Row: {
          base_legal: string | null
          created_at: string
          created_by: string | null
          cumprido: boolean
          data_cumprimento: string | null
          data_inicio: string
          data_limite: string
          descricao: string
          id: string
          observacoes: string | null
          prazo_dias: number
          processo_id: string
          referencia: Database["public"]["Enums"]["referencia_prazo_processo"]
          responsavel_id: string | null
          updated_at: string
        }
        Insert: {
          base_legal?: string | null
          created_at?: string
          created_by?: string | null
          cumprido?: boolean
          data_cumprimento?: string | null
          data_inicio?: string
          data_limite: string
          descricao: string
          id?: string
          observacoes?: string | null
          prazo_dias: number
          processo_id: string
          referencia?: Database["public"]["Enums"]["referencia_prazo_processo"]
          responsavel_id?: string | null
          updated_at?: string
        }
        Update: {
          base_legal?: string | null
          created_at?: string
          created_by?: string | null
          cumprido?: boolean
          data_cumprimento?: string | null
          data_inicio?: string
          data_limite?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          prazo_dias?: number
          processo_id?: string
          referencia?: Database["public"]["Enums"]["referencia_prazo_processo"]
          responsavel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prazos_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_administrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prazos_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "v_processos_resumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prazos_processo_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prazos_processo_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_cadastros: {
        Row: {
          ano_conclusao: number | null
          banco_agencia: string | null
          banco_codigo: string | null
          banco_conta: string | null
          banco_nome: string | null
          banco_tipo_conta: string | null
          certidao_tipo: string | null
          certificado_reservista: string | null
          cnh_categoria: string | null
          cnh_data_expedicao: string | null
          cnh_numero: string | null
          cnh_primeira_habilitacao: string | null
          cnh_uf: string | null
          cnh_validade: string | null
          codigo_acesso: string
          conselho_numero: string | null
          convertido_em: string | null
          convertido_por: string | null
          cpf: string
          created_at: string | null
          ctps_data_emissao: string | null
          ctps_numero: string | null
          ctps_serie: string | null
          ctps_uf: string | null
          cursos_complementares: Json | null
          data_envio: string | null
          data_nascimento: string | null
          dependentes: Json | null
          doc_certidao: boolean | null
          doc_certidao_criminal_estadual: boolean | null
          doc_certidao_criminal_federal: boolean | null
          doc_certidao_improbidade: boolean | null
          doc_certificado_reservista: boolean | null
          doc_comprovante_bancario: boolean | null
          doc_comprovante_residencia: boolean | null
          doc_cpf: boolean | null
          doc_declaracao_acumulacao: boolean | null
          doc_declaracao_bens: boolean | null
          doc_diploma: boolean | null
          doc_historico_escolar: boolean | null
          doc_pis_pasep: boolean | null
          doc_quitacao_eleitoral: boolean | null
          doc_registro_conselho: boolean | null
          doc_rg: boolean | null
          doc_termo_responsabilidade: boolean | null
          doc_titulo_eleitor: boolean | null
          email: string
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          escolaridade: string | null
          estado_civil: string | null
          experiencia_resumo: string | null
          formacao_academica: string | null
          foto_url: string | null
          habilidades: string[] | null
          id: string
          idiomas: Json | null
          instituicao_ensino: string | null
          ip_envio: string | null
          nacionalidade: string | null
          naturalidade_cidade: string | null
          naturalidade_uf: string | null
          nome_completo: string
          nome_mae: string | null
          nome_pai: string | null
          nome_social: string | null
          observacoes: string | null
          pcd: boolean | null
          pcd_tipo: string | null
          pis_pasep: string | null
          raca_cor: string | null
          registro_conselho: string | null
          reservista_ano: number | null
          reservista_categoria: string | null
          reservista_data_emissao: string | null
          reservista_orgao: string | null
          rg: string | null
          rg_data_emissao: string | null
          rg_orgao_expedidor: string | null
          rg_uf: string | null
          servidor_id: string | null
          sexo: string | null
          status: string | null
          telefone_celular: string | null
          telefone_fixo: string | null
          tipo_sanguineo: string | null
          titulo_cidade_votacao: string | null
          titulo_data_emissao: string | null
          titulo_eleitor: string | null
          titulo_secao: string | null
          titulo_uf_votacao: string | null
          titulo_zona: string | null
          updated_at: string | null
        }
        Insert: {
          ano_conclusao?: number | null
          banco_agencia?: string | null
          banco_codigo?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_tipo_conta?: string | null
          certidao_tipo?: string | null
          certificado_reservista?: string | null
          cnh_categoria?: string | null
          cnh_data_expedicao?: string | null
          cnh_numero?: string | null
          cnh_primeira_habilitacao?: string | null
          cnh_uf?: string | null
          cnh_validade?: string | null
          codigo_acesso: string
          conselho_numero?: string | null
          convertido_em?: string | null
          convertido_por?: string | null
          cpf: string
          created_at?: string | null
          ctps_data_emissao?: string | null
          ctps_numero?: string | null
          ctps_serie?: string | null
          ctps_uf?: string | null
          cursos_complementares?: Json | null
          data_envio?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          doc_certidao?: boolean | null
          doc_certidao_criminal_estadual?: boolean | null
          doc_certidao_criminal_federal?: boolean | null
          doc_certidao_improbidade?: boolean | null
          doc_certificado_reservista?: boolean | null
          doc_comprovante_bancario?: boolean | null
          doc_comprovante_residencia?: boolean | null
          doc_cpf?: boolean | null
          doc_declaracao_acumulacao?: boolean | null
          doc_declaracao_bens?: boolean | null
          doc_diploma?: boolean | null
          doc_historico_escolar?: boolean | null
          doc_pis_pasep?: boolean | null
          doc_quitacao_eleitoral?: boolean | null
          doc_registro_conselho?: boolean | null
          doc_rg?: boolean | null
          doc_termo_responsabilidade?: boolean | null
          doc_titulo_eleitor?: boolean | null
          email: string
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          experiencia_resumo?: string | null
          formacao_academica?: string | null
          foto_url?: string | null
          habilidades?: string[] | null
          id?: string
          idiomas?: Json | null
          instituicao_ensino?: string | null
          ip_envio?: string | null
          nacionalidade?: string | null
          naturalidade_cidade?: string | null
          naturalidade_uf?: string | null
          nome_completo: string
          nome_mae?: string | null
          nome_pai?: string | null
          nome_social?: string | null
          observacoes?: string | null
          pcd?: boolean | null
          pcd_tipo?: string | null
          pis_pasep?: string | null
          raca_cor?: string | null
          registro_conselho?: string | null
          reservista_ano?: number | null
          reservista_categoria?: string | null
          reservista_data_emissao?: string | null
          reservista_orgao?: string | null
          rg?: string | null
          rg_data_emissao?: string | null
          rg_orgao_expedidor?: string | null
          rg_uf?: string | null
          servidor_id?: string | null
          sexo?: string | null
          status?: string | null
          telefone_celular?: string | null
          telefone_fixo?: string | null
          tipo_sanguineo?: string | null
          titulo_cidade_votacao?: string | null
          titulo_data_emissao?: string | null
          titulo_eleitor?: string | null
          titulo_secao?: string | null
          titulo_uf_votacao?: string | null
          titulo_zona?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_conclusao?: number | null
          banco_agencia?: string | null
          banco_codigo?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_tipo_conta?: string | null
          certidao_tipo?: string | null
          certificado_reservista?: string | null
          cnh_categoria?: string | null
          cnh_data_expedicao?: string | null
          cnh_numero?: string | null
          cnh_primeira_habilitacao?: string | null
          cnh_uf?: string | null
          cnh_validade?: string | null
          codigo_acesso?: string
          conselho_numero?: string | null
          convertido_em?: string | null
          convertido_por?: string | null
          cpf?: string
          created_at?: string | null
          ctps_data_emissao?: string | null
          ctps_numero?: string | null
          ctps_serie?: string | null
          ctps_uf?: string | null
          cursos_complementares?: Json | null
          data_envio?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          doc_certidao?: boolean | null
          doc_certidao_criminal_estadual?: boolean | null
          doc_certidao_criminal_federal?: boolean | null
          doc_certidao_improbidade?: boolean | null
          doc_certificado_reservista?: boolean | null
          doc_comprovante_bancario?: boolean | null
          doc_comprovante_residencia?: boolean | null
          doc_cpf?: boolean | null
          doc_declaracao_acumulacao?: boolean | null
          doc_declaracao_bens?: boolean | null
          doc_diploma?: boolean | null
          doc_historico_escolar?: boolean | null
          doc_pis_pasep?: boolean | null
          doc_quitacao_eleitoral?: boolean | null
          doc_registro_conselho?: boolean | null
          doc_rg?: boolean | null
          doc_termo_responsabilidade?: boolean | null
          doc_titulo_eleitor?: boolean | null
          email?: string
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          experiencia_resumo?: string | null
          formacao_academica?: string | null
          foto_url?: string | null
          habilidades?: string[] | null
          id?: string
          idiomas?: Json | null
          instituicao_ensino?: string | null
          ip_envio?: string | null
          nacionalidade?: string | null
          naturalidade_cidade?: string | null
          naturalidade_uf?: string | null
          nome_completo?: string
          nome_mae?: string | null
          nome_pai?: string | null
          nome_social?: string | null
          observacoes?: string | null
          pcd?: boolean | null
          pcd_tipo?: string | null
          pis_pasep?: string | null
          raca_cor?: string | null
          registro_conselho?: string | null
          reservista_ano?: number | null
          reservista_categoria?: string | null
          reservista_data_emissao?: string | null
          reservista_orgao?: string | null
          rg?: string | null
          rg_data_emissao?: string | null
          rg_orgao_expedidor?: string | null
          rg_uf?: string | null
          servidor_id?: string | null
          sexo?: string | null
          status?: string | null
          telefone_celular?: string | null
          telefone_fixo?: string | null
          tipo_sanguineo?: string | null
          titulo_cidade_votacao?: string | null
          titulo_data_emissao?: string | null
          titulo_eleitor?: string | null
          titulo_secao?: string | null
          titulo_uf_votacao?: string | null
          titulo_zona?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_cadastros_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_cadastros_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_administrativos: {
        Row: {
          ano: number
          assunto: string
          created_at: string
          created_by: string | null
          data_abertura: string
          data_encerramento: string | null
          descricao: string | null
          id: string
          interessado_documento: string | null
          interessado_nome: string
          interessado_tipo: string
          numero_processo: string
          observacoes: string | null
          processo_origem_id: string | null
          sigilo: Database["public"]["Enums"]["nivel_sigilo_processo"]
          status: Database["public"]["Enums"]["status_processo_administrativo"]
          tipo_processo: Database["public"]["Enums"]["tipo_processo_administrativo"]
          unidade_origem_id: string | null
          updated_at: string
        }
        Insert: {
          ano?: number
          assunto: string
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          data_encerramento?: string | null
          descricao?: string | null
          id?: string
          interessado_documento?: string | null
          interessado_nome: string
          interessado_tipo?: string
          numero_processo: string
          observacoes?: string | null
          processo_origem_id?: string | null
          sigilo?: Database["public"]["Enums"]["nivel_sigilo_processo"]
          status?: Database["public"]["Enums"]["status_processo_administrativo"]
          tipo_processo?: Database["public"]["Enums"]["tipo_processo_administrativo"]
          unidade_origem_id?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number
          assunto?: string
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          data_encerramento?: string | null
          descricao?: string | null
          id?: string
          interessado_documento?: string | null
          interessado_nome?: string
          interessado_tipo?: string
          numero_processo?: string
          observacoes?: string | null
          processo_origem_id?: string | null
          sigilo?: Database["public"]["Enums"]["nivel_sigilo_processo"]
          status?: Database["public"]["Enums"]["status_processo_administrativo"]
          tipo_processo?: Database["public"]["Enums"]["tipo_processo_administrativo"]
          unidade_origem_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_administrativos_processo_origem_id_fkey"
            columns: ["processo_origem_id"]
            isOneToOne: false
            referencedRelation: "processos_administrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_administrativos_processo_origem_id_fkey"
            columns: ["processo_origem_id"]
            isOneToOne: false
            referencedRelation: "v_processos_resumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_administrativos_unidade_origem_id_fkey"
            columns: ["unidade_origem_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_licitatorios: {
        Row: {
          ano: number
          created_at: string | null
          created_by: string | null
          data_abertura: string | null
          data_limite_propostas: string | null
          data_publicacao_edital: string | null
          data_sessao: string | null
          dotacao_orcamentaria: string | null
          elemento_despesa: string | null
          fase_atual: Database["public"]["Enums"]["fase_licitacao"] | null
          fonte_recurso: string | null
          fundamentacao_legal: string | null
          historico_fases: Json | null
          id: string
          modalidade: Database["public"]["Enums"]["modalidade_licitacao"]
          numero_processo: string
          objeto: string
          objeto_resumido: string | null
          observacoes: string | null
          pregoeiro_id: string | null
          programa_trabalho: string | null
          servidor_responsavel_id: string | null
          tipo_licitacao: string | null
          unidade_requisitante_id: string | null
          updated_at: string | null
          updated_by: string | null
          valor_estimado: number | null
        }
        Insert: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          data_abertura?: string | null
          data_limite_propostas?: string | null
          data_publicacao_edital?: string | null
          data_sessao?: string | null
          dotacao_orcamentaria?: string | null
          elemento_despesa?: string | null
          fase_atual?: Database["public"]["Enums"]["fase_licitacao"] | null
          fonte_recurso?: string | null
          fundamentacao_legal?: string | null
          historico_fases?: Json | null
          id?: string
          modalidade: Database["public"]["Enums"]["modalidade_licitacao"]
          numero_processo: string
          objeto: string
          objeto_resumido?: string | null
          observacoes?: string | null
          pregoeiro_id?: string | null
          programa_trabalho?: string | null
          servidor_responsavel_id?: string | null
          tipo_licitacao?: string | null
          unidade_requisitante_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_estimado?: number | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          data_abertura?: string | null
          data_limite_propostas?: string | null
          data_publicacao_edital?: string | null
          data_sessao?: string | null
          dotacao_orcamentaria?: string | null
          elemento_despesa?: string | null
          fase_atual?: Database["public"]["Enums"]["fase_licitacao"] | null
          fonte_recurso?: string | null
          fundamentacao_legal?: string | null
          historico_fases?: Json | null
          id?: string
          modalidade?: Database["public"]["Enums"]["modalidade_licitacao"]
          numero_processo?: string
          objeto?: string
          objeto_resumido?: string | null
          observacoes?: string | null
          pregoeiro_id?: string | null
          programa_trabalho?: string | null
          servidor_responsavel_id?: string | null
          tipo_licitacao?: string | null
          unidade_requisitante_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_licitatorios_pregoeiro_id_fkey"
            columns: ["pregoeiro_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_licitatorios_pregoeiro_id_fkey"
            columns: ["pregoeiro_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_licitatorios_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_licitatorios_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_licitatorios_unidade_requisitante_id_fkey"
            columns: ["unidade_requisitante_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked_at: string | null
          blocked_reason: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          requires_password_change: boolean | null
          servidor_id: string | null
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          requires_password_change?: boolean | null
          servidor_id?: string | null
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          requires_password_change?: boolean | null
          servidor_id?: string | null
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      programas: {
        Row: {
          ano_fim: number | null
          ano_inicio: number
          codigo: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          meta_fisica_total: number | null
          nome: string
          objetivo: string | null
          publico_alvo: string | null
          servidor_responsavel_id: string | null
          situacao: string | null
          unidade_medida: string | null
          unidade_responsavel_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ano_fim?: number | null
          ano_inicio: number
          codigo: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          meta_fisica_total?: number | null
          nome: string
          objetivo?: string | null
          publico_alvo?: string | null
          servidor_responsavel_id?: string | null
          situacao?: string | null
          unidade_medida?: string | null
          unidade_responsavel_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ano_fim?: number | null
          ano_inicio?: number
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          meta_fisica_total?: number | null
          nome?: string
          objetivo?: string | null
          publico_alvo?: string | null
          servidor_responsavel_id?: string | null
          situacao?: string | null
          unidade_medida?: string | null
          unidade_responsavel_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programas_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_unidade_responsavel_id_fkey"
            columns: ["unidade_responsavel_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas_licitacao: {
        Row: {
          classificacao: number | null
          created_at: string | null
          data_proposta: string | null
          desclassificada: boolean | null
          fornecedor_id: string
          id: string
          item_id: string | null
          marca: string | null
          modelo: string | null
          motivo_desclassificacao: string | null
          observacoes: string | null
          processo_id: string
          valor_total: number | null
          valor_unitario: number
          vencedora: boolean | null
        }
        Insert: {
          classificacao?: number | null
          created_at?: string | null
          data_proposta?: string | null
          desclassificada?: boolean | null
          fornecedor_id: string
          id?: string
          item_id?: string | null
          marca?: string | null
          modelo?: string | null
          motivo_desclassificacao?: string | null
          observacoes?: string | null
          processo_id: string
          valor_total?: number | null
          valor_unitario: number
          vencedora?: boolean | null
        }
        Update: {
          classificacao?: number | null
          created_at?: string | null
          data_proposta?: string | null
          desclassificada?: boolean | null
          fornecedor_id?: string
          id?: string
          item_id?: string | null
          marca?: string | null
          modelo?: string | null
          motivo_desclassificacao?: string | null
          observacoes?: string | null
          processo_id?: string
          valor_total?: number | null
          valor_unitario?: number
          vencedora?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_licitacao_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_licitacao_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_licitacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_licitacao_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      provimentos: {
        Row: {
          ato_encerramento_data: string | null
          ato_encerramento_numero: string | null
          ato_encerramento_tipo: string | null
          cargo_id: string
          created_at: string | null
          created_by: string | null
          data_encerramento: string | null
          data_exercicio: string | null
          data_nomeacao: string
          data_posse: string | null
          id: string
          motivo_encerramento: string | null
          observacoes: string | null
          servidor_id: string
          status: Database["public"]["Enums"]["status_provimento"] | null
          unidade_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ato_encerramento_data?: string | null
          ato_encerramento_numero?: string | null
          ato_encerramento_tipo?: string | null
          cargo_id: string
          created_at?: string | null
          created_by?: string | null
          data_encerramento?: string | null
          data_exercicio?: string | null
          data_nomeacao: string
          data_posse?: string | null
          id?: string
          motivo_encerramento?: string | null
          observacoes?: string | null
          servidor_id: string
          status?: Database["public"]["Enums"]["status_provimento"] | null
          unidade_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ato_encerramento_data?: string | null
          ato_encerramento_numero?: string | null
          ato_encerramento_tipo?: string | null
          cargo_id?: string
          created_at?: string | null
          created_by?: string | null
          data_encerramento?: string | null
          data_exercicio?: string | null
          data_nomeacao?: string
          data_posse?: string | null
          id?: string
          motivo_encerramento?: string | null
          observacoes?: string | null
          servidor_id?: string
          status?: Database["public"]["Enums"]["status_provimento"] | null
          unidade_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provimentos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provimentos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provimentos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provimentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacoes_lai: {
        Row: {
          ano_referencia: number | null
          arquivo_nome: string | null
          arquivo_url: string | null
          categoria: string
          conteudo: string | null
          contrato_id: string | null
          created_at: string | null
          created_by: string | null
          data_publicacao: string | null
          descricao: string | null
          destaque: boolean | null
          id: string
          mes_referencia: number | null
          ordem_exibicao: number | null
          periodo_referencia: string | null
          publicado: boolean | null
          publicado_por: string | null
          servidor_id: string | null
          subcategoria: string | null
          titulo: string
          unidade_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ano_referencia?: number | null
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria: string
          conteudo?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          mes_referencia?: number | null
          ordem_exibicao?: number | null
          periodo_referencia?: string | null
          publicado?: boolean | null
          publicado_por?: string | null
          servidor_id?: string | null
          subcategoria?: string | null
          titulo: string
          unidade_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ano_referencia?: number | null
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string
          conteudo?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          mes_referencia?: number | null
          ordem_exibicao?: number | null
          periodo_referencia?: string | null
          publicado?: boolean | null
          publicado_por?: string | null
          servidor_id?: string | null
          subcategoria?: string | null
          titulo?: string
          unidade_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publicacoes_lai_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacoes_lai_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacoes_lai_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacoes_lai_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacoes_legais: {
        Row: {
          arquivo_url: string | null
          conteudo_resumido: string | null
          contrato_id: string | null
          created_at: string | null
          created_by: string | null
          data_publicacao: string
          id: string
          numero_publicacao: string | null
          observacoes: string | null
          pagina: string | null
          pncp_id: string | null
          pncp_sequencial: number | null
          pncp_sincronizado: boolean | null
          pncp_sincronizado_em: string | null
          processo_licitatorio_id: string | null
          secao: string | null
          tipo_publicacao: string
          updated_at: string | null
          url_publicacao: string | null
          veiculo: Database["public"]["Enums"]["veiculo_publicacao"]
        }
        Insert: {
          arquivo_url?: string | null
          conteudo_resumido?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_publicacao: string
          id?: string
          numero_publicacao?: string | null
          observacoes?: string | null
          pagina?: string | null
          pncp_id?: string | null
          pncp_sequencial?: number | null
          pncp_sincronizado?: boolean | null
          pncp_sincronizado_em?: string | null
          processo_licitatorio_id?: string | null
          secao?: string | null
          tipo_publicacao: string
          updated_at?: string | null
          url_publicacao?: string | null
          veiculo: Database["public"]["Enums"]["veiculo_publicacao"]
        }
        Update: {
          arquivo_url?: string | null
          conteudo_resumido?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_publicacao?: string
          id?: string
          numero_publicacao?: string | null
          observacoes?: string | null
          pagina?: string | null
          pncp_id?: string | null
          pncp_sequencial?: number | null
          pncp_sincronizado?: boolean | null
          pncp_sincronizado_em?: string | null
          processo_licitatorio_id?: string | null
          secao?: string | null
          tipo_publicacao?: string
          updated_at?: string | null
          url_publicacao?: string | null
          veiculo?: Database["public"]["Enums"]["veiculo_publicacao"]
        }
        Relationships: [
          {
            foreignKeyName: "publicacoes_legais_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacoes_legais_processo_licitatorio_id_fkey"
            columns: ["processo_licitatorio_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos_lai: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_analise: string | null
          data_interposicao: string
          decisao: string | null
          documentos_anexos: Json | null
          fundamentacao: string
          fundamentacao_decisao: string | null
          id: string
          instancia: Database["public"]["Enums"]["instancia_recurso"]
          numero_recurso: string | null
          prazo_resposta: string
          responsavel_analise_id: string | null
          solicitacao_id: string
          status: Database["public"]["Enums"]["status_recurso_lai"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_analise?: string | null
          data_interposicao?: string
          decisao?: string | null
          documentos_anexos?: Json | null
          fundamentacao: string
          fundamentacao_decisao?: string | null
          id?: string
          instancia: Database["public"]["Enums"]["instancia_recurso"]
          numero_recurso?: string | null
          prazo_resposta: string
          responsavel_analise_id?: string | null
          solicitacao_id: string
          status?: Database["public"]["Enums"]["status_recurso_lai"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_analise?: string | null
          data_interposicao?: string
          decisao?: string | null
          documentos_anexos?: Json | null
          fundamentacao?: string
          fundamentacao_decisao?: string | null
          id?: string
          instancia?: Database["public"]["Enums"]["instancia_recurso"]
          numero_recurso?: string | null
          prazo_resposta?: string
          responsavel_analise_id?: string | null
          solicitacao_id?: string
          status?: Database["public"]["Enums"]["status_recurso_lai"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_lai_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_sic"
            referencedColumns: ["id"]
          },
        ]
      }
      regimes_trabalho: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          dias_trabalho: number[] | null
          exige_assinatura_servidor: boolean | null
          exige_foto: boolean | null
          exige_localizacao: boolean | null
          exige_registro_ponto: boolean | null
          exige_validacao_chefia: boolean | null
          id: string
          nome: string
          padrao_escala: string | null
          permite_ponto_remoto: boolean | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          dias_trabalho?: number[] | null
          exige_assinatura_servidor?: boolean | null
          exige_foto?: boolean | null
          exige_localizacao?: boolean | null
          exige_registro_ponto?: boolean | null
          exige_validacao_chefia?: boolean | null
          id?: string
          nome: string
          padrao_escala?: string | null
          permite_ponto_remoto?: boolean | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          dias_trabalho?: number[] | null
          exige_assinatura_servidor?: boolean | null
          exige_foto?: boolean | null
          exige_localizacao?: boolean | null
          exige_registro_ponto?: boolean | null
          exige_validacao_chefia?: boolean | null
          id?: string
          nome?: string
          padrao_escala?: string | null
          permite_ponto_remoto?: boolean | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      registros_ponto: {
        Row: {
          aprovado: boolean | null
          aprovador_id: string | null
          atrasos: number | null
          created_at: string | null
          data: string
          data_aprovacao: string | null
          dispositivo: string | null
          entrada1: string | null
          entrada2: string | null
          entrada3: string | null
          horas_extras: number | null
          horas_trabalhadas: number | null
          id: string
          ip_address: string | null
          latitude: number | null
          longitude: number | null
          observacao: string | null
          saida1: string | null
          saida2: string | null
          saida3: string | null
          saidas_antecipadas: number | null
          servidor_id: string
          status: Database["public"]["Enums"]["status_ponto"] | null
          tipo: Database["public"]["Enums"]["tipo_registro_ponto"] | null
          updated_at: string | null
        }
        Insert: {
          aprovado?: boolean | null
          aprovador_id?: string | null
          atrasos?: number | null
          created_at?: string | null
          data: string
          data_aprovacao?: string | null
          dispositivo?: string | null
          entrada1?: string | null
          entrada2?: string | null
          entrada3?: string | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          saida1?: string | null
          saida2?: string | null
          saida3?: string | null
          saidas_antecipadas?: number | null
          servidor_id: string
          status?: Database["public"]["Enums"]["status_ponto"] | null
          tipo?: Database["public"]["Enums"]["tipo_registro_ponto"] | null
          updated_at?: string | null
        }
        Update: {
          aprovado?: boolean | null
          aprovador_id?: string | null
          atrasos?: number | null
          created_at?: string | null
          data?: string
          data_aprovacao?: string | null
          dispositivo?: string | null
          entrada1?: string | null
          entrada2?: string | null
          entrada3?: string | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          saida1?: string | null
          saida2?: string | null
          saida3?: string | null
          saidas_antecipadas?: number | null
          servidor_id?: string
          status?: Database["public"]["Enums"]["status_ponto"] | null
          tipo?: Database["public"]["Enums"]["tipo_registro_ponto"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ponto_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ponto_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ponto_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      remessas_bancarias: {
        Row: {
          arquivo_url: string | null
          conta_autarquia_id: string
          created_at: string | null
          data_geracao: string | null
          enviado_em: string | null
          enviado_por: string | null
          folha_id: string
          gerado_por: string | null
          hash_arquivo: string | null
          id: string
          layout: string
          nome_arquivo: string
          numero_remessa: number
          observacoes: string | null
          quantidade_registros: number | null
          status: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          arquivo_url?: string | null
          conta_autarquia_id: string
          created_at?: string | null
          data_geracao?: string | null
          enviado_em?: string | null
          enviado_por?: string | null
          folha_id: string
          gerado_por?: string | null
          hash_arquivo?: string | null
          id?: string
          layout?: string
          nome_arquivo: string
          numero_remessa: number
          observacoes?: string | null
          quantidade_registros?: number | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          arquivo_url?: string | null
          conta_autarquia_id?: string
          created_at?: string | null
          data_geracao?: string | null
          enviado_em?: string | null
          enviado_por?: string | null
          folha_id?: string
          gerado_por?: string | null
          hash_arquivo?: string | null
          id?: string
          layout?: string
          nome_arquivo?: string
          numero_remessa?: number
          observacoes?: string | null
          quantidade_registros?: number | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "remessas_bancarias_conta_autarquia_id_fkey"
            columns: ["conta_autarquia_id"]
            isOneToOne: false
            referencedRelation: "contas_autarquia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remessas_bancarias_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remessas_bancarias_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remessas_bancarias_folha_id_fkey"
            columns: ["folha_id"]
            isOneToOne: false
            referencedRelation: "folhas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remessas_bancarias_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remessas_bancarias_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_checklist: {
        Row: {
          created_at: string
          created_by: string | null
          data_resposta: string | null
          evidencia_descricao: string | null
          evidencia_url: string | null
          exercicio: number
          id: string
          item_id: string
          justificativa: string | null
          observacoes: string | null
          plano_acao: string | null
          prazo_regularizacao: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_conformidade"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_resposta?: string | null
          evidencia_descricao?: string | null
          evidencia_url?: string | null
          exercicio: number
          id?: string
          item_id: string
          justificativa?: string | null
          observacoes?: string | null
          plano_acao?: string | null
          prazo_regularizacao?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_conformidade"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_resposta?: string | null
          evidencia_descricao?: string | null
          evidencia_url?: string | null
          exercicio?: number
          id?: string
          item_id?: string
          justificativa?: string | null
          observacoes?: string | null
          plano_acao?: string | null
          prazo_regularizacao?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_conformidade"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_checklist_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_checklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_checklist_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_checklist_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      retornos_bancarios: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string | null
          data_processamento: string | null
          detalhes: Json | null
          id: string
          processado_por: string | null
          quantidade_pagos: number | null
          quantidade_rejeitados: number | null
          remessa_id: string | null
          valor_pago: number | null
          valor_rejeitado: number | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          data_processamento?: string | null
          detalhes?: Json | null
          id?: string
          processado_por?: string | null
          quantidade_pagos?: number | null
          quantidade_rejeitados?: number | null
          remessa_id?: string | null
          valor_pago?: number | null
          valor_rejeitado?: number | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          data_processamento?: string | null
          detalhes?: Json | null
          id?: string
          processado_por?: string | null
          quantidade_pagos?: number | null
          quantidade_rejeitados?: number | null
          remessa_id?: string | null
          valor_pago?: number | null
          valor_rejeitado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retornos_bancarios_processado_por_fkey"
            columns: ["processado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retornos_bancarios_processado_por_fkey"
            columns: ["processado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retornos_bancarios_remessa_id_fkey"
            columns: ["remessa_id"]
            isOneToOne: false
            referencedRelation: "remessas_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes: {
        Row: {
          ata_aprovada: boolean | null
          ata_conteudo: string | null
          created_at: string | null
          created_by: string | null
          data_reuniao: string
          endereco_completo: string | null
          hora_fim: string | null
          hora_inicio: string
          id: string
          link_virtual: string | null
          local: string | null
          mensagem_convite: string | null
          numero_protocolo: string | null
          observacoes: string | null
          organizador_id: string | null
          pauta: string | null
          status: Database["public"]["Enums"]["status_reuniao"]
          tipo: Database["public"]["Enums"]["tipo_reuniao"]
          titulo: string
          unidade_responsavel_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ata_aprovada?: boolean | null
          ata_conteudo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_reuniao: string
          endereco_completo?: string | null
          hora_fim?: string | null
          hora_inicio: string
          id?: string
          link_virtual?: string | null
          local?: string | null
          mensagem_convite?: string | null
          numero_protocolo?: string | null
          observacoes?: string | null
          organizador_id?: string | null
          pauta?: string | null
          status?: Database["public"]["Enums"]["status_reuniao"]
          tipo?: Database["public"]["Enums"]["tipo_reuniao"]
          titulo: string
          unidade_responsavel_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ata_aprovada?: boolean | null
          ata_conteudo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_reuniao?: string
          endereco_completo?: string | null
          hora_fim?: string | null
          hora_inicio?: string
          id?: string
          link_virtual?: string | null
          local?: string | null
          mensagem_convite?: string | null
          numero_protocolo?: string | null
          observacoes?: string | null
          organizador_id?: string | null
          pauta?: string | null
          status?: Database["public"]["Enums"]["status_reuniao"]
          tipo?: Database["public"]["Enums"]["tipo_reuniao"]
          titulo?: string
          unidade_responsavel_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_unidade_responsavel_id_fkey"
            columns: ["unidade_responsavel_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos_institucionais: {
        Row: {
          ativo: boolean
          causa: string | null
          codigo: string
          consequencia: string | null
          controle_existente: string | null
          created_at: string
          created_by: string | null
          data_identificacao: string
          data_ultima_avaliacao: string | null
          descricao: string
          id: string
          impacto_inerente: Database["public"]["Enums"]["nivel_risco"]
          impacto_residual: Database["public"]["Enums"]["nivel_risco"] | null
          modulo_afetado: string | null
          nivel_risco_inerente: Database["public"]["Enums"]["nivel_risco"]
          nivel_risco_residual:
            | Database["public"]["Enums"]["nivel_risco"]
            | null
          probabilidade_inerente: Database["public"]["Enums"]["nivel_risco"]
          probabilidade_residual:
            | Database["public"]["Enums"]["nivel_risco"]
            | null
          processo_raci_id: string | null
          proxima_revisao: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_risco"]
          titulo: string
          unidade_responsavel_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          causa?: string | null
          codigo: string
          consequencia?: string | null
          controle_existente?: string | null
          created_at?: string
          created_by?: string | null
          data_identificacao?: string
          data_ultima_avaliacao?: string | null
          descricao: string
          id?: string
          impacto_inerente: Database["public"]["Enums"]["nivel_risco"]
          impacto_residual?: Database["public"]["Enums"]["nivel_risco"] | null
          modulo_afetado?: string | null
          nivel_risco_inerente: Database["public"]["Enums"]["nivel_risco"]
          nivel_risco_residual?:
            | Database["public"]["Enums"]["nivel_risco"]
            | null
          probabilidade_inerente: Database["public"]["Enums"]["nivel_risco"]
          probabilidade_residual?:
            | Database["public"]["Enums"]["nivel_risco"]
            | null
          processo_raci_id?: string | null
          proxima_revisao?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_risco"]
          titulo: string
          unidade_responsavel_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          causa?: string | null
          codigo?: string
          consequencia?: string | null
          controle_existente?: string | null
          created_at?: string
          created_by?: string | null
          data_identificacao?: string
          data_ultima_avaliacao?: string | null
          descricao?: string
          id?: string
          impacto_inerente?: Database["public"]["Enums"]["nivel_risco"]
          impacto_residual?: Database["public"]["Enums"]["nivel_risco"] | null
          modulo_afetado?: string | null
          nivel_risco_inerente?: Database["public"]["Enums"]["nivel_risco"]
          nivel_risco_residual?:
            | Database["public"]["Enums"]["nivel_risco"]
            | null
          probabilidade_inerente?: Database["public"]["Enums"]["nivel_risco"]
          probabilidade_residual?:
            | Database["public"]["Enums"]["nivel_risco"]
            | null
          processo_raci_id?: string | null
          proxima_revisao?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_risco"]
          titulo?: string
          unidade_responsavel_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "riscos_institucionais_processo_raci_id_fkey"
            columns: ["processo_raci_id"]
            isOneToOne: false
            referencedRelation: "matriz_raci_processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_institucionais_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_institucionais_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_institucionais_unidade_responsavel_id_fkey"
            columns: ["unidade_responsavel_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      rubricas: {
        Row: {
          ativo: boolean | null
          codigo: string
          codigo_esocial: string | null
          compoe_liquido: boolean | null
          created_at: string | null
          created_by: string | null
          descricao: string
          formula_expressao: string | null
          formula_referencia: string | null
          formula_tipo: Database["public"]["Enums"]["formula_tipo"]
          formula_valor: number | null
          id: string
          incide_13: boolean | null
          incide_base_consignavel: boolean | null
          incide_ferias: boolean | null
          incide_fgts: boolean | null
          incide_inss: boolean | null
          incide_irrf: boolean | null
          natureza: Database["public"]["Enums"]["natureza_rubrica"]
          observacoes: string | null
          ordem_calculo: number | null
          prioridade_desconto: number | null
          tipo: Database["public"]["Enums"]["tipo_rubrica"]
          updated_at: string | null
          updated_by: string | null
          valor_maximo: number | null
          valor_minimo: number | null
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          codigo_esocial?: string | null
          compoe_liquido?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao: string
          formula_expressao?: string | null
          formula_referencia?: string | null
          formula_tipo: Database["public"]["Enums"]["formula_tipo"]
          formula_valor?: number | null
          id?: string
          incide_13?: boolean | null
          incide_base_consignavel?: boolean | null
          incide_ferias?: boolean | null
          incide_fgts?: boolean | null
          incide_inss?: boolean | null
          incide_irrf?: boolean | null
          natureza: Database["public"]["Enums"]["natureza_rubrica"]
          observacoes?: string | null
          ordem_calculo?: number | null
          prioridade_desconto?: number | null
          tipo: Database["public"]["Enums"]["tipo_rubrica"]
          updated_at?: string | null
          updated_by?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          codigo_esocial?: string | null
          compoe_liquido?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          formula_expressao?: string | null
          formula_referencia?: string | null
          formula_tipo?: Database["public"]["Enums"]["formula_tipo"]
          formula_valor?: number | null
          id?: string
          incide_13?: boolean | null
          incide_base_consignavel?: boolean | null
          incide_ferias?: boolean | null
          incide_fgts?: boolean | null
          incide_inss?: boolean | null
          incide_irrf?: boolean | null
          natureza?: Database["public"]["Enums"]["natureza_rubrica"]
          observacoes?: string | null
          ordem_calculo?: number | null
          prioridade_desconto?: number | null
          tipo?: Database["public"]["Enums"]["tipo_rubrica"]
          updated_at?: string | null
          updated_by?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubricas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubricas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubricas_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubricas_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      rubricas_historico: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          campos_alterados: string[] | null
          dados_anteriores: Json
          dados_novos: Json
          id: string
          justificativa: string | null
          rubrica_id: string | null
          versao: number
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          campos_alterados?: string[] | null
          dados_anteriores: Json
          dados_novos: Json
          id?: string
          justificativa?: string | null
          rubrica_id?: string | null
          versao: number
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          campos_alterados?: string[] | null
          dados_anteriores?: Json
          dados_novos?: Json
          id?: string
          justificativa?: string | null
          rubrica_id?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubricas_historico_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubricas_historico_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubricas_historico_rubrica_id_fkey"
            columns: ["rubrica_id"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["id"]
          },
        ]
      }
      servidor_regime: {
        Row: {
          ativo: boolean | null
          carga_horaria_customizada: number | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          dias_trabalho_customizados: number[] | null
          id: string
          jornada_id: string | null
          observacoes: string | null
          regime_id: string
          servidor_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          carga_horaria_customizada?: number | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          dias_trabalho_customizados?: number[] | null
          id?: string
          jornada_id?: string | null
          observacoes?: string | null
          regime_id: string
          servidor_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          carga_horaria_customizada?: number | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          dias_trabalho_customizados?: number[] | null
          id?: string
          jornada_id?: string | null
          observacoes?: string | null
          regime_id?: string
          servidor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servidor_regime_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "config_jornada_padrao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidor_regime_regime_id_fkey"
            columns: ["regime_id"]
            isOneToOne: false
            referencedRelation: "regimes_trabalho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidor_regime_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidor_regime_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      servidores: {
        Row: {
          acumula_cargo: boolean | null
          acumulo_descricao: string | null
          ano_conclusao: number | null
          ativo: boolean | null
          banco_agencia: string | null
          banco_codigo: string | null
          banco_conta: string | null
          banco_nome: string | null
          banco_tipo_conta: string | null
          carga_horaria: number | null
          cargo_atual_id: string | null
          certificado_reservista: string | null
          cnh_categoria: string | null
          cnh_data_expedicao: string | null
          cnh_numero: string | null
          cnh_primeira_habilitacao: string | null
          cnh_uf: string | null
          cnh_validade: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_parentesco: string | null
          cpf: string
          created_at: string | null
          created_by: string | null
          ctps_data_emissao: string | null
          ctps_numero: string | null
          ctps_serie: string | null
          ctps_uf: string | null
          cursos_especializacao: string[] | null
          data_admissao: string | null
          data_desligamento: string | null
          data_exercicio: string | null
          data_nascimento: string | null
          data_posse: string | null
          declaracao_acumulacao_data: string | null
          declaracao_acumulacao_url: string | null
          declaracao_bens_data: string | null
          declaracao_bens_url: string | null
          dependentes: Json | null
          descontos: number | null
          email_institucional: string | null
          email_pessoal: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          escolaridade: string | null
          estado_civil: string | null
          formacao_academica: string | null
          foto_url: string | null
          funcao_exercida: string | null
          gratificacoes: number | null
          id: string
          indicacao: string | null
          instituicao_ensino: string | null
          matricula: string | null
          nacionalidade: string | null
          naturalidade_cidade: string | null
          naturalidade_uf: string | null
          nome_completo: string
          nome_mae: string | null
          nome_pai: string | null
          nome_social: string | null
          observacoes: string | null
          orgao_destino_cessao: string | null
          orgao_origem: string | null
          pcd: boolean | null
          pcd_tipo: string | null
          pis_pasep: string | null
          raca_cor: string | null
          regime_juridico: string | null
          remuneracao_bruta: number | null
          reservista_ano: number | null
          reservista_categoria: string | null
          reservista_data_emissao: string | null
          reservista_orgao: string | null
          rg: string | null
          rg_data_emissao: string | null
          rg_orgao_expedidor: string | null
          rg_uf: string | null
          sexo: string | null
          situacao: Database["public"]["Enums"]["situacao_funcional"]
          telefone_celular: string | null
          telefone_emergencia: string | null
          telefone_fixo: string | null
          tipo_sanguineo: string | null
          tipo_servidor: Database["public"]["Enums"]["tipo_servidor"] | null
          titulo_cidade_votacao: string | null
          titulo_data_emissao: string | null
          titulo_eleitor: string | null
          titulo_secao: string | null
          titulo_uf_votacao: string | null
          titulo_zona: string | null
          unidade_atual_id: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
          vinculo: Database["public"]["Enums"]["vinculo_funcional"]
        }
        Insert: {
          acumula_cargo?: boolean | null
          acumulo_descricao?: string | null
          ano_conclusao?: number | null
          ativo?: boolean | null
          banco_agencia?: string | null
          banco_codigo?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_tipo_conta?: string | null
          carga_horaria?: number | null
          cargo_atual_id?: string | null
          certificado_reservista?: string | null
          cnh_categoria?: string | null
          cnh_data_expedicao?: string | null
          cnh_numero?: string | null
          cnh_primeira_habilitacao?: string | null
          cnh_uf?: string | null
          cnh_validade?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_parentesco?: string | null
          cpf: string
          created_at?: string | null
          created_by?: string | null
          ctps_data_emissao?: string | null
          ctps_numero?: string | null
          ctps_serie?: string | null
          ctps_uf?: string | null
          cursos_especializacao?: string[] | null
          data_admissao?: string | null
          data_desligamento?: string | null
          data_exercicio?: string | null
          data_nascimento?: string | null
          data_posse?: string | null
          declaracao_acumulacao_data?: string | null
          declaracao_acumulacao_url?: string | null
          declaracao_bens_data?: string | null
          declaracao_bens_url?: string | null
          dependentes?: Json | null
          descontos?: number | null
          email_institucional?: string | null
          email_pessoal?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          formacao_academica?: string | null
          foto_url?: string | null
          funcao_exercida?: string | null
          gratificacoes?: number | null
          id?: string
          indicacao?: string | null
          instituicao_ensino?: string | null
          matricula?: string | null
          nacionalidade?: string | null
          naturalidade_cidade?: string | null
          naturalidade_uf?: string | null
          nome_completo: string
          nome_mae?: string | null
          nome_pai?: string | null
          nome_social?: string | null
          observacoes?: string | null
          orgao_destino_cessao?: string | null
          orgao_origem?: string | null
          pcd?: boolean | null
          pcd_tipo?: string | null
          pis_pasep?: string | null
          raca_cor?: string | null
          regime_juridico?: string | null
          remuneracao_bruta?: number | null
          reservista_ano?: number | null
          reservista_categoria?: string | null
          reservista_data_emissao?: string | null
          reservista_orgao?: string | null
          rg?: string | null
          rg_data_emissao?: string | null
          rg_orgao_expedidor?: string | null
          rg_uf?: string | null
          sexo?: string | null
          situacao?: Database["public"]["Enums"]["situacao_funcional"]
          telefone_celular?: string | null
          telefone_emergencia?: string | null
          telefone_fixo?: string | null
          tipo_sanguineo?: string | null
          tipo_servidor?: Database["public"]["Enums"]["tipo_servidor"] | null
          titulo_cidade_votacao?: string | null
          titulo_data_emissao?: string | null
          titulo_eleitor?: string | null
          titulo_secao?: string | null
          titulo_uf_votacao?: string | null
          titulo_zona?: string | null
          unidade_atual_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
          vinculo?: Database["public"]["Enums"]["vinculo_funcional"]
        }
        Update: {
          acumula_cargo?: boolean | null
          acumulo_descricao?: string | null
          ano_conclusao?: number | null
          ativo?: boolean | null
          banco_agencia?: string | null
          banco_codigo?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_tipo_conta?: string | null
          carga_horaria?: number | null
          cargo_atual_id?: string | null
          certificado_reservista?: string | null
          cnh_categoria?: string | null
          cnh_data_expedicao?: string | null
          cnh_numero?: string | null
          cnh_primeira_habilitacao?: string | null
          cnh_uf?: string | null
          cnh_validade?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_parentesco?: string | null
          cpf?: string
          created_at?: string | null
          created_by?: string | null
          ctps_data_emissao?: string | null
          ctps_numero?: string | null
          ctps_serie?: string | null
          ctps_uf?: string | null
          cursos_especializacao?: string[] | null
          data_admissao?: string | null
          data_desligamento?: string | null
          data_exercicio?: string | null
          data_nascimento?: string | null
          data_posse?: string | null
          declaracao_acumulacao_data?: string | null
          declaracao_acumulacao_url?: string | null
          declaracao_bens_data?: string | null
          declaracao_bens_url?: string | null
          dependentes?: Json | null
          descontos?: number | null
          email_institucional?: string | null
          email_pessoal?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          formacao_academica?: string | null
          foto_url?: string | null
          funcao_exercida?: string | null
          gratificacoes?: number | null
          id?: string
          indicacao?: string | null
          instituicao_ensino?: string | null
          matricula?: string | null
          nacionalidade?: string | null
          naturalidade_cidade?: string | null
          naturalidade_uf?: string | null
          nome_completo?: string
          nome_mae?: string | null
          nome_pai?: string | null
          nome_social?: string | null
          observacoes?: string | null
          orgao_destino_cessao?: string | null
          orgao_origem?: string | null
          pcd?: boolean | null
          pcd_tipo?: string | null
          pis_pasep?: string | null
          raca_cor?: string | null
          regime_juridico?: string | null
          remuneracao_bruta?: number | null
          reservista_ano?: number | null
          reservista_categoria?: string | null
          reservista_data_emissao?: string | null
          reservista_orgao?: string | null
          rg?: string | null
          rg_data_emissao?: string | null
          rg_orgao_expedidor?: string | null
          rg_uf?: string | null
          sexo?: string | null
          situacao?: Database["public"]["Enums"]["situacao_funcional"]
          telefone_celular?: string | null
          telefone_emergencia?: string | null
          telefone_fixo?: string | null
          tipo_sanguineo?: string | null
          tipo_servidor?: Database["public"]["Enums"]["tipo_servidor"] | null
          titulo_cidade_votacao?: string | null
          titulo_data_emissao?: string | null
          titulo_eleitor?: string | null
          titulo_secao?: string | null
          titulo_uf_votacao?: string | null
          titulo_zona?: string | null
          unidade_atual_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
          vinculo?: Database["public"]["Enums"]["vinculo_funcional"]
        }
        Relationships: [
          {
            foreignKeyName: "servidores_cargo_atual_id_fkey"
            columns: ["cargo_atual_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidores_unidade_atual_id_fkey"
            columns: ["unidade_atual_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_abono: {
        Row: {
          aprovado_chefia_em: string | null
          aprovado_chefia_por: string | null
          aprovado_rh_em: string | null
          aprovado_rh_por: string | null
          created_at: string | null
          created_by: string | null
          data_fim: string
          data_inicio: string
          documento_url: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          justificativa: string
          motivo_rejeicao: string | null
          servidor_id: string
          status: string | null
          tipo_abono_id: string
          updated_at: string | null
        }
        Insert: {
          aprovado_chefia_em?: string | null
          aprovado_chefia_por?: string | null
          aprovado_rh_em?: string | null
          aprovado_rh_por?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim: string
          data_inicio: string
          documento_url?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          justificativa: string
          motivo_rejeicao?: string | null
          servidor_id: string
          status?: string | null
          tipo_abono_id: string
          updated_at?: string | null
        }
        Update: {
          aprovado_chefia_em?: string | null
          aprovado_chefia_por?: string | null
          aprovado_rh_em?: string | null
          aprovado_rh_por?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          documento_url?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          justificativa?: string
          motivo_rejeicao?: string | null
          servidor_id?: string
          status?: string | null
          tipo_abono_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_abono_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_abono_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_abono_tipo_abono_id_fkey"
            columns: ["tipo_abono_id"]
            isOneToOne: false
            referencedRelation: "tipos_abono"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_ajuste_ponto: {
        Row: {
          aprovador_id: string | null
          campo_ajuste: string | null
          comprovante_url: string | null
          created_at: string | null
          data_aprovacao: string | null
          data_ocorrido: string
          horario_atual: string | null
          horario_correto: string | null
          id: string
          motivo: string
          observacao_aprovador: string | null
          registro_ponto_id: string | null
          servidor_id: string
          status: Database["public"]["Enums"]["status_solicitacao"] | null
          tipo_ajuste: string
          updated_at: string | null
        }
        Insert: {
          aprovador_id?: string | null
          campo_ajuste?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_ocorrido: string
          horario_atual?: string | null
          horario_correto?: string | null
          id?: string
          motivo: string
          observacao_aprovador?: string | null
          registro_ponto_id?: string | null
          servidor_id: string
          status?: Database["public"]["Enums"]["status_solicitacao"] | null
          tipo_ajuste: string
          updated_at?: string | null
        }
        Update: {
          aprovador_id?: string | null
          campo_ajuste?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_ocorrido?: string
          horario_atual?: string | null
          horario_correto?: string | null
          id?: string
          motivo?: string
          observacao_aprovador?: string | null
          registro_ponto_id?: string | null
          servidor_id?: string
          status?: Database["public"]["Enums"]["status_solicitacao"] | null
          tipo_ajuste?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_ajuste_ponto_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_ajuste_ponto_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_ajuste_ponto_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_ajuste_ponto_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_ajuste_ponto_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_sic: {
        Row: {
          bloqueado_ate: string | null
          categoria: string | null
          created_at: string | null
          descricao_pedido: string
          forma_recebimento: string | null
          id: string
          prazo_resposta: string | null
          protocolo: string
          recurso_data: string | null
          recurso_respondido_em: string | null
          recurso_respondido_por: string | null
          recurso_resposta: string | null
          recurso_texto: string | null
          respondido_em: string | null
          respondido_por: string | null
          resposta: string | null
          resposta_arquivo_url: string | null
          solicitante_documento: string | null
          solicitante_email: string | null
          solicitante_hash: string | null
          solicitante_nome: string
          solicitante_telefone: string | null
          status: string | null
          tentativas_consulta: number | null
          token_consulta: string | null
          updated_at: string | null
        }
        Insert: {
          bloqueado_ate?: string | null
          categoria?: string | null
          created_at?: string | null
          descricao_pedido: string
          forma_recebimento?: string | null
          id?: string
          prazo_resposta?: string | null
          protocolo: string
          recurso_data?: string | null
          recurso_respondido_em?: string | null
          recurso_respondido_por?: string | null
          recurso_resposta?: string | null
          recurso_texto?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
          resposta_arquivo_url?: string | null
          solicitante_documento?: string | null
          solicitante_email?: string | null
          solicitante_hash?: string | null
          solicitante_nome: string
          solicitante_telefone?: string | null
          status?: string | null
          tentativas_consulta?: number | null
          token_consulta?: string | null
          updated_at?: string | null
        }
        Update: {
          bloqueado_ate?: string | null
          categoria?: string | null
          created_at?: string | null
          descricao_pedido?: string
          forma_recebimento?: string | null
          id?: string
          prazo_resposta?: string | null
          protocolo?: string
          recurso_data?: string | null
          recurso_respondido_em?: string | null
          recurso_respondido_por?: string | null
          recurso_resposta?: string | null
          recurso_texto?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
          resposta_arquivo_url?: string | null
          solicitante_documento?: string | null
          solicitante_email?: string | null
          solicitante_hash?: string | null
          solicitante_nome?: string
          solicitante_telefone?: string | null
          status?: string | null
          tentativas_consulta?: number | null
          token_consulta?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_sic_recurso_respondido_por_fkey"
            columns: ["recurso_respondido_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_sic_recurso_respondido_por_fkey"
            columns: ["recurso_respondido_por"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_sic_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_sic_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      tabela_inss: {
        Row: {
          aliquota: number
          created_at: string | null
          created_by: string | null
          descricao: string | null
          faixa_ordem: number
          id: string
          valor_maximo: number | null
          valor_minimo: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          aliquota: number
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          faixa_ordem: number
          id?: string
          valor_maximo?: number | null
          valor_minimo: number
          vigencia_fim?: string | null
          vigencia_inicio: string
        }
        Update: {
          aliquota?: number
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          faixa_ordem?: number
          id?: string
          valor_maximo?: number | null
          valor_minimo?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabela_inss_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabela_inss_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      tabela_irrf: {
        Row: {
          aliquota: number
          created_at: string | null
          created_by: string | null
          descricao: string | null
          faixa_ordem: number
          id: string
          parcela_deduzir: number
          valor_maximo: number | null
          valor_minimo: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          aliquota: number
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          faixa_ordem: number
          id?: string
          parcela_deduzir?: number
          valor_maximo?: number | null
          valor_minimo: number
          vigencia_fim?: string | null
          vigencia_inicio: string
        }
        Update: {
          aliquota?: number
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          faixa_ordem?: number
          id?: string
          parcela_deduzir?: number
          valor_maximo?: number | null
          valor_minimo?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabela_irrf_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabela_irrf_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      termos_cessao: {
        Row: {
          agenda_id: string
          ano: number
          autoridade_cargo: string | null
          autoridade_concedente: string | null
          cessionario_documento: string | null
          cessionario_email: string | null
          cessionario_endereco: string | null
          cessionario_nome: string
          cessionario_telefone: string | null
          cessionario_tipo: string | null
          chefe_responsavel_id: string | null
          condicoes_uso: string | null
          created_at: string | null
          created_by: string | null
          data_aceite_responsabilidade: string | null
          data_assinatura: string | null
          data_emissao: string | null
          documento_assinado_url: string | null
          documento_gerado_url: string | null
          finalidade: string
          historico_renovacoes: Json | null
          id: string
          numero_protocolo: string | null
          numero_termo: string
          observacoes: string | null
          periodo_fim: string
          periodo_inicio: string
          responsabilidades: string | null
          restricoes_uso: string | null
          status: Database["public"]["Enums"]["status_termo_cessao"]
          termo_responsabilidade_aceito: boolean | null
          tipo_termo: string | null
          unidade_local_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          agenda_id: string
          ano: number
          autoridade_cargo?: string | null
          autoridade_concedente?: string | null
          cessionario_documento?: string | null
          cessionario_email?: string | null
          cessionario_endereco?: string | null
          cessionario_nome: string
          cessionario_telefone?: string | null
          cessionario_tipo?: string | null
          chefe_responsavel_id?: string | null
          condicoes_uso?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aceite_responsabilidade?: string | null
          data_assinatura?: string | null
          data_emissao?: string | null
          documento_assinado_url?: string | null
          documento_gerado_url?: string | null
          finalidade: string
          historico_renovacoes?: Json | null
          id?: string
          numero_protocolo?: string | null
          numero_termo: string
          observacoes?: string | null
          periodo_fim: string
          periodo_inicio: string
          responsabilidades?: string | null
          restricoes_uso?: string | null
          status?: Database["public"]["Enums"]["status_termo_cessao"]
          termo_responsabilidade_aceito?: boolean | null
          tipo_termo?: string | null
          unidade_local_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          agenda_id?: string
          ano?: number
          autoridade_cargo?: string | null
          autoridade_concedente?: string | null
          cessionario_documento?: string | null
          cessionario_email?: string | null
          cessionario_endereco?: string | null
          cessionario_nome?: string
          cessionario_telefone?: string | null
          cessionario_tipo?: string | null
          chefe_responsavel_id?: string | null
          condicoes_uso?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aceite_responsabilidade?: string | null
          data_assinatura?: string | null
          data_emissao?: string | null
          documento_assinado_url?: string | null
          documento_gerado_url?: string | null
          finalidade?: string
          historico_renovacoes?: Json | null
          id?: string
          numero_protocolo?: string | null
          numero_termo?: string
          observacoes?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          responsabilidades?: string | null
          restricoes_uso?: string | null
          status?: Database["public"]["Enums"]["status_termo_cessao"]
          termo_responsabilidade_aceito?: boolean | null
          tipo_termo?: string | null
          unidade_local_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "termos_cessao_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agenda_unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_cessao_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["agenda_id"]
          },
          {
            foreignKeyName: "termos_cessao_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["agenda_id"]
          },
          {
            foreignKeyName: "termos_cessao_chefe_responsavel_id_fkey"
            columns: ["chefe_responsavel_id"]
            isOneToOne: false
            referencedRelation: "nomeacoes_chefe_unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_cessao_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_cessao_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "termos_cessao_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "termos_cessao_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_cessao_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      tipos_abono: {
        Row: {
          ativo: boolean | null
          codigo: string
          conta_como_presenca: boolean | null
          created_at: string | null
          descricao: string | null
          exige_aprovacao_chefia: boolean | null
          exige_aprovacao_rh: boolean | null
          exige_documento: boolean | null
          id: string
          impacto_horas: string | null
          max_horas_dia: number | null
          max_ocorrencias_mes: number | null
          nome: string
          ordem: number | null
          tipos_documento_aceitos: string[] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          conta_como_presenca?: boolean | null
          created_at?: string | null
          descricao?: string | null
          exige_aprovacao_chefia?: boolean | null
          exige_aprovacao_rh?: boolean | null
          exige_documento?: boolean | null
          id?: string
          impacto_horas?: string | null
          max_horas_dia?: number | null
          max_ocorrencias_mes?: number | null
          nome: string
          ordem?: number | null
          tipos_documento_aceitos?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          conta_como_presenca?: boolean | null
          created_at?: string | null
          descricao?: string | null
          exige_aprovacao_chefia?: boolean | null
          exige_aprovacao_rh?: boolean | null
          exige_documento?: boolean | null
          id?: string
          impacto_horas?: string | null
          max_horas_dia?: number | null
          max_ocorrencias_mes?: number | null
          nome?: string
          ordem?: number | null
          tipos_documento_aceitos?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unidades_locais: {
        Row: {
          areas_disponiveis: string[] | null
          autoridade_autorizadora: string | null
          capacidade: number | null
          codigo_unidade: string | null
          created_at: string | null
          created_by: string | null
          diretoria_vinculada: string | null
          documentos: string[] | null
          endereco_completo: string | null
          estrutura_disponivel: string | null
          fotos: string[] | null
          historico_alteracoes: Json | null
          horario_funcionamento: string | null
          id: string
          municipio: string
          natureza_uso: string | null
          nome_unidade: string
          observacoes: string | null
          regras_de_uso: string | null
          status: Database["public"]["Enums"]["status_unidade_local"]
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade_local"]
          unidade_administrativa: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          areas_disponiveis?: string[] | null
          autoridade_autorizadora?: string | null
          capacidade?: number | null
          codigo_unidade?: string | null
          created_at?: string | null
          created_by?: string | null
          diretoria_vinculada?: string | null
          documentos?: string[] | null
          endereco_completo?: string | null
          estrutura_disponivel?: string | null
          fotos?: string[] | null
          historico_alteracoes?: Json | null
          horario_funcionamento?: string | null
          id?: string
          municipio: string
          natureza_uso?: string | null
          nome_unidade: string
          observacoes?: string | null
          regras_de_uso?: string | null
          status?: Database["public"]["Enums"]["status_unidade_local"]
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade_local"]
          unidade_administrativa?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          areas_disponiveis?: string[] | null
          autoridade_autorizadora?: string | null
          capacidade?: number | null
          codigo_unidade?: string | null
          created_at?: string | null
          created_by?: string | null
          diretoria_vinculada?: string | null
          documentos?: string[] | null
          endereco_completo?: string | null
          estrutura_disponivel?: string | null
          fotos?: string[] | null
          historico_alteracoes?: Json | null
          horario_funcionamento?: string | null
          id?: string
          municipio?: string
          natureza_uso?: string | null
          nome_unidade?: string
          observacoes?: string | null
          regras_de_uso?: string | null
          status?: Database["public"]["Enums"]["status_unidade_local"]
          tipo_unidade?: Database["public"]["Enums"]["tipo_unidade_local"]
          unidade_administrativa?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_org_units: {
        Row: {
          access_scope: Database["public"]["Enums"]["access_scope"] | null
          created_at: string | null
          created_by: string | null
          id: string
          is_primary: boolean | null
          unidade_id: string
          user_id: string
        }
        Insert: {
          access_scope?: Database["public"]["Enums"]["access_scope"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_primary?: boolean | null
          unidade_id: string
          user_id: string
        }
        Update: {
          access_scope?: Database["public"]["Enums"]["access_scope"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_primary?: boolean | null
          unidade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_org_units_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          active_sessions: number | null
          created_at: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          failed_login_attempts: number | null
          force_password_change: boolean | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_login_ip: unknown
          locked_until: string | null
          mfa_enabled: boolean | null
          mfa_method: string | null
          mfa_required: boolean | null
          password_changed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_sessions?: number | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          failed_login_attempts?: number | null
          force_password_change?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_login_ip?: unknown
          locked_until?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          mfa_required?: boolean | null
          password_changed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_sessions?: number | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          failed_login_attempts?: number | null
          force_password_change?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_login_ip?: unknown
          locked_until?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          mfa_required?: boolean | null
          password_changed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuario_perfis: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          id: string
          observacao: string | null
          perfil_id: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          observacao?: string | null
          perfil_id: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          observacao?: string | null
          perfil_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_perfis_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      viagens_diarias: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_retorno: string
          data_saida: string
          destino_cidade: string
          destino_pais: string | null
          destino_uf: string
          finalidade: string
          id: string
          justificativa: string | null
          meio_transporte: string | null
          observacoes: string | null
          passagem_aerea: boolean | null
          portaria_data: string | null
          portaria_numero: string | null
          portaria_url: string | null
          quantidade_diarias: number | null
          relatorio_apresentado: boolean | null
          relatorio_data: string | null
          relatorio_url: string | null
          servidor_id: string
          status: string | null
          updated_at: string | null
          valor_diaria: number | null
          valor_total: number | null
          veiculo_oficial: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_retorno: string
          data_saida: string
          destino_cidade: string
          destino_pais?: string | null
          destino_uf: string
          finalidade: string
          id?: string
          justificativa?: string | null
          meio_transporte?: string | null
          observacoes?: string | null
          passagem_aerea?: boolean | null
          portaria_data?: string | null
          portaria_numero?: string | null
          portaria_url?: string | null
          quantidade_diarias?: number | null
          relatorio_apresentado?: boolean | null
          relatorio_data?: string | null
          relatorio_url?: string | null
          servidor_id: string
          status?: string | null
          updated_at?: string | null
          valor_diaria?: number | null
          valor_total?: number | null
          veiculo_oficial?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_retorno?: string
          data_saida?: string
          destino_cidade?: string
          destino_pais?: string | null
          destino_uf?: string
          finalidade?: string
          id?: string
          justificativa?: string | null
          meio_transporte?: string | null
          observacoes?: string | null
          passagem_aerea?: boolean | null
          portaria_data?: string | null
          portaria_numero?: string | null
          portaria_url?: string | null
          quantidade_diarias?: number | null
          relatorio_apresentado?: boolean | null
          relatorio_data?: string | null
          relatorio_url?: string | null
          servidor_id?: string
          status?: string | null
          updated_at?: string | null
          valor_diaria?: number | null
          valor_total?: number | null
          veiculo_oficial?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "viagens_diarias_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viagens_diarias_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      vinculos_funcionais: {
        Row: {
          ativo: boolean | null
          ato_data: string | null
          ato_doe_data: string | null
          ato_doe_numero: string | null
          ato_numero: string | null
          ato_tipo: string | null
          ato_url: string | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          fundamentacao_legal: string | null
          id: string
          observacoes: string | null
          onus_origem: boolean | null
          orgao_destino: string | null
          orgao_origem: string | null
          servidor_id: string
          tipo_vinculo: Database["public"]["Enums"]["tipo_vinculo_funcional"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          ato_data?: string | null
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_numero?: string | null
          ato_tipo?: string | null
          ato_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          fundamentacao_legal?: string | null
          id?: string
          observacoes?: string | null
          onus_origem?: boolean | null
          orgao_destino?: string | null
          orgao_origem?: string | null
          servidor_id: string
          tipo_vinculo: Database["public"]["Enums"]["tipo_vinculo_funcional"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          ato_data?: string | null
          ato_doe_data?: string | null
          ato_doe_numero?: string | null
          ato_numero?: string | null
          ato_tipo?: string | null
          ato_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          fundamentacao_legal?: string | null
          id?: string
          observacoes?: string | null
          onus_origem?: boolean | null
          orgao_destino?: string | null
          orgao_origem?: string | null
          servidor_id?: string
          tipo_vinculo?: Database["public"]["Enums"]["tipo_vinculo_funcional"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinculos_funcionais_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_funcionais_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_cedencias_a_vencer: {
        Row: {
          agenda_id: string | null
          data_fim: string | null
          data_inicio: string | null
          dias_para_vencer: number | null
          municipio: string | null
          nome_unidade: string | null
          numero_protocolo: string | null
          solicitante_nome: string | null
          status: Database["public"]["Enums"]["status_agenda"] | null
          titulo: string | null
          unidade_id: string | null
        }
        Relationships: []
      }
      v_permissoes_admin: {
        Row: {
          capacidade: string | null
          codigo: string | null
          concedido: boolean | null
          dominio: string | null
          nome: string | null
          perfil_codigo: string | null
          perfil_nome: string | null
        }
        Relationships: []
      }
      v_processos_resumo: {
        Row: {
          assunto: string | null
          created_at: string | null
          created_by: string | null
          data_abertura: string | null
          data_encerramento: string | null
          id: string | null
          interessado_nome: string | null
          numero_formatado: string | null
          prazos_vencidos: number | null
          sigilo: string | null
          status: string | null
          tipo_processo: string | null
          total_despachos: number | null
          total_documentos: number | null
          total_movimentacoes: number | null
          ultima_movimentacao: string | null
          unidade_origem: string | null
        }
        Relationships: []
      }
      v_relatorio_patrimonio: {
        Row: {
          anexos: string[] | null
          categoria: string | null
          codigo_unidade: string | null
          created_at: string | null
          data_aquisicao: string | null
          descricao: string | null
          estado_conservacao:
            | Database["public"]["Enums"]["estado_conservacao"]
            | null
          id: string | null
          item: string | null
          municipio: string | null
          nome_unidade: string | null
          numero_tombo: string | null
          observacoes: string | null
          quantidade: number | null
          situacao: Database["public"]["Enums"]["situacao_patrimonio"] | null
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade_local"] | null
          unidade_id: string | null
          unidade_status:
            | Database["public"]["Enums"]["status_unidade_local"]
            | null
          updated_at: string | null
          valor_estimado: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      v_relatorio_unidades_locais: {
        Row: {
          agendamentos_aprovados: number | null
          agendamentos_pendentes: number | null
          areas_disponiveis: string[] | null
          autoridade_autorizadora: string | null
          capacidade: number | null
          chefe_ato_numero: string | null
          chefe_atual_cargo: string | null
          chefe_atual_id: string | null
          chefe_atual_nome: string | null
          chefe_data_inicio: string | null
          codigo_unidade: string | null
          created_at: string | null
          diretoria_vinculada: string | null
          documentos: string[] | null
          endereco_completo: string | null
          estrutura_disponivel: string | null
          fotos: string[] | null
          horario_funcionamento: string | null
          id: string | null
          municipio: string | null
          natureza_uso: string | null
          nome_unidade: string | null
          observacoes: string | null
          patrimonio_bom_estado: number | null
          patrimonio_manutencao: number | null
          patrimonio_valor_total: number | null
          regras_de_uso: string | null
          status: Database["public"]["Enums"]["status_unidade_local"] | null
          termos_vigentes: number | null
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade_local"] | null
          total_agendamentos: number | null
          total_patrimonio: number | null
          total_termos_cessao: number | null
          unidade_administrativa: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nomeacoes_chefe_unidade_servidor_id_fkey"
            columns: ["chefe_atual_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_servidor_id_fkey"
            columns: ["chefe_atual_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      v_relatorio_uso_unidades: {
        Row: {
          agenda_id: string | null
          data_fim: string | null
          data_inicio: string | null
          dias_uso: number | null
          municipio: string | null
          nome_unidade: string | null
          publico_estimado: number | null
          solicitante_nome: string | null
          status_agenda: Database["public"]["Enums"]["status_agenda"] | null
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade_local"] | null
          tipo_uso: string | null
          titulo: string | null
          unidade_id: string | null
        }
        Relationships: []
      }
      v_servidores_situacao: {
        Row: {
          ativo: boolean | null
          cargo_id: string | null
          cargo_nome: string | null
          cargo_sigla: string | null
          cpf: string | null
          data_exercicio: string | null
          data_nomeacao: string | null
          data_posse: string | null
          foto_url: string | null
          id: string | null
          matricula: string | null
          nome_completo: string | null
          provimento_id: string | null
          situacao: Database["public"]["Enums"]["situacao_funcional"] | null
          tipo_servidor: Database["public"]["Enums"]["tipo_servidor"] | null
          unidade_id: string | null
          unidade_nome: string | null
          unidade_sigla: string | null
          vinculo: Database["public"]["Enums"]["vinculo_funcional"] | null
        }
        Relationships: [
          {
            foreignKeyName: "servidores_cargo_atual_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidores_unidade_atual_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sic_consulta_publica: {
        Row: {
          dias_restantes: number | null
          prazo_resposta: string | null
          protocolo: string | null
          respondido_em: string | null
          resposta: string | null
          status: string | null
        }
        Insert: {
          dias_restantes?: never
          prazo_resposta?: string | null
          protocolo?: string | null
          respondido_em?: string | null
          resposta?: never
          status?: string | null
        }
        Update: {
          dias_restantes?: never
          prazo_resposta?: string | null
          protocolo?: string | null
          respondido_em?: string | null
          resposta?: never
          status?: string | null
        }
        Relationships: []
      }
      v_usuarios_sistema: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          perfis: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          perfis?: never
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          perfis?: never
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      atualizar_codigos_unidades_locais: { Args: never; Returns: undefined }
      calcular_horas_trabalhadas: {
        Args: {
          p_entrada1: string
          p_entrada2: string
          p_entrada3?: string
          p_saida1: string
          p_saida2: string
          p_saida3?: string
        }
        Returns: number
      }
      calcular_inss_servidor: {
        Args: { p_base_inss: number; p_vigencia?: string }
        Returns: number
      }
      calcular_irrf: {
        Args: { p_base_irrf: number; p_vigencia?: string }
        Returns: number
      }
      calcular_prazo_lai: {
        Args: { p_data_inicio: string; p_tipo_prazo?: string }
        Returns: string
      }
      can_approve: {
        Args: { _module_name?: string; _user_id: string }
        Returns: boolean
      }
      can_view_audit: { Args: { _user_id: string }; Returns: boolean }
      can_view_indicacao: { Args: { _user_id: string }; Returns: boolean }
      consultar_protocolo_sic: {
        Args: { p_protocolo: string; p_token: string }
        Returns: {
          data_resposta: string
          data_solicitacao: string
          dias_restantes: number
          prazo_resposta: string
          protocolo: string
          resposta: string
          status: string
        }[]
      }
      count_dependentes_irrf: {
        Args: { p_data?: string; p_servidor_id: string }
        Returns: number
      }
      criar_usuario_para_servidor: {
        Args: {
          p_email: string
          p_role?: Database["public"]["Enums"]["app_role"]
          p_servidor_id: string
        }
        Returns: string
      }
      fn_atualizar_situacao_servidor: {
        Args: { p_servidor_id: string }
        Returns: undefined
      }
      fn_calcular_sla_processo: {
        Args: { p_processo_id: string }
        Returns: {
          dias_aberto: number
          dias_ultima_movimentacao: number
          status_sla: string
        }[]
      }
      fn_contar_processos_por_status: {
        Args: never
        Returns: {
          quantidade: number
          status: string
        }[]
      }
      fn_pode_arquivar_processo: {
        Args: { p_processo_id: string }
        Returns: boolean
      }
      fn_proximo_numero_processo: { Args: { p_ano?: number }; Returns: string }
      gerar_codigo_pre_cadastro: { Args: never; Returns: string }
      gerar_link_frequencia: { Args: never; Returns: string }
      gerar_numero_portaria: { Args: { p_ano?: number }; Returns: string }
      gerar_protocolo_cedencia: {
        Args: { p_unidade_id: string }
        Returns: string
      }
      gerar_protocolo_memorando_lotacao: { Args: never; Returns: string }
      get_chefe_unidade_atual: {
        Args: { p_unidade_id: string }
        Returns: {
          ato_numero: string
          cargo: string
          data_inicio: string
          nomeacao_id: string
          servidor_id: string
          servidor_nome: string
        }[]
      }
      get_hierarquia_unidade: {
        Args: { p_unidade_id: string }
        Returns: {
          id: string
          nivel: number
          nome: string
          tipo: Database["public"]["Enums"]["tipo_unidade"]
        }[]
      }
      get_parametro_vigente:
        | { Args: { p_tipo: string; p_vigencia?: string }; Returns: number }
        | { Args: { p_data?: string; p_tipo: string }; Returns: number }
      get_permissions_from_servidor: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_permission"][]
      }
      get_proximo_numero_remessa: {
        Args: { p_ano: number; p_conta_id: string }
        Returns: number
      }
      get_subordinados_unidade: {
        Args: { p_unidade_id: string }
        Returns: {
          id: string
          nivel: number
          nome: string
          tipo: Database["public"]["Enums"]["tipo_unidade"]
        }[]
      }
      get_user_permissions: { Args: { _user_id: string }; Returns: string[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_usuario_tecnico: { Args: { _user_id: string }; Returns: boolean }
      list_public_tables: {
        Args: never
        Returns: {
          row_count: number
          table_name: string
        }[]
      }
      listar_permissoes_usuario: {
        Args: { check_user_id: string }
        Returns: {
          funcao_codigo: string
          funcao_id: string
          funcao_nome: string
          icone: string
          modulo: string
          perfil_nome: string
          rota: string
          submodulo: string
          tipo_acao: string
        }[]
      }
      log_audit: {
        Args: {
          _action: Database["public"]["Enums"]["audit_action"]
          _after_data?: Json
          _before_data?: Json
          _description?: string
          _entity_id?: string
          _entity_type?: string
          _metadata?: Json
          _module_name?: string
        }
        Returns: string
      }
      obter_dado_oficial: { Args: { p_chave: string }; Returns: string }
      processar_folha_pagamento: { Args: { p_folha_id: string }; Returns: Json }
      promover_rascunho: {
        Args: { p_justificativa?: string; p_rascunho_id: string }
        Returns: boolean
      }
      user_has_unit_access: {
        Args: { _unidade_id: string; _user_id: string }
        Returns: boolean
      }
      usuario_eh_admin: { Args: { check_user_id: string }; Returns: boolean }
      usuario_eh_super_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      usuario_tem_permissao: {
        Args: { _codigo_funcao: string; _user_id: string }
        Returns: boolean
      }
      verificar_conflito_agenda: {
        Args: {
          p_agenda_id?: string
          p_data_fim: string
          p_data_inicio: string
          p_unidade_id: string
        }
        Returns: {
          agendas_conflitantes: Json
          tem_conflito: boolean
        }[]
      }
    }
    Enums: {
      access_scope: "all" | "org_unit" | "local_unit" | "own" | "readonly"
      app_permission:
        | "users.read"
        | "users.create"
        | "users.update"
        | "users.delete"
        | "content.read"
        | "content.create"
        | "content.update"
        | "content.delete"
        | "reports.view"
        | "reports.export"
        | "settings.view"
        | "settings.edit"
        | "processes.read"
        | "processes.create"
        | "processes.update"
        | "processes.delete"
        | "processes.approve"
        | "roles.manage"
        | "permissions.manage"
        | "documents.view"
        | "documents.create"
        | "documents.edit"
        | "documents.delete"
        | "requests.create"
        | "requests.view"
        | "requests.approve"
        | "requests.reject"
        | "audit.view"
        | "audit.export"
        | "approval.delegate"
        | "org_units.manage"
        | "mfa.manage"
      app_role:
        | "admin"
        | "manager"
        | "user"
        | "guest"
        | "presidencia"
        | "diraf"
        | "rh"
        | "ti_admin"
        | "gabinete"
        | "controle_interno"
        | "juridico"
        | "cpl"
        | "ascom"
        | "cadastrador_local"
        | "cadastrador_setor"
        | "cadastrador_leitura"
      approval_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
        | "cancelled"
      audit_action:
        | "login"
        | "logout"
        | "login_failed"
        | "password_change"
        | "password_reset"
        | "create"
        | "update"
        | "delete"
        | "view"
        | "export"
        | "upload"
        | "download"
        | "approve"
        | "reject"
        | "submit"
      backup_status: "pending" | "running" | "success" | "failed" | "partial"
      backup_type: "daily" | "weekly" | "monthly" | "manual"
      categoria_cargo:
        | "efetivo"
        | "comissionado"
        | "funcao_gratificada"
        | "temporario"
        | "estagiario"
      categoria_demanda_ascom:
        | "cobertura_institucional"
        | "criacao_artes"
        | "conteudo_institucional"
        | "gestao_redes_sociais"
        | "imprensa_relacoes"
        | "demandas_emergenciais"
      categoria_portaria:
        | "estruturante"
        | "normativa"
        | "pessoal"
        | "delegacao"
        | "nomeacao"
        | "exoneracao"
        | "designacao"
        | "dispensa"
        | "cessao"
        | "ferias"
        | "licenca"
      decisao_despacho:
        | "deferido"
        | "indeferido"
        | "parcialmente_deferido"
        | "encaminhar"
        | "arquivar"
        | "suspender"
        | "informar"
      estado_conservacao: "otimo" | "bom" | "regular" | "ruim" | "inservivel"
      fase_licitacao:
        | "planejamento"
        | "elaboracao"
        | "edital"
        | "publicacao"
        | "propostas"
        | "habilitacao"
        | "julgamento"
        | "homologacao"
        | "adjudicacao"
        | "contratacao"
        | "encerrado"
        | "revogado"
        | "anulado"
        | "deserto"
        | "fracassado"
      formula_tipo:
        | "valor_fixo"
        | "percentual_base"
        | "quantidade_valor"
        | "calculo_especial"
        | "referencia_cargo"
      instancia_recurso: "primeira" | "segunda"
      modalidade_licitacao:
        | "pregao_eletronico"
        | "pregao_presencial"
        | "concorrencia"
        | "concurso"
        | "leilao"
        | "dialogo_competitivo"
        | "dispensa"
        | "inexigibilidade"
      natureza_cargo: "efetivo" | "comissionado"
      natureza_rubrica: "remuneratorio" | "indenizatorio" | "informativo"
      nivel_perfil: "sistema" | "organizacional" | "operacional"
      nivel_risco: "muito_baixo" | "baixo" | "medio" | "alto" | "muito_alto"
      nivel_sigilo_processo: "publico" | "restrito" | "sigiloso"
      origem_lancamento: "automatico" | "manual" | "importado" | "retroativo"
      periodicidade_controle:
        | "diario"
        | "semanal"
        | "quinzenal"
        | "mensal"
        | "bimestral"
        | "trimestral"
        | "semestral"
        | "anual"
        | "eventual"
      prioridade_debito: "critica" | "alta" | "media" | "baixa"
      prioridade_demanda_ascom: "baixa" | "normal" | "alta" | "urgente"
      referencia_prazo_processo:
        | "legal"
        | "interno"
        | "judicial"
        | "contratual"
        | "regulamentar"
      situacao_funcional:
        | "ativo"
        | "afastado"
        | "cedido"
        | "licenca"
        | "ferias"
        | "exonerado"
        | "aposentado"
        | "falecido"
        | "inativo"
      situacao_patrimonio:
        | "em_uso"
        | "em_estoque"
        | "cedido"
        | "em_manutencao"
        | "baixado"
      status_agenda:
        | "solicitado"
        | "aprovado"
        | "rejeitado"
        | "cancelado"
        | "concluido"
      status_conformidade:
        | "conforme"
        | "parcialmente_conforme"
        | "nao_conforme"
        | "nao_aplicavel"
        | "pendente"
      status_conteudo:
        | "rascunho"
        | "em_revisao"
        | "aprovado"
        | "publicado"
        | "arquivado"
      status_contrato:
        | "rascunho"
        | "vigente"
        | "suspenso"
        | "encerrado"
        | "rescindido"
        | "aditado"
      status_debito:
        | "pendente"
        | "em_andamento"
        | "resolvido"
        | "cancelado"
        | "adiado"
      status_demanda_ascom:
        | "rascunho"
        | "enviada"
        | "em_analise"
        | "aguardando_autorizacao"
        | "aprovada"
        | "em_execucao"
        | "concluida"
        | "indeferida"
        | "cancelada"
      status_documento:
        | "rascunho"
        | "aguardando_publicacao"
        | "publicado"
        | "vigente"
        | "revogado"
        | "minuta"
        | "aguardando_assinatura"
        | "assinado"
      status_evento_esocial:
        | "pendente"
        | "gerado"
        | "validado"
        | "enviado"
        | "aceito"
        | "rejeitado"
        | "erro"
      status_folha: "aberta" | "previa" | "processando" | "fechada" | "reaberta"
      status_medicao: "rascunho" | "enviada" | "aprovada" | "rejeitada" | "paga"
      status_movimentacao_processo:
        | "pendente"
        | "recebido"
        | "respondido"
        | "vencido"
        | "cancelado"
      status_nomeacao: "ativo" | "encerrado" | "revogado"
      status_participante:
        | "pendente"
        | "confirmado"
        | "recusado"
        | "ausente"
        | "presente"
      status_ponto:
        | "completo"
        | "incompleto"
        | "pendente_justificativa"
        | "justificado"
        | "aprovado"
      status_processo_administrativo:
        | "aberto"
        | "em_tramitacao"
        | "suspenso"
        | "concluido"
        | "arquivado"
      status_provimento: "ativo" | "suspenso" | "encerrado" | "vacante"
      status_recurso_lai:
        | "interposto"
        | "em_analise"
        | "deferido"
        | "deferido_parcial"
        | "indeferido"
        | "nao_conhecido"
        | "desistencia"
      status_reuniao:
        | "agendada"
        | "confirmada"
        | "em_andamento"
        | "realizada"
        | "cancelada"
        | "adiada"
      status_risco:
        | "identificado"
        | "em_analise"
        | "em_tratamento"
        | "monitorado"
        | "encerrado"
      status_solicitacao: "pendente" | "aprovada" | "rejeitada" | "cancelada"
      status_termo_cessao: "pendente" | "emitido" | "assinado" | "cancelado"
      status_unidade_local: "ativa" | "inativa" | "manutencao" | "interditada"
      tipo_aditivo:
        | "prazo"
        | "valor"
        | "prazo_valor"
        | "objeto"
        | "supressao"
        | "reequilibrio"
        | "apostilamento"
      tipo_afastamento:
        | "licenca"
        | "suspensao"
        | "cessao"
        | "disposicao"
        | "servico_externo"
        | "missao"
        | "outro"
      tipo_ato_nomeacao: "portaria" | "decreto" | "ato" | "outro"
      tipo_conteudo_institucional:
        | "missao"
        | "visao"
        | "valores"
        | "objetivos_estrategicos"
        | "descricao_programa"
        | "slogan"
        | "narrativa_institucional"
        | "identidade_visual"
      tipo_controle: "preventivo" | "detectivo" | "corretivo"
      tipo_decisao:
        | "despacho"
        | "deliberacao"
        | "resolucao"
        | "determinacao"
        | "recomendacao"
      tipo_demanda_ascom:
        | "cobertura_fotografica"
        | "cobertura_audiovisual"
        | "cobertura_jornalistica"
        | "cobertura_redes_sociais"
        | "cobertura_transmissao_ao_vivo"
        | "arte_redes_sociais"
        | "arte_banner"
        | "arte_cartaz"
        | "arte_folder"
        | "arte_convite"
        | "arte_certificado"
        | "arte_identidade_visual"
        | "conteudo_noticia_site"
        | "conteudo_texto_redes"
        | "conteudo_nota_oficial"
        | "conteudo_release"
        | "conteudo_discurso"
        | "redes_publicacao_programada"
        | "redes_campanha"
        | "redes_cobertura_tempo_real"
        | "imprensa_atendimento"
        | "imprensa_agendamento_entrevista"
        | "imprensa_resposta_oficial"
        | "imprensa_nota_esclarecimento"
        | "emergencial_crise"
        | "emergencial_nota_urgente"
        | "emergencial_posicionamento"
      tipo_despacho: "simples" | "decisorio" | "conclusivo"
      tipo_documento:
        | "portaria"
        | "resolucao"
        | "instrucao_normativa"
        | "ordem_servico"
        | "comunicado"
        | "decreto"
        | "lei"
        | "outro"
      tipo_documento_licitacao:
        | "etp"
        | "termo_referencia"
        | "projeto_basico"
        | "pesquisa_precos"
        | "parecer_juridico"
        | "autorizacao"
        | "dotacao_orcamentaria"
        | "mapa_riscos"
        | "minuta_edital"
        | "minuta_contrato"
        | "ata_aprovacao"
        | "outro"
      tipo_documento_processo:
        | "oficio"
        | "nota_tecnica"
        | "parecer"
        | "despacho"
        | "anexo"
        | "requerimento"
        | "declaracao"
        | "certidao"
        | "outro"
      tipo_evento_lai:
        | "abertura"
        | "classificacao"
        | "encaminhamento"
        | "resposta_parcial"
        | "prorrogacao"
        | "resposta_final"
        | "recurso_interposto"
        | "recurso_respondido"
        | "encerramento"
        | "reativacao"
        | "alteracao_responsavel"
      tipo_folha:
        | "mensal"
        | "complementar"
        | "13_1a_parcela"
        | "13_2a_parcela"
        | "rescisao"
        | "retroativos"
      tipo_justificativa:
        | "atestado"
        | "declaracao"
        | "trabalho_externo"
        | "esquecimento"
        | "problema_sistema"
        | "outro"
      tipo_lancamento_horas: "credito" | "debito" | "ajuste"
      tipo_licenca:
        | "maternidade"
        | "paternidade"
        | "medica"
        | "casamento"
        | "luto"
        | "interesse_particular"
        | "capacitacao"
        | "premio"
        | "mandato_eletivo"
        | "mandato_classista"
        | "outra"
      tipo_lotacao:
        | "lotacao_interna"
        | "designacao"
        | "cessao_interna"
        | "lotacao_externa"
      tipo_movimentacao_funcional:
        | "nomeacao"
        | "exoneracao"
        | "designacao"
        | "dispensa"
        | "promocao"
        | "transferencia"
        | "cessao"
        | "requisicao"
        | "redistribuicao"
        | "remocao"
        | "afastamento"
        | "retorno"
        | "aposentadoria"
        | "vacancia"
      tipo_movimentacao_processo:
        | "despacho"
        | "encaminhamento"
        | "juntada"
        | "decisao"
        | "informacao"
        | "ciencia"
        | "devolucao"
      tipo_papel_raci: "responsavel" | "aprovador" | "consultado" | "informado"
      tipo_parecer:
        | "juridico"
        | "tecnico"
        | "contabil"
        | "controle_interno"
        | "outro"
      tipo_portaria_rh:
        | "nomeacao"
        | "exoneracao"
        | "designacao"
        | "dispensa"
        | "ferias"
        | "viagem"
        | "cessao"
        | "afastamento"
        | "substituicao"
        | "gratificacao"
        | "comissao"
        | "outro"
      tipo_processo_administrativo:
        | "compra"
        | "licitacao"
        | "rh"
        | "patrimonio"
        | "lai"
        | "governanca"
        | "convenio"
        | "diaria"
        | "viagem"
        | "federacao"
        | "outro"
      tipo_registro_ponto:
        | "normal"
        | "feriado"
        | "folga"
        | "atestado"
        | "falta"
        | "ferias"
        | "licenca"
      tipo_reuniao:
        | "ordinaria"
        | "extraordinaria"
        | "audiencia"
        | "sessao_solene"
        | "reuniao_trabalho"
      tipo_rubrica: "provento" | "desconto" | "informativo" | "encargo"
      tipo_servidor:
        | "efetivo_idjuv"
        | "comissionado_idjuv"
        | "cedido_entrada"
        | "cedido_saida"
      tipo_unidade:
        | "presidencia"
        | "diretoria"
        | "departamento"
        | "setor"
        | "divisao"
        | "secao"
        | "coordenacao"
        | "assessoria"
        | "nucleo"
      tipo_unidade_local:
        | "ginasio"
        | "estadio"
        | "parque_aquatico"
        | "piscina"
        | "complexo"
        | "quadra"
        | "outro"
      tipo_usuario: "servidor" | "tecnico"
      tipo_vinculo_funcional:
        | "efetivo_idjuv"
        | "comissionado_idjuv"
        | "cedido_entrada"
        | "cedido_saida"
      veiculo_publicacao: "doe" | "pncp" | "dou" | "jornal" | "site" | "mural"
      vinculo_funcional:
        | "efetivo"
        | "comissionado"
        | "cedido"
        | "temporario"
        | "estagiario"
        | "requisitado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_scope: ["all", "org_unit", "local_unit", "own", "readonly"],
      app_permission: [
        "users.read",
        "users.create",
        "users.update",
        "users.delete",
        "content.read",
        "content.create",
        "content.update",
        "content.delete",
        "reports.view",
        "reports.export",
        "settings.view",
        "settings.edit",
        "processes.read",
        "processes.create",
        "processes.update",
        "processes.delete",
        "processes.approve",
        "roles.manage",
        "permissions.manage",
        "documents.view",
        "documents.create",
        "documents.edit",
        "documents.delete",
        "requests.create",
        "requests.view",
        "requests.approve",
        "requests.reject",
        "audit.view",
        "audit.export",
        "approval.delegate",
        "org_units.manage",
        "mfa.manage",
      ],
      app_role: [
        "admin",
        "manager",
        "user",
        "guest",
        "presidencia",
        "diraf",
        "rh",
        "ti_admin",
        "gabinete",
        "controle_interno",
        "juridico",
        "cpl",
        "ascom",
        "cadastrador_local",
        "cadastrador_setor",
        "cadastrador_leitura",
      ],
      approval_status: [
        "draft",
        "submitted",
        "in_review",
        "approved",
        "rejected",
        "cancelled",
      ],
      audit_action: [
        "login",
        "logout",
        "login_failed",
        "password_change",
        "password_reset",
        "create",
        "update",
        "delete",
        "view",
        "export",
        "upload",
        "download",
        "approve",
        "reject",
        "submit",
      ],
      backup_status: ["pending", "running", "success", "failed", "partial"],
      backup_type: ["daily", "weekly", "monthly", "manual"],
      categoria_cargo: [
        "efetivo",
        "comissionado",
        "funcao_gratificada",
        "temporario",
        "estagiario",
      ],
      categoria_demanda_ascom: [
        "cobertura_institucional",
        "criacao_artes",
        "conteudo_institucional",
        "gestao_redes_sociais",
        "imprensa_relacoes",
        "demandas_emergenciais",
      ],
      categoria_portaria: [
        "estruturante",
        "normativa",
        "pessoal",
        "delegacao",
        "nomeacao",
        "exoneracao",
        "designacao",
        "dispensa",
        "cessao",
        "ferias",
        "licenca",
      ],
      decisao_despacho: [
        "deferido",
        "indeferido",
        "parcialmente_deferido",
        "encaminhar",
        "arquivar",
        "suspender",
        "informar",
      ],
      estado_conservacao: ["otimo", "bom", "regular", "ruim", "inservivel"],
      fase_licitacao: [
        "planejamento",
        "elaboracao",
        "edital",
        "publicacao",
        "propostas",
        "habilitacao",
        "julgamento",
        "homologacao",
        "adjudicacao",
        "contratacao",
        "encerrado",
        "revogado",
        "anulado",
        "deserto",
        "fracassado",
      ],
      formula_tipo: [
        "valor_fixo",
        "percentual_base",
        "quantidade_valor",
        "calculo_especial",
        "referencia_cargo",
      ],
      instancia_recurso: ["primeira", "segunda"],
      modalidade_licitacao: [
        "pregao_eletronico",
        "pregao_presencial",
        "concorrencia",
        "concurso",
        "leilao",
        "dialogo_competitivo",
        "dispensa",
        "inexigibilidade",
      ],
      natureza_cargo: ["efetivo", "comissionado"],
      natureza_rubrica: ["remuneratorio", "indenizatorio", "informativo"],
      nivel_perfil: ["sistema", "organizacional", "operacional"],
      nivel_risco: ["muito_baixo", "baixo", "medio", "alto", "muito_alto"],
      nivel_sigilo_processo: ["publico", "restrito", "sigiloso"],
      origem_lancamento: ["automatico", "manual", "importado", "retroativo"],
      periodicidade_controle: [
        "diario",
        "semanal",
        "quinzenal",
        "mensal",
        "bimestral",
        "trimestral",
        "semestral",
        "anual",
        "eventual",
      ],
      prioridade_debito: ["critica", "alta", "media", "baixa"],
      prioridade_demanda_ascom: ["baixa", "normal", "alta", "urgente"],
      referencia_prazo_processo: [
        "legal",
        "interno",
        "judicial",
        "contratual",
        "regulamentar",
      ],
      situacao_funcional: [
        "ativo",
        "afastado",
        "cedido",
        "licenca",
        "ferias",
        "exonerado",
        "aposentado",
        "falecido",
        "inativo",
      ],
      situacao_patrimonio: [
        "em_uso",
        "em_estoque",
        "cedido",
        "em_manutencao",
        "baixado",
      ],
      status_agenda: [
        "solicitado",
        "aprovado",
        "rejeitado",
        "cancelado",
        "concluido",
      ],
      status_conformidade: [
        "conforme",
        "parcialmente_conforme",
        "nao_conforme",
        "nao_aplicavel",
        "pendente",
      ],
      status_conteudo: [
        "rascunho",
        "em_revisao",
        "aprovado",
        "publicado",
        "arquivado",
      ],
      status_contrato: [
        "rascunho",
        "vigente",
        "suspenso",
        "encerrado",
        "rescindido",
        "aditado",
      ],
      status_debito: [
        "pendente",
        "em_andamento",
        "resolvido",
        "cancelado",
        "adiado",
      ],
      status_demanda_ascom: [
        "rascunho",
        "enviada",
        "em_analise",
        "aguardando_autorizacao",
        "aprovada",
        "em_execucao",
        "concluida",
        "indeferida",
        "cancelada",
      ],
      status_documento: [
        "rascunho",
        "aguardando_publicacao",
        "publicado",
        "vigente",
        "revogado",
        "minuta",
        "aguardando_assinatura",
        "assinado",
      ],
      status_evento_esocial: [
        "pendente",
        "gerado",
        "validado",
        "enviado",
        "aceito",
        "rejeitado",
        "erro",
      ],
      status_folha: ["aberta", "previa", "processando", "fechada", "reaberta"],
      status_medicao: ["rascunho", "enviada", "aprovada", "rejeitada", "paga"],
      status_movimentacao_processo: [
        "pendente",
        "recebido",
        "respondido",
        "vencido",
        "cancelado",
      ],
      status_nomeacao: ["ativo", "encerrado", "revogado"],
      status_participante: [
        "pendente",
        "confirmado",
        "recusado",
        "ausente",
        "presente",
      ],
      status_ponto: [
        "completo",
        "incompleto",
        "pendente_justificativa",
        "justificado",
        "aprovado",
      ],
      status_processo_administrativo: [
        "aberto",
        "em_tramitacao",
        "suspenso",
        "concluido",
        "arquivado",
      ],
      status_provimento: ["ativo", "suspenso", "encerrado", "vacante"],
      status_recurso_lai: [
        "interposto",
        "em_analise",
        "deferido",
        "deferido_parcial",
        "indeferido",
        "nao_conhecido",
        "desistencia",
      ],
      status_reuniao: [
        "agendada",
        "confirmada",
        "em_andamento",
        "realizada",
        "cancelada",
        "adiada",
      ],
      status_risco: [
        "identificado",
        "em_analise",
        "em_tratamento",
        "monitorado",
        "encerrado",
      ],
      status_solicitacao: ["pendente", "aprovada", "rejeitada", "cancelada"],
      status_termo_cessao: ["pendente", "emitido", "assinado", "cancelado"],
      status_unidade_local: ["ativa", "inativa", "manutencao", "interditada"],
      tipo_aditivo: [
        "prazo",
        "valor",
        "prazo_valor",
        "objeto",
        "supressao",
        "reequilibrio",
        "apostilamento",
      ],
      tipo_afastamento: [
        "licenca",
        "suspensao",
        "cessao",
        "disposicao",
        "servico_externo",
        "missao",
        "outro",
      ],
      tipo_ato_nomeacao: ["portaria", "decreto", "ato", "outro"],
      tipo_conteudo_institucional: [
        "missao",
        "visao",
        "valores",
        "objetivos_estrategicos",
        "descricao_programa",
        "slogan",
        "narrativa_institucional",
        "identidade_visual",
      ],
      tipo_controle: ["preventivo", "detectivo", "corretivo"],
      tipo_decisao: [
        "despacho",
        "deliberacao",
        "resolucao",
        "determinacao",
        "recomendacao",
      ],
      tipo_demanda_ascom: [
        "cobertura_fotografica",
        "cobertura_audiovisual",
        "cobertura_jornalistica",
        "cobertura_redes_sociais",
        "cobertura_transmissao_ao_vivo",
        "arte_redes_sociais",
        "arte_banner",
        "arte_cartaz",
        "arte_folder",
        "arte_convite",
        "arte_certificado",
        "arte_identidade_visual",
        "conteudo_noticia_site",
        "conteudo_texto_redes",
        "conteudo_nota_oficial",
        "conteudo_release",
        "conteudo_discurso",
        "redes_publicacao_programada",
        "redes_campanha",
        "redes_cobertura_tempo_real",
        "imprensa_atendimento",
        "imprensa_agendamento_entrevista",
        "imprensa_resposta_oficial",
        "imprensa_nota_esclarecimento",
        "emergencial_crise",
        "emergencial_nota_urgente",
        "emergencial_posicionamento",
      ],
      tipo_despacho: ["simples", "decisorio", "conclusivo"],
      tipo_documento: [
        "portaria",
        "resolucao",
        "instrucao_normativa",
        "ordem_servico",
        "comunicado",
        "decreto",
        "lei",
        "outro",
      ],
      tipo_documento_licitacao: [
        "etp",
        "termo_referencia",
        "projeto_basico",
        "pesquisa_precos",
        "parecer_juridico",
        "autorizacao",
        "dotacao_orcamentaria",
        "mapa_riscos",
        "minuta_edital",
        "minuta_contrato",
        "ata_aprovacao",
        "outro",
      ],
      tipo_documento_processo: [
        "oficio",
        "nota_tecnica",
        "parecer",
        "despacho",
        "anexo",
        "requerimento",
        "declaracao",
        "certidao",
        "outro",
      ],
      tipo_evento_lai: [
        "abertura",
        "classificacao",
        "encaminhamento",
        "resposta_parcial",
        "prorrogacao",
        "resposta_final",
        "recurso_interposto",
        "recurso_respondido",
        "encerramento",
        "reativacao",
        "alteracao_responsavel",
      ],
      tipo_folha: [
        "mensal",
        "complementar",
        "13_1a_parcela",
        "13_2a_parcela",
        "rescisao",
        "retroativos",
      ],
      tipo_justificativa: [
        "atestado",
        "declaracao",
        "trabalho_externo",
        "esquecimento",
        "problema_sistema",
        "outro",
      ],
      tipo_lancamento_horas: ["credito", "debito", "ajuste"],
      tipo_licenca: [
        "maternidade",
        "paternidade",
        "medica",
        "casamento",
        "luto",
        "interesse_particular",
        "capacitacao",
        "premio",
        "mandato_eletivo",
        "mandato_classista",
        "outra",
      ],
      tipo_lotacao: [
        "lotacao_interna",
        "designacao",
        "cessao_interna",
        "lotacao_externa",
      ],
      tipo_movimentacao_funcional: [
        "nomeacao",
        "exoneracao",
        "designacao",
        "dispensa",
        "promocao",
        "transferencia",
        "cessao",
        "requisicao",
        "redistribuicao",
        "remocao",
        "afastamento",
        "retorno",
        "aposentadoria",
        "vacancia",
      ],
      tipo_movimentacao_processo: [
        "despacho",
        "encaminhamento",
        "juntada",
        "decisao",
        "informacao",
        "ciencia",
        "devolucao",
      ],
      tipo_papel_raci: ["responsavel", "aprovador", "consultado", "informado"],
      tipo_parecer: [
        "juridico",
        "tecnico",
        "contabil",
        "controle_interno",
        "outro",
      ],
      tipo_portaria_rh: [
        "nomeacao",
        "exoneracao",
        "designacao",
        "dispensa",
        "ferias",
        "viagem",
        "cessao",
        "afastamento",
        "substituicao",
        "gratificacao",
        "comissao",
        "outro",
      ],
      tipo_processo_administrativo: [
        "compra",
        "licitacao",
        "rh",
        "patrimonio",
        "lai",
        "governanca",
        "convenio",
        "diaria",
        "viagem",
        "federacao",
        "outro",
      ],
      tipo_registro_ponto: [
        "normal",
        "feriado",
        "folga",
        "atestado",
        "falta",
        "ferias",
        "licenca",
      ],
      tipo_reuniao: [
        "ordinaria",
        "extraordinaria",
        "audiencia",
        "sessao_solene",
        "reuniao_trabalho",
      ],
      tipo_rubrica: ["provento", "desconto", "informativo", "encargo"],
      tipo_servidor: [
        "efetivo_idjuv",
        "comissionado_idjuv",
        "cedido_entrada",
        "cedido_saida",
      ],
      tipo_unidade: [
        "presidencia",
        "diretoria",
        "departamento",
        "setor",
        "divisao",
        "secao",
        "coordenacao",
        "assessoria",
        "nucleo",
      ],
      tipo_unidade_local: [
        "ginasio",
        "estadio",
        "parque_aquatico",
        "piscina",
        "complexo",
        "quadra",
        "outro",
      ],
      tipo_usuario: ["servidor", "tecnico"],
      tipo_vinculo_funcional: [
        "efetivo_idjuv",
        "comissionado_idjuv",
        "cedido_entrada",
        "cedido_saida",
      ],
      veiculo_publicacao: ["doe", "pncp", "dou", "jornal", "site", "mural"],
      vinculo_funcional: [
        "efetivo",
        "comissionado",
        "cedido",
        "temporario",
        "estagiario",
        "requisitado",
      ],
    },
  },
} as const
