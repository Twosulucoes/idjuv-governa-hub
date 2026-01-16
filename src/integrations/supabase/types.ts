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
            foreignKeyName: "designacoes_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["lotacao_id"]
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
        ]
      }
      estrutura_organizacional: {
        Row: {
          ativo: boolean | null
          atribuicoes: string | null
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
            foreignKeyName: "fichas_financeiras_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["lotacao_id"]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_mensal_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
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
            foreignKeyName: "memorandos_lotacao_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["lotacao_id"]
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
          cnh_numero: string | null
          cnh_validade: string | null
          codigo_acesso: string
          conselho_numero: string | null
          convertido_em: string | null
          convertido_por: string | null
          cpf: string
          created_at: string | null
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
          nome_social: string | null
          observacoes: string | null
          pis_pasep: string | null
          registro_conselho: string | null
          rg: string | null
          rg_data_emissao: string | null
          rg_orgao_expedidor: string | null
          rg_uf: string | null
          servidor_id: string | null
          sexo: string | null
          status: string | null
          telefone_celular: string | null
          telefone_fixo: string | null
          titulo_eleitor: string | null
          titulo_secao: string | null
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
          cnh_numero?: string | null
          cnh_validade?: string | null
          codigo_acesso: string
          conselho_numero?: string | null
          convertido_em?: string | null
          convertido_por?: string | null
          cpf: string
          created_at?: string | null
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
          nome_social?: string | null
          observacoes?: string | null
          pis_pasep?: string | null
          registro_conselho?: string | null
          rg?: string | null
          rg_data_emissao?: string | null
          rg_orgao_expedidor?: string | null
          rg_uf?: string | null
          servidor_id?: string | null
          sexo?: string | null
          status?: string | null
          telefone_celular?: string | null
          telefone_fixo?: string | null
          titulo_eleitor?: string | null
          titulo_secao?: string | null
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
          cnh_numero?: string | null
          cnh_validade?: string | null
          codigo_acesso?: string
          conselho_numero?: string | null
          convertido_em?: string | null
          convertido_por?: string | null
          cpf?: string
          created_at?: string | null
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
          nome_social?: string | null
          observacoes?: string | null
          pis_pasep?: string | null
          registro_conselho?: string | null
          rg?: string | null
          rg_data_emissao?: string | null
          rg_orgao_expedidor?: string | null
          rg_uf?: string | null
          servidor_id?: string | null
          sexo?: string | null
          status?: string | null
          telefone_celular?: string | null
          telefone_fixo?: string | null
          titulo_eleitor?: string | null
          titulo_secao?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ponto_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
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
          cnh_numero: string | null
          cnh_validade: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_parentesco: string | null
          cpf: string
          created_at: string | null
          created_by: string | null
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
          nome_social: string | null
          observacoes: string | null
          orgao_destino_cessao: string | null
          orgao_origem: string | null
          pis_pasep: string | null
          regime_juridico: string | null
          remuneracao_bruta: number | null
          rg: string | null
          rg_data_emissao: string | null
          rg_orgao_expedidor: string | null
          rg_uf: string | null
          sexo: string | null
          situacao: Database["public"]["Enums"]["situacao_funcional"]
          telefone_celular: string | null
          telefone_emergencia: string | null
          telefone_fixo: string | null
          tipo_servidor: Database["public"]["Enums"]["tipo_servidor"] | null
          titulo_eleitor: string | null
          titulo_secao: string | null
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
          cnh_numero?: string | null
          cnh_validade?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_parentesco?: string | null
          cpf: string
          created_at?: string | null
          created_by?: string | null
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
          nome_social?: string | null
          observacoes?: string | null
          orgao_destino_cessao?: string | null
          orgao_origem?: string | null
          pis_pasep?: string | null
          regime_juridico?: string | null
          remuneracao_bruta?: number | null
          rg?: string | null
          rg_data_emissao?: string | null
          rg_orgao_expedidor?: string | null
          rg_uf?: string | null
          sexo?: string | null
          situacao?: Database["public"]["Enums"]["situacao_funcional"]
          telefone_celular?: string | null
          telefone_emergencia?: string | null
          telefone_fixo?: string | null
          tipo_servidor?: Database["public"]["Enums"]["tipo_servidor"] | null
          titulo_eleitor?: string | null
          titulo_secao?: string | null
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
          cnh_numero?: string | null
          cnh_validade?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_parentesco?: string | null
          cpf?: string
          created_at?: string | null
          created_by?: string | null
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
          nome_social?: string | null
          observacoes?: string | null
          orgao_destino_cessao?: string | null
          orgao_origem?: string | null
          pis_pasep?: string | null
          regime_juridico?: string | null
          remuneracao_bruta?: number | null
          rg?: string | null
          rg_data_emissao?: string | null
          rg_orgao_expedidor?: string | null
          rg_uf?: string | null
          sexo?: string | null
          situacao?: Database["public"]["Enums"]["situacao_funcional"]
          telefone_celular?: string | null
          telefone_emergencia?: string | null
          telefone_fixo?: string | null
          tipo_servidor?: Database["public"]["Enums"]["tipo_servidor"] | null
          titulo_eleitor?: string | null
          titulo_secao?: string | null
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
          ano_referencia: number | null
          municipio: string | null
          nome_unidade: string | null
          status_unidade:
            | Database["public"]["Enums"]["status_unidade_local"]
            | null
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade_local"] | null
          total_aprovadas: number | null
          total_canceladas: number | null
          total_concluidas: number | null
          total_rejeitadas: number | null
          total_solicitacoes: number | null
          total_termos: number | null
          unidade_id: string | null
        }
        Relationships: []
      }
      v_servidores_situacao: {
        Row: {
          cargo_id: string | null
          cargo_natureza: Database["public"]["Enums"]["natureza_cargo"] | null
          cargo_nome: string | null
          cargo_sigla: string | null
          cessao_id: string | null
          cessao_inicio: string | null
          cessao_onus: string | null
          cessao_orgao_destino: string | null
          cessao_orgao_origem: string | null
          cessao_tipo: string | null
          cpf: string | null
          data_nomeacao: string | null
          data_posse: string | null
          email_institucional: string | null
          foto_url: string | null
          id: string | null
          lotacao_funcao: string | null
          lotacao_id: string | null
          lotacao_inicio: string | null
          matricula: string | null
          nome_completo: string | null
          provimento_id: string | null
          provimento_status:
            | Database["public"]["Enums"]["status_provimento"]
            | null
          situacao: Database["public"]["Enums"]["situacao_funcional"] | null
          telefone_celular: string | null
          tipo_lotacao: Database["public"]["Enums"]["tipo_lotacao"] | null
          tipo_servidor: Database["public"]["Enums"]["tipo_servidor"] | null
          unidade_id: string | null
          unidade_nome: string | null
          unidade_sigla: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotacoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provimentos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      v_usuarios_sistema: {
        Row: {
          avatar_url: string | null
          blocked_at: string | null
          blocked_reason: string | null
          cargo_nome: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          servidor_id: string | null
          servidor_matricula: string | null
          servidor_nome: string | null
          servidor_situacao:
            | Database["public"]["Enums"]["situacao_funcional"]
            | null
          servidor_tipo: Database["public"]["Enums"]["tipo_servidor"] | null
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"] | null
          unidade_nome: string | null
          user_role: Database["public"]["Enums"]["app_role"] | null
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
      can_approve: {
        Args: { _module_name?: string; _user_id: string }
        Returns: boolean
      }
      can_view_audit: { Args: { _user_id: string }; Returns: boolean }
      can_view_indicacao: { Args: { _user_id: string }; Returns: boolean }
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
      gerar_codigo_pre_cadastro: { Args: never; Returns: string }
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
      processar_folha_pagamento: { Args: { p_folha_id: string }; Returns: Json }
      user_has_unit_access: {
        Args: { _unidade_id: string; _user_id: string }
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
      estado_conservacao: "otimo" | "bom" | "regular" | "ruim" | "inservivel"
      formula_tipo:
        | "valor_fixo"
        | "percentual_base"
        | "quantidade_valor"
        | "calculo_especial"
        | "referencia_cargo"
      natureza_cargo: "efetivo" | "comissionado"
      natureza_rubrica: "remuneratorio" | "indenizatorio" | "informativo"
      origem_lancamento: "automatico" | "manual" | "importado" | "retroativo"
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
      status_nomeacao: "ativo" | "encerrado" | "revogado"
      status_ponto:
        | "completo"
        | "incompleto"
        | "pendente_justificativa"
        | "justificado"
        | "aprovado"
      status_provimento: "ativo" | "suspenso" | "encerrado" | "vacante"
      status_solicitacao: "pendente" | "aprovada" | "rejeitada" | "cancelada"
      status_termo_cessao: "pendente" | "emitido" | "assinado" | "cancelado"
      status_unidade_local: "ativa" | "inativa" | "manutencao" | "interditada"
      tipo_afastamento:
        | "licenca"
        | "suspensao"
        | "cessao"
        | "disposicao"
        | "servico_externo"
        | "missao"
        | "outro"
      tipo_ato_nomeacao: "portaria" | "decreto" | "ato" | "outro"
      tipo_documento:
        | "portaria"
        | "resolucao"
        | "instrucao_normativa"
        | "ordem_servico"
        | "comunicado"
        | "decreto"
        | "lei"
        | "outro"
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
      tipo_registro_ponto:
        | "normal"
        | "feriado"
        | "folga"
        | "atestado"
        | "falta"
        | "ferias"
        | "licenca"
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
      estado_conservacao: ["otimo", "bom", "regular", "ruim", "inservivel"],
      formula_tipo: [
        "valor_fixo",
        "percentual_base",
        "quantidade_valor",
        "calculo_especial",
        "referencia_cargo",
      ],
      natureza_cargo: ["efetivo", "comissionado"],
      natureza_rubrica: ["remuneratorio", "indenizatorio", "informativo"],
      origem_lancamento: ["automatico", "manual", "importado", "retroativo"],
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
      status_nomeacao: ["ativo", "encerrado", "revogado"],
      status_ponto: [
        "completo",
        "incompleto",
        "pendente_justificativa",
        "justificado",
        "aprovado",
      ],
      status_provimento: ["ativo", "suspenso", "encerrado", "vacante"],
      status_solicitacao: ["pendente", "aprovada", "rejeitada", "cancelada"],
      status_termo_cessao: ["pendente", "emitido", "assinado", "cancelado"],
      status_unidade_local: ["ativa", "inativa", "manutencao", "interditada"],
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
      tipo_registro_ponto: [
        "normal",
        "feriado",
        "folga",
        "atestado",
        "falta",
        "ferias",
        "licenca",
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
