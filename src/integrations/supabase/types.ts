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
      documentos: {
        Row: {
          arquivo_url: string | null
          categoria: Database["public"]["Enums"]["categoria_portaria"] | null
          created_at: string
          created_by: string | null
          data_documento: string
          data_publicacao: string | null
          data_vigencia_fim: string | null
          data_vigencia_inicio: string | null
          ementa: string | null
          id: string
          numero: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_documento"]
          tipo: Database["public"]["Enums"]["tipo_documento"]
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_url?: string | null
          categoria?: Database["public"]["Enums"]["categoria_portaria"] | null
          created_at?: string
          created_by?: string | null
          data_documento?: string
          data_publicacao?: string | null
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          ementa?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_documento"]
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string | null
          categoria?: Database["public"]["Enums"]["categoria_portaria"] | null
          created_at?: string
          created_by?: string | null
          data_documento?: string
          data_publicacao?: string | null
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          ementa?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_documento"]
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
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
          ato_numero: string | null
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
          ato_numero?: string | null
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
          ato_numero?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_usuarios_sistema"
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
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
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
          ato_nomeacao_data: string | null
          ato_nomeacao_doe_data: string | null
          ato_nomeacao_doe_numero: string | null
          ato_nomeacao_numero: string | null
          ato_nomeacao_tipo: string | null
          ato_nomeacao_url: string | null
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
          ato_nomeacao_data?: string | null
          ato_nomeacao_doe_data?: string | null
          ato_nomeacao_doe_numero?: string | null
          ato_nomeacao_numero?: string | null
          ato_nomeacao_tipo?: string | null
          ato_nomeacao_url?: string | null
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
          ato_nomeacao_data?: string | null
          ato_nomeacao_doe_data?: string | null
          ato_nomeacao_doe_numero?: string | null
          ato_nomeacao_numero?: string | null
          ato_nomeacao_tipo?: string | null
          ato_nomeacao_url?: string | null
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
          tipo_vinculo:
            | Database["public"]["Enums"]["tipo_vinculo_funcional"]
            | null
          unidade_id: string | null
          unidade_nome: string | null
          unidade_sigla: string | null
          vinculo_id: string | null
          vinculo_inicio: string | null
          vinculo_orgao_destino: string | null
          vinculo_orgao_origem: string | null
        }
        Relationships: []
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
          servidor_vinculo:
            | Database["public"]["Enums"]["vinculo_funcional"]
            | null
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
      can_approve: {
        Args: { _module_name?: string; _user_id: string }
        Returns: boolean
      }
      can_view_audit: { Args: { _user_id: string }; Returns: boolean }
      criar_usuario_para_servidor: {
        Args: {
          p_email: string
          p_role?: Database["public"]["Enums"]["app_role"]
          p_servidor_id: string
        }
        Returns: string
      }
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
      get_permissions_from_servidor: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_permission"][]
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
      categoria_portaria: "estruturante" | "normativa" | "pessoal" | "delegacao"
      estado_conservacao: "otimo" | "bom" | "regular" | "ruim" | "inservivel"
      natureza_cargo: "efetivo" | "comissionado"
      situacao_funcional:
        | "ativo"
        | "afastado"
        | "cedido"
        | "licenca"
        | "ferias"
        | "exonerado"
        | "aposentado"
        | "falecido"
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
      categoria_portaria: ["estruturante", "normativa", "pessoal", "delegacao"],
      estado_conservacao: ["otimo", "bom", "regular", "ruim", "inservivel"],
      natureza_cargo: ["efetivo", "comissionado"],
      situacao_funcional: [
        "ativo",
        "afastado",
        "cedido",
        "licenca",
        "ferias",
        "exonerado",
        "aposentado",
        "falecido",
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
      ],
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
