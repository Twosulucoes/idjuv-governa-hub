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
      _backup_usuario_modulos_old: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          modulo_id: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          modulo_id: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          modulo_id?: string
          user_id?: string
        }
        Relationships: []
      }
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
      adicionais_tempo_servico: {
        Row: {
          ativo: boolean
          ato_data: string | null
          ato_numero: string | null
          created_at: string | null
          created_by: string | null
          data_base: string
          data_concessao: string
          data_proximo: string | null
          fundamentacao_legal: string | null
          id: string
          observacoes: string | null
          percentual: number
          quantidade: number
          servidor_id: string
          tipo: string
          updated_at: string | null
          valor_adicional: number | null
          valor_referencia: number | null
        }
        Insert: {
          ativo?: boolean
          ato_data?: string | null
          ato_numero?: string | null
          created_at?: string | null
          created_by?: string | null
          data_base: string
          data_concessao: string
          data_proximo?: string | null
          fundamentacao_legal?: string | null
          id?: string
          observacoes?: string | null
          percentual: number
          quantidade?: number
          servidor_id: string
          tipo: string
          updated_at?: string | null
          valor_adicional?: number | null
          valor_referencia?: number | null
        }
        Update: {
          ativo?: boolean
          ato_data?: string | null
          ato_numero?: string | null
          created_at?: string | null
          created_by?: string | null
          data_base?: string
          data_concessao?: string
          data_proximo?: string | null
          fundamentacao_legal?: string | null
          id?: string
          observacoes?: string | null
          percentual?: number
          quantidade?: number
          servidor_id?: string
          tipo?: string
          updated_at?: string | null
          valor_adicional?: number | null
          valor_referencia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "adicionais_tempo_servico_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionais_tempo_servico_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "adicionais_tempo_servico_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionais_tempo_servico_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
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
          federacao_id: string | null
          finalidade_detalhada: string | null
          historico_status: Json | null
          horario_diario: string | null
          id: string
          instituicao_id: string | null
          modalidades_esportivas: string[] | null
          motivo_rejeicao: string | null
          numero_processo_sei: string | null
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
          federacao_id?: string | null
          finalidade_detalhada?: string | null
          historico_status?: Json | null
          horario_diario?: string | null
          id?: string
          instituicao_id?: string | null
          modalidades_esportivas?: string[] | null
          motivo_rejeicao?: string | null
          numero_processo_sei?: string | null
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
          federacao_id?: string | null
          finalidade_detalhada?: string | null
          historico_status?: Json | null
          horario_diario?: string | null
          id?: string
          instituicao_id?: string | null
          modalidades_esportivas?: string[] | null
          motivo_rejeicao?: string | null
          numero_processo_sei?: string | null
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "agenda_unidade_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            foreignKeyName: "agenda_unidade_federacao_id_fkey"
            columns: ["federacao_id"]
            isOneToOne: false
            referencedRelation: "federacoes_esportivas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_unidade_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_unidade_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "v_instituicoes_resumo"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "agenda_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "agenda_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "agenda_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "almoxarifados_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "avaliacoes_controle_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "avaliacoes_risco_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      baixas_patrimonio: {
        Row: {
          aprovado_por: string | null
          autorizacao_url: string | null
          bem_id: string
          comissao_responsavel: string | null
          created_at: string | null
          created_by: string | null
          dados_bem_snapshot: Json | null
          data_aprovacao: string | null
          data_solicitacao: string
          id: string
          justificativa: string
          laudo_tecnico_url: string | null
          motivo: Database["public"]["Enums"]["motivo_baixa_patrimonio"]
          motivo_rejeicao: string | null
          status: string | null
          termo_baixa_url: string | null
          updated_at: string | null
          valor_residual: number | null
        }
        Insert: {
          aprovado_por?: string | null
          autorizacao_url?: string | null
          bem_id: string
          comissao_responsavel?: string | null
          created_at?: string | null
          created_by?: string | null
          dados_bem_snapshot?: Json | null
          data_aprovacao?: string | null
          data_solicitacao?: string
          id?: string
          justificativa: string
          laudo_tecnico_url?: string | null
          motivo: Database["public"]["Enums"]["motivo_baixa_patrimonio"]
          motivo_rejeicao?: string | null
          status?: string | null
          termo_baixa_url?: string | null
          updated_at?: string | null
          valor_residual?: number | null
        }
        Update: {
          aprovado_por?: string | null
          autorizacao_url?: string | null
          bem_id?: string
          comissao_responsavel?: string | null
          created_at?: string | null
          created_by?: string | null
          dados_bem_snapshot?: Json | null
          data_aprovacao?: string | null
          data_solicitacao?: string
          id?: string
          justificativa?: string
          laudo_tecnico_url?: string | null
          motivo?: Database["public"]["Enums"]["motivo_baixa_patrimonio"]
          motivo_rejeicao?: string | null
          status?: string | null
          termo_baixa_url?: string | null
          updated_at?: string | null
          valor_residual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baixas_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baixas_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
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
          andar: string | null
          cargo_responsavel: string | null
          categoria_bem: Database["public"]["Enums"]["categoria_bem"] | null
          centro_custo_id: string | null
          codigo_qr: string | null
          created_at: string | null
          created_by: string | null
          data_aquisicao: string
          data_atribuicao_responsabilidade: string | null
          data_nota_fiscal: string | null
          data_ultima_avaliacao: string | null
          depreciacao_acumulada: number | null
          descricao: string
          empenho_id: string | null
          especificacao: string | null
          estado_conservacao: string | null
          estado_conservacao_inventario:
            | Database["public"]["Enums"]["estado_conservacao_inventario"]
            | null
          fonte_recurso_id: string | null
          forma_aquisicao: Database["public"]["Enums"]["forma_aquisicao"] | null
          fornecedor_cnpj_cpf: string | null
          fornecedor_id: string | null
          foto_bem_url: string | null
          foto_etiqueta_qr_url: string | null
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
          patrimonio_anterior: string | null
          pendencias: Json | null
          ponto_especifico: string | null
          predio: string | null
          processo_sei: string | null
          responsavel_id: string | null
          sala: string | null
          setor_responsavel_id: string | null
          situacao: string | null
          situacao_inventario:
            | Database["public"]["Enums"]["situacao_bem_patrimonio"]
            | null
          subcategoria: string | null
          termo_responsabilidade_url: string | null
          unidade_id: string | null
          unidade_local_id: string | null
          updated_at: string | null
          valor_aquisicao: number
          valor_liquido: number | null
          valor_residual: number | null
          vida_util_anos: number | null
        }
        Insert: {
          andar?: string | null
          cargo_responsavel?: string | null
          categoria_bem?: Database["public"]["Enums"]["categoria_bem"] | null
          centro_custo_id?: string | null
          codigo_qr?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aquisicao: string
          data_atribuicao_responsabilidade?: string | null
          data_nota_fiscal?: string | null
          data_ultima_avaliacao?: string | null
          depreciacao_acumulada?: number | null
          descricao: string
          empenho_id?: string | null
          especificacao?: string | null
          estado_conservacao?: string | null
          estado_conservacao_inventario?:
            | Database["public"]["Enums"]["estado_conservacao_inventario"]
            | null
          fonte_recurso_id?: string | null
          forma_aquisicao?:
            | Database["public"]["Enums"]["forma_aquisicao"]
            | null
          fornecedor_cnpj_cpf?: string | null
          fornecedor_id?: string | null
          foto_bem_url?: string | null
          foto_etiqueta_qr_url?: string | null
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
          patrimonio_anterior?: string | null
          pendencias?: Json | null
          ponto_especifico?: string | null
          predio?: string | null
          processo_sei?: string | null
          responsavel_id?: string | null
          sala?: string | null
          setor_responsavel_id?: string | null
          situacao?: string | null
          situacao_inventario?:
            | Database["public"]["Enums"]["situacao_bem_patrimonio"]
            | null
          subcategoria?: string | null
          termo_responsabilidade_url?: string | null
          unidade_id?: string | null
          unidade_local_id?: string | null
          updated_at?: string | null
          valor_aquisicao: number
          valor_liquido?: number | null
          valor_residual?: number | null
          vida_util_anos?: number | null
        }
        Update: {
          andar?: string | null
          cargo_responsavel?: string | null
          categoria_bem?: Database["public"]["Enums"]["categoria_bem"] | null
          centro_custo_id?: string | null
          codigo_qr?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aquisicao?: string
          data_atribuicao_responsabilidade?: string | null
          data_nota_fiscal?: string | null
          data_ultima_avaliacao?: string | null
          depreciacao_acumulada?: number | null
          descricao?: string
          empenho_id?: string | null
          especificacao?: string | null
          estado_conservacao?: string | null
          estado_conservacao_inventario?:
            | Database["public"]["Enums"]["estado_conservacao_inventario"]
            | null
          fonte_recurso_id?: string | null
          forma_aquisicao?:
            | Database["public"]["Enums"]["forma_aquisicao"]
            | null
          fornecedor_cnpj_cpf?: string | null
          fornecedor_id?: string | null
          foto_bem_url?: string | null
          foto_etiqueta_qr_url?: string | null
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
          patrimonio_anterior?: string | null
          pendencias?: Json | null
          ponto_especifico?: string | null
          predio?: string | null
          processo_sei?: string | null
          responsavel_id?: string | null
          sala?: string | null
          setor_responsavel_id?: string | null
          situacao?: string | null
          situacao_inventario?:
            | Database["public"]["Enums"]["situacao_bem_patrimonio"]
            | null
          subcategoria?: string | null
          termo_responsabilidade_url?: string | null
          unidade_id?: string | null
          unidade_local_id?: string | null
          updated_at?: string | null
          valor_aquisicao?: number
          valor_liquido?: number | null
          valor_residual?: number | null
          vida_util_anos?: number | null
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "bens_patrimoniais_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
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
      campanhas_inventario: {
        Row: {
          ano: number
          created_at: string | null
          created_by: string | null
          data_fim: string
          data_inicio: string
          equipe_coleta: string[] | null
          id: string
          nome: string
          observacoes: string | null
          percentual_conclusao: number | null
          responsavel_geral_id: string | null
          status: string | null
          tipo: Database["public"]["Enums"]["tipo_campanha_inventario"]
          total_bens_esperados: number | null
          total_conferidos: number | null
          total_divergencias: number | null
          unidades_abrangidas: string[] | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          created_by?: string | null
          data_fim: string
          data_inicio: string
          equipe_coleta?: string[] | null
          id?: string
          nome: string
          observacoes?: string | null
          percentual_conclusao?: number | null
          responsavel_geral_id?: string | null
          status?: string | null
          tipo?: Database["public"]["Enums"]["tipo_campanha_inventario"]
          total_bens_esperados?: number | null
          total_conferidos?: number | null
          total_divergencias?: number | null
          unidades_abrangidas?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          equipe_coleta?: string[] | null
          id?: string
          nome?: string
          observacoes?: string | null
          percentual_conclusao?: number | null
          responsavel_geral_id?: string | null
          status?: string | null
          tipo?: Database["public"]["Enums"]["tipo_campanha_inventario"]
          total_bens_esperados?: number | null
          total_conferidos?: number | null
          total_divergencias?: number | null
          unidades_abrangidas?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_inventario_responsavel_geral_id_fkey"
            columns: ["responsavel_geral_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_inventario_responsavel_geral_id_fkey"
            columns: ["responsavel_geral_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "campanhas_inventario_responsavel_geral_id_fkey"
            columns: ["responsavel_geral_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_inventario_responsavel_geral_id_fkey"
            columns: ["responsavel_geral_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
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
      categorias_noticias_eventos: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          slug: string
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          slug?: string
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "cessoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      cms_banners: {
        Row: {
          ativo: boolean | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          destino: Database["public"]["Enums"]["cms_destino"]
          id: string
          imagem_mobile_url: string | null
          imagem_url: string
          link_externo: boolean | null
          link_texto: string | null
          link_url: string | null
          ordem: number | null
          posicao: string | null
          subtitulo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          destino?: Database["public"]["Enums"]["cms_destino"]
          id?: string
          imagem_mobile_url?: string | null
          imagem_url: string
          link_externo?: boolean | null
          link_texto?: string | null
          link_url?: string | null
          ordem?: number | null
          posicao?: string | null
          subtitulo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          destino?: Database["public"]["Enums"]["cms_destino"]
          id?: string
          imagem_mobile_url?: string | null
          imagem_url?: string
          link_externo?: boolean | null
          link_texto?: string | null
          link_url?: string | null
          ordem?: number | null
          posicao?: string | null
          subtitulo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_categorias: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string
          descricao: string | null
          destino: Database["public"]["Enums"]["cms_destino"] | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          destino?: Database["public"]["Enums"]["cms_destino"] | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          slug: string
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          destino?: Database["public"]["Enums"]["cms_destino"] | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          slug?: string
        }
        Relationships: []
      }
      cms_conteudos: {
        Row: {
          aprovador_id: string | null
          autor_id: string | null
          autor_nome: string | null
          categoria: string | null
          conteudo: string | null
          conteudo_html: string | null
          created_at: string
          data_aprovacao: string | null
          data_expiracao: string | null
          data_publicacao: string | null
          destaque: boolean | null
          destino: Database["public"]["Enums"]["cms_destino"]
          id: string
          imagem_destaque_alt: string | null
          imagem_destaque_url: string | null
          meta_description: string | null
          meta_title: string | null
          ordem: number | null
          resumo: string | null
          revisor_id: string | null
          revisor_nome: string | null
          slug: string
          status: string
          subtitulo: string | null
          tags: string[] | null
          tipo: Database["public"]["Enums"]["cms_tipo_conteudo"]
          titulo: string
          updated_at: string
          video_url: string | null
          visualizacoes: number | null
        }
        Insert: {
          aprovador_id?: string | null
          autor_id?: string | null
          autor_nome?: string | null
          categoria?: string | null
          conteudo?: string | null
          conteudo_html?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_expiracao?: string | null
          data_publicacao?: string | null
          destaque?: boolean | null
          destino?: Database["public"]["Enums"]["cms_destino"]
          id?: string
          imagem_destaque_alt?: string | null
          imagem_destaque_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          ordem?: number | null
          resumo?: string | null
          revisor_id?: string | null
          revisor_nome?: string | null
          slug: string
          status?: string
          subtitulo?: string | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["cms_tipo_conteudo"]
          titulo: string
          updated_at?: string
          video_url?: string | null
          visualizacoes?: number | null
        }
        Update: {
          aprovador_id?: string | null
          autor_id?: string | null
          autor_nome?: string | null
          categoria?: string | null
          conteudo?: string | null
          conteudo_html?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_expiracao?: string | null
          data_publicacao?: string | null
          destaque?: boolean | null
          destino?: Database["public"]["Enums"]["cms_destino"]
          id?: string
          imagem_destaque_alt?: string | null
          imagem_destaque_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          ordem?: number | null
          resumo?: string | null
          revisor_id?: string | null
          revisor_nome?: string | null
          slug?: string
          status?: string
          subtitulo?: string | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["cms_tipo_conteudo"]
          titulo?: string
          updated_at?: string
          video_url?: string | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      cms_galeria_fotos: {
        Row: {
          created_at: string
          galeria_id: string
          id: string
          legenda: string | null
          ordem: number
          thumbnail_url: string | null
          titulo: string | null
          url: string
        }
        Insert: {
          created_at?: string
          galeria_id: string
          id?: string
          legenda?: string | null
          ordem?: number
          thumbnail_url?: string | null
          titulo?: string | null
          url: string
        }
        Update: {
          created_at?: string
          galeria_id?: string
          id?: string
          legenda?: string | null
          ordem?: number
          thumbnail_url?: string | null
          titulo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_galeria_fotos_galeria_id_fkey"
            columns: ["galeria_id"]
            isOneToOne: false
            referencedRelation: "cms_galerias"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_galerias: {
        Row: {
          autor_id: string | null
          autor_nome: string | null
          categoria: string | null
          created_at: string
          data_publicacao: string | null
          descricao: string | null
          destino: string
          id: string
          imagem_capa_url: string | null
          slug: string
          status: string
          titulo: string
          updated_at: string
          visualizacoes: number | null
        }
        Insert: {
          autor_id?: string | null
          autor_nome?: string | null
          categoria?: string | null
          created_at?: string
          data_publicacao?: string | null
          descricao?: string | null
          destino?: string
          id?: string
          imagem_capa_url?: string | null
          slug: string
          status?: string
          titulo: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Update: {
          autor_id?: string | null
          autor_nome?: string | null
          categoria?: string | null
          created_at?: string
          data_publicacao?: string | null
          descricao?: string | null
          destino?: string
          id?: string
          imagem_capa_url?: string | null
          slug?: string
          status?: string
          titulo?: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Relationships: []
      }
      cms_media: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          filename: string
          id: string
          tamanho_bytes: number | null
          tipo: string
          updated_at: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          filename: string
          id?: string
          tamanho_bytes?: number | null
          tipo?: string
          updated_at?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          filename?: string
          id?: string
          tamanho_bytes?: number | null
          tipo?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      coletas_inventario: {
        Row: {
          bem_id: string
          campanha_id: string
          coordenadas_gps: Json | null
          created_at: string | null
          data_coleta: string
          dispositivo_info: Json | null
          foto_url: string | null
          id: string
          localizacao_encontrada_detalhe: string | null
          localizacao_encontrada_sala: string | null
          localizacao_encontrada_unidade_id: string | null
          observacoes: string | null
          responsavel_encontrado_id: string | null
          status_coleta: Database["public"]["Enums"]["status_coleta_inventario"]
          usuario_coletor_id: string | null
        }
        Insert: {
          bem_id: string
          campanha_id: string
          coordenadas_gps?: Json | null
          created_at?: string | null
          data_coleta?: string
          dispositivo_info?: Json | null
          foto_url?: string | null
          id?: string
          localizacao_encontrada_detalhe?: string | null
          localizacao_encontrada_sala?: string | null
          localizacao_encontrada_unidade_id?: string | null
          observacoes?: string | null
          responsavel_encontrado_id?: string | null
          status_coleta?: Database["public"]["Enums"]["status_coleta_inventario"]
          usuario_coletor_id?: string | null
        }
        Update: {
          bem_id?: string
          campanha_id?: string
          coordenadas_gps?: Json | null
          created_at?: string | null
          data_coleta?: string
          dispositivo_info?: Json | null
          foto_url?: string | null
          id?: string
          localizacao_encontrada_detalhe?: string | null
          localizacao_encontrada_sala?: string | null
          localizacao_encontrada_unidade_id?: string | null
          observacoes?: string | null
          responsavel_encontrado_id?: string | null
          status_coleta?: Database["public"]["Enums"]["status_coleta_inventario"]
          usuario_coletor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coletas_inventario_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coletas_inventario_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
          },
          {
            foreignKeyName: "coletas_inventario_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coletas_inventario_localizacao_encontrada_unidade_id_fkey"
            columns: ["localizacao_encontrada_unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coletas_inventario_responsavel_encontrado_id_fkey"
            columns: ["responsavel_encontrado_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coletas_inventario_responsavel_encontrado_id_fkey"
            columns: ["responsavel_encontrado_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "coletas_inventario_responsavel_encontrado_id_fkey"
            columns: ["responsavel_encontrado_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coletas_inventario_responsavel_encontrado_id_fkey"
            columns: ["responsavel_encontrado_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
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
      conciliacoes_inventario: {
        Row: {
          ajuste_proposto: string
          aprovador_id: string | null
          bem_id: string
          campanha_id: string
          coleta_id: string
          created_at: string | null
          created_by: string | null
          data_aprovacao: string | null
          descricao_divergencia: string
          id: string
          necessita_aprovacao: boolean | null
          observacoes: string | null
          status: string | null
          tipo_divergencia: string
          updated_at: string | null
        }
        Insert: {
          ajuste_proposto: string
          aprovador_id?: string | null
          bem_id: string
          campanha_id: string
          coleta_id: string
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          descricao_divergencia: string
          id?: string
          necessita_aprovacao?: boolean | null
          observacoes?: string | null
          status?: string | null
          tipo_divergencia: string
          updated_at?: string | null
        }
        Update: {
          ajuste_proposto?: string
          aprovador_id?: string | null
          bem_id?: string
          campanha_id?: string
          coleta_id?: string
          created_at?: string | null
          created_by?: string | null
          data_aprovacao?: string | null
          descricao_divergencia?: string
          id?: string
          necessita_aprovacao?: boolean | null
          observacoes?: string | null
          status?: string | null
          tipo_divergencia?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_inventario_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_inventario_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
          },
          {
            foreignKeyName: "conciliacoes_inventario_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_inventario_coleta_id_fkey"
            columns: ["coleta_id"]
            isOneToOne: false
            referencedRelation: "coletas_inventario"
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
          codigo: string | null
          created_at: string | null
          id: string
          instituicao_id: string | null
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
          codigo?: string | null
          created_at?: string | null
          id?: string
          instituicao_id?: string | null
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
          codigo?: string | null
          created_at?: string | null
          id?: string
          instituicao_id?: string | null
          nome?: string
          ordem_assinaturas?: string[] | null
          padrao?: boolean | null
          quem_valida_final?: string | null
          texto_declaracao?: string | null
          tipo_assinatura?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_assinatura_frequencia_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "config_autarquia_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      config_compensacao: {
        Row: {
          aplicar_a_todos: boolean | null
          ativo: boolean | null
          codigo: string | null
          compensacao_automatica: boolean | null
          compensacao_manual: boolean | null
          created_at: string | null
          created_by: string | null
          exibe_na_frequencia: boolean | null
          exibe_na_impressao: boolean | null
          id: string
          instituicao_id: string | null
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
          codigo?: string | null
          compensacao_automatica?: boolean | null
          compensacao_manual?: boolean | null
          created_at?: string | null
          created_by?: string | null
          exibe_na_frequencia?: boolean | null
          exibe_na_impressao?: boolean | null
          id?: string
          instituicao_id?: string | null
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
          codigo?: string | null
          compensacao_automatica?: boolean | null
          compensacao_manual?: boolean | null
          created_at?: string | null
          created_by?: string | null
          exibe_na_frequencia?: boolean | null
          exibe_na_impressao?: boolean | null
          id?: string
          instituicao_id?: string | null
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
            foreignKeyName: "config_compensacao_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_compensacao_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_fechamento_folha: {
        Row: {
          ativo: boolean | null
          bloqueia_alteracoes: boolean | null
          conta_remessa_padrao_id: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          dia_limite_lancamento: number | null
          dia_limite_processamento: number | null
          dia_pagamento: number | null
          exige_aprovacao_reabertura: boolean | null
          exige_frequencia_fechada: boolean | null
          exige_todas_fichas_processadas: boolean | null
          exige_validacao_inconsistencias: boolean | null
          gera_esocial_automatico: boolean | null
          gera_remessa_automatica: boolean | null
          id: string
          instituicao_id: string | null
          nome: string
          padrao: boolean | null
          perfil_aprovador_reabertura: string | null
          permite_fechar_com_pendencias: boolean | null
          permite_reabertura: boolean | null
          prazo_guarda_historico_dias: number | null
          registra_historico_alteracoes: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          bloqueia_alteracoes?: boolean | null
          conta_remessa_padrao_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          dia_limite_lancamento?: number | null
          dia_limite_processamento?: number | null
          dia_pagamento?: number | null
          exige_aprovacao_reabertura?: boolean | null
          exige_frequencia_fechada?: boolean | null
          exige_todas_fichas_processadas?: boolean | null
          exige_validacao_inconsistencias?: boolean | null
          gera_esocial_automatico?: boolean | null
          gera_remessa_automatica?: boolean | null
          id?: string
          instituicao_id?: string | null
          nome?: string
          padrao?: boolean | null
          perfil_aprovador_reabertura?: string | null
          permite_fechar_com_pendencias?: boolean | null
          permite_reabertura?: boolean | null
          prazo_guarda_historico_dias?: number | null
          registra_historico_alteracoes?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          bloqueia_alteracoes?: boolean | null
          conta_remessa_padrao_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          dia_limite_lancamento?: number | null
          dia_limite_processamento?: number | null
          dia_pagamento?: number | null
          exige_aprovacao_reabertura?: boolean | null
          exige_frequencia_fechada?: boolean | null
          exige_todas_fichas_processadas?: boolean | null
          exige_validacao_inconsistencias?: boolean | null
          gera_esocial_automatico?: boolean | null
          gera_remessa_automatica?: boolean | null
          id?: string
          instituicao_id?: string | null
          nome?: string
          padrao?: boolean | null
          perfil_aprovador_reabertura?: string | null
          permite_fechar_com_pendencias?: boolean | null
          permite_reabertura?: boolean | null
          prazo_guarda_historico_dias?: number | null
          registra_historico_alteracoes?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_fechamento_folha_conta_remessa_padrao_id_fkey"
            columns: ["conta_remessa_padrao_id"]
            isOneToOne: false
            referencedRelation: "contas_autarquia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_fechamento_folha_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
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
          instituicao_id: string | null
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
          instituicao_id?: string | null
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
          instituicao_id?: string | null
          mes?: number
          permite_reabertura?: boolean | null
          prazo_reabertura_dias?: number | null
          reabertura_exige_justificativa?: boolean | null
          rh_pode_fechar?: boolean | null
          servidor_pode_fechar?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_fechamento_frequencia_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_incidencias: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          instituicao_id: string | null
          percentual_incidencia: number | null
          rubrica_destino_id: string
          rubrica_origem_id: string
          tipo_incidencia: string
          valor_limite: number | null
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          instituicao_id?: string | null
          percentual_incidencia?: number | null
          rubrica_destino_id: string
          rubrica_origem_id: string
          tipo_incidencia: string
          valor_limite?: number | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          instituicao_id?: string | null
          percentual_incidencia?: number | null
          rubrica_destino_id?: string
          rubrica_origem_id?: string
          tipo_incidencia?: string
          valor_limite?: number | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_incidencias_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_incidencias_rubrica_destino_id_fkey"
            columns: ["rubrica_destino_id"]
            isOneToOne: false
            referencedRelation: "config_rubricas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_incidencias_rubrica_origem_id_fkey"
            columns: ["rubrica_origem_id"]
            isOneToOne: false
            referencedRelation: "config_rubricas"
            referencedColumns: ["id"]
          },
        ]
      }
      config_institucional: {
        Row: {
          ativo: boolean | null
          brasao_url: string | null
          cargo_responsavel: string | null
          cnpj: string
          codigo: string
          contato: Json | null
          cores: Json | null
          cpf_responsavel: string | null
          created_at: string | null
          created_by: string | null
          endereco: Json | null
          expediente: Json | null
          id: string
          logo_url: string | null
          natureza_juridica: string | null
          nome: string
          nome_fantasia: string | null
          politicas: Json | null
          responsavel_legal: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          brasao_url?: string | null
          cargo_responsavel?: string | null
          cnpj: string
          codigo: string
          contato?: Json | null
          cores?: Json | null
          cpf_responsavel?: string | null
          created_at?: string | null
          created_by?: string | null
          endereco?: Json | null
          expediente?: Json | null
          id?: string
          logo_url?: string | null
          natureza_juridica?: string | null
          nome: string
          nome_fantasia?: string | null
          politicas?: Json | null
          responsavel_legal?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          brasao_url?: string | null
          cargo_responsavel?: string | null
          cnpj?: string
          codigo?: string
          contato?: Json | null
          cores?: Json | null
          cpf_responsavel?: string | null
          created_at?: string | null
          created_by?: string | null
          endereco?: Json | null
          expediente?: Json | null
          id?: string
          logo_url?: string | null
          natureza_juridica?: string | null
          nome?: string
          nome_fantasia?: string | null
          politicas?: Json | null
          responsavel_legal?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
          fundamentacao_legal: string | null
          id: string
          instituicao_id: string | null
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
          vigencia_fim: string | null
          vigencia_inicio: string | null
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
          fundamentacao_legal?: string | null
          id?: string
          instituicao_id?: string | null
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
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
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
          fundamentacao_legal?: string | null
          id?: string
          instituicao_id?: string | null
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
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
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
            foreignKeyName: "config_jornada_padrao_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "config_jornada_padrao_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      config_motivos_desligamento: {
        Row: {
          aplica_cedido: boolean
          aplica_comissionado: boolean
          aplica_efetivo: boolean
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          descricao: string | null
          gera_vacancia: boolean
          id: string
          instituicao_id: string
          nome: string
          ordem: number | null
          requer_doe: boolean
          requer_portaria: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          aplica_cedido?: boolean
          aplica_comissionado?: boolean
          aplica_efetivo?: boolean
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          gera_vacancia?: boolean
          id?: string
          instituicao_id: string
          nome: string
          ordem?: number | null
          requer_doe?: boolean
          requer_portaria?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          aplica_cedido?: boolean
          aplica_comissionado?: boolean
          aplica_efetivo?: boolean
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          gera_vacancia?: boolean
          id?: string
          instituicao_id?: string
          nome?: string
          ordem?: number | null
          requer_doe?: boolean
          requer_portaria?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_motivos_desligamento_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_paginas_historico: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          pagina_id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          pagina_id: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          pagina_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_paginas_historico_pagina_id_fkey"
            columns: ["pagina_id"]
            isOneToOne: false
            referencedRelation: "config_paginas_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      config_paginas_publicas: {
        Row: {
          alterado_por: string | null
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          em_manutencao: boolean
          id: string
          mensagem_manutencao: string | null
          nome: string
          previsao_retorno: string | null
          rota: string
          titulo_manutencao: string | null
          updated_at: string
        }
        Insert: {
          alterado_por?: string | null
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          em_manutencao?: boolean
          id?: string
          mensagem_manutencao?: string | null
          nome: string
          previsao_retorno?: string | null
          rota: string
          titulo_manutencao?: string | null
          updated_at?: string
        }
        Update: {
          alterado_por?: string | null
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          em_manutencao?: boolean
          id?: string
          mensagem_manutencao?: string | null
          nome?: string
          previsao_retorno?: string | null
          rota?: string
          titulo_manutencao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      config_parametros_meta: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          dominio: string
          editavel_producao: boolean | null
          id: string
          nome: string
          ordem: number | null
          permite_nivel_instituicao: boolean | null
          permite_nivel_servidor: boolean | null
          permite_nivel_tipo_servidor: boolean | null
          permite_nivel_unidade: boolean | null
          requer_aprovacao: boolean | null
          requer_vigencia: boolean | null
          tipo_dado: string
          tipo_valor: string
          valor_padrao: Json | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          dominio: string
          editavel_producao?: boolean | null
          id?: string
          nome: string
          ordem?: number | null
          permite_nivel_instituicao?: boolean | null
          permite_nivel_servidor?: boolean | null
          permite_nivel_tipo_servidor?: boolean | null
          permite_nivel_unidade?: boolean | null
          requer_aprovacao?: boolean | null
          requer_vigencia?: boolean | null
          tipo_dado: string
          tipo_valor: string
          valor_padrao?: Json | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          dominio?: string
          editavel_producao?: boolean | null
          id?: string
          nome?: string
          ordem?: number | null
          permite_nivel_instituicao?: boolean | null
          permite_nivel_servidor?: boolean | null
          permite_nivel_tipo_servidor?: boolean | null
          permite_nivel_unidade?: boolean | null
          requer_aprovacao?: boolean | null
          requer_vigencia?: boolean | null
          tipo_dado?: string
          tipo_valor?: string
          valor_padrao?: Json | null
        }
        Relationships: []
      }
      config_parametros_valores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          instituicao_id: string
          justificativa: string | null
          parametro_codigo: string
          servidor_id: string | null
          tipo_servidor: string | null
          unidade_id: string | null
          updated_at: string | null
          updated_by: string | null
          valor: Json
          versao: number | null
          versao_anterior_id: string | null
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          instituicao_id: string
          justificativa?: string | null
          parametro_codigo: string
          servidor_id?: string | null
          tipo_servidor?: string | null
          unidade_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor: Json
          versao?: number | null
          versao_anterior_id?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          instituicao_id?: string
          justificativa?: string | null
          parametro_codigo?: string
          servidor_id?: string | null
          tipo_servidor?: string | null
          unidade_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor?: Json
          versao?: number | null
          versao_anterior_id?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_parametros_valores_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_parametros_valores_parametro_codigo_fkey"
            columns: ["parametro_codigo"]
            isOneToOne: false
            referencedRelation: "config_parametros_meta"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "config_parametros_valores_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_parametros_valores_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "config_parametros_valores_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_parametros_valores_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_parametros_valores_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_parametros_valores_versao_anterior_id_fkey"
            columns: ["versao_anterior_id"]
            isOneToOne: false
            referencedRelation: "config_parametros_valores"
            referencedColumns: ["id"]
          },
        ]
      }
      config_regras_calculo: {
        Row: {
          ativo: boolean | null
          codigo: string
          condicoes: Json | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          escopo: string
          escopo_id: string | null
          id: string
          instituicao_id: string | null
          nome: string
          parametros: Json
          prioridade: number | null
          tipo_regra: string
          updated_at: string | null
          updated_by: string | null
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          condicoes?: Json | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          escopo?: string
          escopo_id?: string | null
          id?: string
          instituicao_id?: string | null
          nome: string
          parametros?: Json
          prioridade?: number | null
          tipo_regra: string
          updated_at?: string | null
          updated_by?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          condicoes?: Json | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          escopo?: string
          escopo_id?: string | null
          id?: string
          instituicao_id?: string | null
          nome?: string
          parametros?: Json
          prioridade?: number | null
          tipo_regra?: string
          updated_at?: string | null
          updated_by?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_regras_calculo_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_rubricas: {
        Row: {
          ativo: boolean | null
          automatica: boolean | null
          codigo: string
          codigo_esocial: string | null
          compoe_base_fgts: boolean | null
          compoe_base_inss: boolean | null
          compoe_base_irrf: boolean | null
          created_at: string | null
          created_by: string | null
          desconta_faltas: boolean | null
          descricao: string | null
          formula: string | null
          id: string
          incide_13_salario: boolean | null
          incide_ferias: boolean | null
          incide_fgts: boolean | null
          incide_inss: boolean | null
          incide_irrf: boolean | null
          incide_rescisao: boolean | null
          instituicao_id: string | null
          natureza: string
          natureza_esocial: string | null
          nome: string
          obrigatoria: boolean | null
          ordem_calculo: number | null
          percentual: number | null
          proporcional_dias: boolean | null
          proporcional_horas: boolean | null
          rubrica_base_id: string | null
          teto_constitucional: boolean | null
          tipo_calculo: string
          tipo_rubrica_id: string | null
          updated_at: string | null
          updated_by: string | null
          valor_fixo: number | null
          valor_maximo: number | null
          valor_minimo: number | null
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          ativo?: boolean | null
          automatica?: boolean | null
          codigo: string
          codigo_esocial?: string | null
          compoe_base_fgts?: boolean | null
          compoe_base_inss?: boolean | null
          compoe_base_irrf?: boolean | null
          created_at?: string | null
          created_by?: string | null
          desconta_faltas?: boolean | null
          descricao?: string | null
          formula?: string | null
          id?: string
          incide_13_salario?: boolean | null
          incide_ferias?: boolean | null
          incide_fgts?: boolean | null
          incide_inss?: boolean | null
          incide_irrf?: boolean | null
          incide_rescisao?: boolean | null
          instituicao_id?: string | null
          natureza: string
          natureza_esocial?: string | null
          nome: string
          obrigatoria?: boolean | null
          ordem_calculo?: number | null
          percentual?: number | null
          proporcional_dias?: boolean | null
          proporcional_horas?: boolean | null
          rubrica_base_id?: string | null
          teto_constitucional?: boolean | null
          tipo_calculo?: string
          tipo_rubrica_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_fixo?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          ativo?: boolean | null
          automatica?: boolean | null
          codigo?: string
          codigo_esocial?: string | null
          compoe_base_fgts?: boolean | null
          compoe_base_inss?: boolean | null
          compoe_base_irrf?: boolean | null
          created_at?: string | null
          created_by?: string | null
          desconta_faltas?: boolean | null
          descricao?: string | null
          formula?: string | null
          id?: string
          incide_13_salario?: boolean | null
          incide_ferias?: boolean | null
          incide_fgts?: boolean | null
          incide_inss?: boolean | null
          incide_irrf?: boolean | null
          incide_rescisao?: boolean | null
          instituicao_id?: string | null
          natureza?: string
          natureza_esocial?: string | null
          nome?: string
          obrigatoria?: boolean | null
          ordem_calculo?: number | null
          percentual?: number | null
          proporcional_dias?: boolean | null
          proporcional_horas?: boolean | null
          rubrica_base_id?: string | null
          teto_constitucional?: boolean | null
          tipo_calculo?: string
          tipo_rubrica_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valor_fixo?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_rubricas_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_rubricas_rubrica_base_id_fkey"
            columns: ["rubrica_base_id"]
            isOneToOne: false
            referencedRelation: "config_rubricas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_rubricas_tipo_rubrica_id_fkey"
            columns: ["tipo_rubrica_id"]
            isOneToOne: false
            referencedRelation: "config_tipos_rubrica"
            referencedColumns: ["id"]
          },
        ]
      }
      config_situacoes_funcionais: {
        Row: {
          ativo: boolean
          codigo: string
          cor_classe: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          exige_documento: boolean
          icone: string | null
          id: string
          instituicao_id: string
          nome: string
          ordem: number | null
          permite_remuneracao: boolean
          permite_trabalho: boolean
          situacao_final: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          cor_classe?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          exige_documento?: boolean
          icone?: string | null
          id?: string
          instituicao_id: string
          nome: string
          ordem?: number | null
          permite_remuneracao?: boolean
          permite_trabalho?: boolean
          situacao_final?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          cor_classe?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          exige_documento?: boolean
          icone?: string | null
          id?: string
          instituicao_id?: string
          nome?: string
          ordem?: number | null
          permite_remuneracao?: boolean
          permite_trabalho?: boolean
          situacao_final?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_situacoes_funcionais_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_tipos_ato: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          instituicao_id: string
          nome: string
          ordem: number | null
          requer_assinatura: boolean
          requer_doe: boolean
          sigla: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          instituicao_id: string
          nome: string
          ordem?: number | null
          requer_assinatura?: boolean
          requer_doe?: boolean
          sigla?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          instituicao_id?: string
          nome?: string
          ordem?: number | null
          requer_assinatura?: boolean
          requer_doe?: boolean
          sigla?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_tipos_ato_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_tipos_onus: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          instituicao_id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          instituicao_id: string
          nome: string
          ordem?: number | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          instituicao_id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "config_tipos_onus_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_tipos_rubrica: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          exibe_contracheque: boolean | null
          exibe_relatorio: boolean | null
          grupo: string | null
          id: string
          instituicao_id: string | null
          natureza: string
          nome: string
          ordem_exibicao: number | null
          subgrupo: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          exibe_contracheque?: boolean | null
          exibe_relatorio?: boolean | null
          grupo?: string | null
          id?: string
          instituicao_id?: string | null
          natureza: string
          nome: string
          ordem_exibicao?: number | null
          subgrupo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          exibe_contracheque?: boolean | null
          exibe_relatorio?: boolean | null
          grupo?: string | null
          id?: string
          instituicao_id?: string | null
          natureza?: string
          nome?: string
          ordem_exibicao?: number | null
          subgrupo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_tipos_rubrica_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
          },
        ]
      }
      config_tipos_servidor: {
        Row: {
          ativo: boolean
          codigo: string
          cor_classe: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          gera_matricula: boolean
          icone: string | null
          id: string
          impacta_folha: boolean
          impacta_frequencia: boolean
          instituicao_id: string
          nome: string
          ordem: number | null
          permite_cargo: boolean
          permite_lotacao_externa: boolean
          permite_lotacao_interna: boolean
          requer_orgao_destino: boolean
          requer_orgao_origem: boolean
          requer_provimento: boolean
          tipos_cargo_permitidos: string[] | null
          updated_at: string
          updated_by: string | null
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          cor_classe?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          gera_matricula?: boolean
          icone?: string | null
          id?: string
          impacta_folha?: boolean
          impacta_frequencia?: boolean
          instituicao_id: string
          nome: string
          ordem?: number | null
          permite_cargo?: boolean
          permite_lotacao_externa?: boolean
          permite_lotacao_interna?: boolean
          requer_orgao_destino?: boolean
          requer_orgao_origem?: boolean
          requer_provimento?: boolean
          tipos_cargo_permitidos?: string[] | null
          updated_at?: string
          updated_by?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          cor_classe?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          gera_matricula?: boolean
          icone?: string | null
          id?: string
          impacta_folha?: boolean
          impacta_frequencia?: boolean
          instituicao_id?: string
          nome?: string
          ordem?: number | null
          permite_cargo?: boolean
          permite_lotacao_externa?: boolean
          permite_lotacao_interna?: boolean
          requer_orgao_destino?: boolean
          requer_orgao_origem?: boolean
          requer_provimento?: boolean
          tipos_cargo_permitidos?: string[] | null
          updated_at?: string
          updated_by?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_tipos_servidor_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "consignacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
        ]
      }
      contatos_eventos_esportivos: {
        Row: {
          ativo: boolean | null
          created_at: string
          evento: string
          icone: string | null
          id: string
          ordem: number | null
          subtitulo: string | null
          tipo: string
          titulo: string
          updated_at: string
          valor: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          evento?: string
          icone?: string | null
          id?: string
          ordem?: number | null
          subtitulo?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          valor: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          evento?: string
          icone?: string | null
          id?: string
          ordem?: number | null
          subtitulo?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contratos_fiscal_id_fkey"
            columns: ["fiscal_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contratos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "controles_internos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "decisoes_administrativas_autoridade_id_fkey"
            columns: ["autoridade_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "demandas_ascom_aprovado_por_id_fkey"
            columns: ["aprovado_por_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "demandas_ascom_autorizado_presidencia_por_id_fkey"
            columns: ["autorizado_presidencia_por_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "demandas_ascom_responsavel_ascom_id_fkey"
            columns: ["responsavel_ascom_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "demandas_ascom_servidor_solicitante_id_fkey"
            columns: ["servidor_solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "dependentes_irrf_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            foreignKeyName: "designacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "designacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "despachos_autoridade_id_fkey"
            columns: ["autoridade_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
          esfera: string | null
          exige_compensacao: boolean | null
          fundamentacao_legal: string | null
          horas_expediente: number | null
          id: string
          instituicao_id: string | null
          mes_recorrente: number | null
          municipio: string | null
          nome: string
          observacao: string | null
          recorrente: boolean | null
          tipo: string
          uf: string | null
          unidades_aplicaveis: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          abrangencia?: string | null
          ativo?: boolean | null
          conta_frequencia?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data: string
          dia_recorrente?: number | null
          esfera?: string | null
          exige_compensacao?: boolean | null
          fundamentacao_legal?: string | null
          horas_expediente?: number | null
          id?: string
          instituicao_id?: string | null
          mes_recorrente?: number | null
          municipio?: string | null
          nome: string
          observacao?: string | null
          recorrente?: boolean | null
          tipo: string
          uf?: string | null
          unidades_aplicaveis?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          abrangencia?: string | null
          ativo?: boolean | null
          conta_frequencia?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          dia_recorrente?: number | null
          esfera?: string | null
          exige_compensacao?: boolean | null
          fundamentacao_legal?: string | null
          horas_expediente?: number | null
          id?: string
          instituicao_id?: string | null
          mes_recorrente?: number | null
          municipio?: string | null
          nome?: string
          observacao?: string | null
          recorrente?: boolean | null
          tipo?: string
          uf?: string | null
          unidades_aplicaveis?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dias_nao_uteis_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
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
          doe_link: string | null
          doe_numero: string | null
          ementa: string | null
          id: string
          numero: string
          observacoes: string | null
          provimento_id: string | null
          responsavel_id: string | null
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
          responsavel_id?: string | null
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
          responsavel_id?: string | null
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
            foreignKeyName: "documentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "documentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "documentos_preparatorios_licitacao_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "documentos_preparatorios_licitacao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      documentos_requerimento_servidor: {
        Row: {
          arquivo_assinado_url: string | null
          created_at: string
          created_by: string | null
          data_solicitacao: string
          data_upload_assinado: string | null
          descricao: string | null
          id: string
          modelo_url: string | null
          observacoes: string | null
          servidor_id: string
          status: string
          tipo_documento: string
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_assinado_url?: string | null
          created_at?: string
          created_by?: string | null
          data_solicitacao?: string
          data_upload_assinado?: string | null
          descricao?: string | null
          id?: string
          modelo_url?: string | null
          observacoes?: string | null
          servidor_id: string
          status?: string
          tipo_documento: string
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_assinado_url?: string | null
          created_at?: string
          created_by?: string | null
          data_solicitacao?: string
          data_upload_assinado?: string | null
          descricao?: string | null
          id?: string
          modelo_url?: string | null
          observacoes?: string | null
          servidor_id?: string
          status?: string
          tipo_documento?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_requerimento_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_requerimento_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "documentos_requerimento_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_requerimento_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "encaminhamentos_servidor_destino_id_fkey"
            columns: ["servidor_destino_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      escolas_jer: {
        Row: {
          created_at: string
          id: string
          inep: string | null
          ja_cadastrada: boolean
          municipio: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inep?: string | null
          ja_cadastrada?: boolean
          municipio?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inep?: string | null
          ja_cadastrada?: boolean
          municipio?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "eventos_esocial_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
        ]
      }
      federacao_arbitros: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          disponibilidade: string | null
          email: string | null
          federacao_id: string
          id: string
          modalidades: string[] | null
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          disponibilidade?: string | null
          email?: string | null
          federacao_id: string
          id?: string
          modalidades?: string[] | null
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          disponibilidade?: string | null
          email?: string | null
          federacao_id?: string
          id?: string
          modalidades?: string[] | null
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "federacao_arbitros_federacao_id_fkey"
            columns: ["federacao_id"]
            isOneToOne: false
            referencedRelation: "federacoes_esportivas"
            referencedColumns: ["id"]
          },
        ]
      }
      federacao_espacos_cedidos: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao_espaco: string | null
          dias_semana: string[] | null
          federacao_id: string
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          nome_espaco: string
          numero_portaria: string | null
          numero_termo_cessao: string | null
          observacoes: string | null
          processo_sei: string | null
          status: string
          unidade_local_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao_espaco?: string | null
          dias_semana?: string[] | null
          federacao_id: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          nome_espaco: string
          numero_portaria?: string | null
          numero_termo_cessao?: string | null
          observacoes?: string | null
          processo_sei?: string | null
          status?: string
          unidade_local_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao_espaco?: string | null
          dias_semana?: string[] | null
          federacao_id?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          nome_espaco?: string
          numero_portaria?: string | null
          numero_termo_cessao?: string | null
          observacoes?: string | null
          processo_sei?: string | null
          status?: string
          unidade_local_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "federacao_espacos_cedidos_federacao_id_fkey"
            columns: ["federacao_id"]
            isOneToOne: false
            referencedRelation: "federacoes_esportivas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federacao_espacos_cedidos_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      federacao_parcerias: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          documento_url: string | null
          federacao_id: string
          id: string
          numero_portaria: string | null
          numero_termo: string | null
          observacoes: string | null
          processo_sei: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          documento_url?: string | null
          federacao_id: string
          id?: string
          numero_portaria?: string | null
          numero_termo?: string | null
          observacoes?: string | null
          processo_sei?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          documento_url?: string | null
          federacao_id?: string
          id?: string
          numero_portaria?: string | null
          numero_termo?: string | null
          observacoes?: string | null
          processo_sei?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "federacao_parcerias_federacao_id_fkey"
            columns: ["federacao_id"]
            isOneToOne: false
            referencedRelation: "federacoes_esportivas"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "ferias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "fichas_financeiras_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      fin_acoes_orcamentarias: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          meta_fisica: number | null
          nome: string
          produto: string | null
          programa_id: string
          tipo: string | null
          unidade_medida: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          meta_fisica?: number | null
          nome: string
          produto?: string | null
          programa_id: string
          tipo?: string | null
          unidade_medida?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          meta_fisica?: number | null
          nome?: string
          produto?: string | null
          programa_id?: string
          tipo?: string | null
          unidade_medida?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_acoes_orcamentarias_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "fin_programas_orcamentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_adiantamento_itens: {
        Row: {
          adiantamento_id: string
          cnpj_cpf_fornecedor: string | null
          created_at: string | null
          data_documento: string
          descricao: string
          documento_id: string | null
          id: string
          item_numero: number
          motivo_invalido: string | null
          nome_fornecedor: string | null
          numero_documento: string | null
          tipo_documento: string
          validado_em: string | null
          validado_por: string | null
          valido: boolean | null
          valor: number
        }
        Insert: {
          adiantamento_id: string
          cnpj_cpf_fornecedor?: string | null
          created_at?: string | null
          data_documento: string
          descricao: string
          documento_id?: string | null
          id?: string
          item_numero: number
          motivo_invalido?: string | null
          nome_fornecedor?: string | null
          numero_documento?: string | null
          tipo_documento: string
          validado_em?: string | null
          validado_por?: string | null
          valido?: boolean | null
          valor: number
        }
        Update: {
          adiantamento_id?: string
          cnpj_cpf_fornecedor?: string | null
          created_at?: string | null
          data_documento?: string
          descricao?: string
          documento_id?: string | null
          id?: string
          item_numero?: number
          motivo_invalido?: string | null
          nome_fornecedor?: string | null
          numero_documento?: string | null
          tipo_documento?: string
          validado_em?: string | null
          validado_por?: string | null
          valido?: boolean | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_adiantamento_itens_adiantamento_id_fkey"
            columns: ["adiantamento_id"]
            isOneToOne: false
            referencedRelation: "fin_adiantamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_adiantamentos: {
        Row: {
          autorizado_em: string | null
          autorizado_por: string | null
          bloqueado: boolean | null
          conta_bancaria_id: string | null
          conta_suprido_agencia: string | null
          conta_suprido_banco: string | null
          conta_suprido_numero: string | null
          created_at: string | null
          created_by: string | null
          data_bloqueio: string | null
          data_liberacao: string | null
          data_prestacao: string | null
          data_solicitacao: string
          dotacao_id: string | null
          empenho_id: string | null
          exercicio: number
          finalidade: string
          historico_status: Json | null
          id: string
          liberado_em: string | null
          liberado_por: string | null
          motivo_bloqueio: string | null
          numero: string
          observacoes: string | null
          parecer_prestacao: string | null
          periodo_utilizacao_fim: string | null
          periodo_utilizacao_inicio: string | null
          prazo_prestacao_contas: string | null
          prestacao_aprovada_em: string | null
          prestacao_aprovada_por: string | null
          servidor_suprido_id: string
          status: Database["public"]["Enums"]["status_adiantamento"] | null
          unidade_id: string
          updated_at: string | null
          valor_aprovado: number | null
          valor_devolvido: number | null
          valor_solicitado: number
          valor_utilizado: number | null
        }
        Insert: {
          autorizado_em?: string | null
          autorizado_por?: string | null
          bloqueado?: boolean | null
          conta_bancaria_id?: string | null
          conta_suprido_agencia?: string | null
          conta_suprido_banco?: string | null
          conta_suprido_numero?: string | null
          created_at?: string | null
          created_by?: string | null
          data_bloqueio?: string | null
          data_liberacao?: string | null
          data_prestacao?: string | null
          data_solicitacao?: string
          dotacao_id?: string | null
          empenho_id?: string | null
          exercicio: number
          finalidade: string
          historico_status?: Json | null
          id?: string
          liberado_em?: string | null
          liberado_por?: string | null
          motivo_bloqueio?: string | null
          numero: string
          observacoes?: string | null
          parecer_prestacao?: string | null
          periodo_utilizacao_fim?: string | null
          periodo_utilizacao_inicio?: string | null
          prazo_prestacao_contas?: string | null
          prestacao_aprovada_em?: string | null
          prestacao_aprovada_por?: string | null
          servidor_suprido_id: string
          status?: Database["public"]["Enums"]["status_adiantamento"] | null
          unidade_id: string
          updated_at?: string | null
          valor_aprovado?: number | null
          valor_devolvido?: number | null
          valor_solicitado: number
          valor_utilizado?: number | null
        }
        Update: {
          autorizado_em?: string | null
          autorizado_por?: string | null
          bloqueado?: boolean | null
          conta_bancaria_id?: string | null
          conta_suprido_agencia?: string | null
          conta_suprido_banco?: string | null
          conta_suprido_numero?: string | null
          created_at?: string | null
          created_by?: string | null
          data_bloqueio?: string | null
          data_liberacao?: string | null
          data_prestacao?: string | null
          data_solicitacao?: string
          dotacao_id?: string | null
          empenho_id?: string | null
          exercicio?: number
          finalidade?: string
          historico_status?: Json | null
          id?: string
          liberado_em?: string | null
          liberado_por?: string | null
          motivo_bloqueio?: string | null
          numero?: string
          observacoes?: string | null
          parecer_prestacao?: string | null
          periodo_utilizacao_fim?: string | null
          periodo_utilizacao_inicio?: string | null
          prazo_prestacao_contas?: string | null
          prestacao_aprovada_em?: string | null
          prestacao_aprovada_por?: string | null
          servidor_suprido_id?: string
          status?: Database["public"]["Enums"]["status_adiantamento"] | null
          unidade_id?: string
          updated_at?: string | null
          valor_aprovado?: number | null
          valor_devolvido?: number | null
          valor_solicitado?: number
          valor_utilizado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_adiantamentos_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "fin_contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_adiantamentos_dotacao_id_fkey"
            columns: ["dotacao_id"]
            isOneToOne: false
            referencedRelation: "fin_dotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_adiantamentos_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "fin_empenhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_adiantamentos_servidor_suprido_id_fkey"
            columns: ["servidor_suprido_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_adiantamentos_servidor_suprido_id_fkey"
            columns: ["servidor_suprido_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "fin_adiantamentos_servidor_suprido_id_fkey"
            columns: ["servidor_suprido_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_adiantamentos_servidor_suprido_id_fkey"
            columns: ["servidor_suprido_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_adiantamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_alteracoes_orcamentarias: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string | null
          created_by: string | null
          data_alteracao: string
          dotacao_destino_id: string | null
          dotacao_origem_id: string | null
          exercicio: number
          fundamentacao_legal: string | null
          id: string
          justificativa: string
          numero: string
          observacoes: string | null
          status:
            | Database["public"]["Enums"]["status_workflow_financeiro"]
            | null
          tipo: Database["public"]["Enums"]["tipo_alteracao_orcamentaria"]
          updated_at: string | null
          valor: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          created_by?: string | null
          data_alteracao?: string
          dotacao_destino_id?: string | null
          dotacao_origem_id?: string | null
          exercicio: number
          fundamentacao_legal?: string | null
          id?: string
          justificativa: string
          numero: string
          observacoes?: string | null
          status?:
            | Database["public"]["Enums"]["status_workflow_financeiro"]
            | null
          tipo: Database["public"]["Enums"]["tipo_alteracao_orcamentaria"]
          updated_at?: string | null
          valor: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          created_by?: string | null
          data_alteracao?: string
          dotacao_destino_id?: string | null
          dotacao_origem_id?: string | null
          exercicio?: number
          fundamentacao_legal?: string | null
          id?: string
          justificativa?: string
          numero?: string
          observacoes?: string | null
          status?:
            | Database["public"]["Enums"]["status_workflow_financeiro"]
            | null
          tipo?: Database["public"]["Enums"]["tipo_alteracao_orcamentaria"]
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_alteracoes_orcamentarias_dotacao_destino_id_fkey"
            columns: ["dotacao_destino_id"]
            isOneToOne: false
            referencedRelation: "fin_dotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_alteracoes_orcamentarias_dotacao_origem_id_fkey"
            columns: ["dotacao_origem_id"]
            isOneToOne: false
            referencedRelation: "fin_dotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_audit_log: {
        Row: {
          acao: string
          campos_alterados: string[] | null
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: unknown
          registro_id: string
          tabela_origem: string
          user_agent: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao: string
          campos_alterados?: string[] | null
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id: string
          tabela_origem: string
          user_agent?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          campos_alterados?: string[] | null
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id?: string
          tabela_origem?: string
          user_agent?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: []
      }
      fin_checklist_ci: {
        Row: {
          conforme: boolean | null
          created_at: string | null
          id: string
          item_verificacao: string
          obrigatorio: boolean | null
          observacao: string | null
          solicitacao_id: string
          verificado_em: string | null
          verificado_por: string | null
        }
        Insert: {
          conforme?: boolean | null
          created_at?: string | null
          id?: string
          item_verificacao: string
          obrigatorio?: boolean | null
          observacao?: string | null
          solicitacao_id: string
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Update: {
          conforme?: boolean | null
          created_at?: string | null
          id?: string
          item_verificacao?: string
          obrigatorio?: boolean | null
          observacao?: string | null
          solicitacao_id?: string
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_checklist_ci_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "fin_solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_contas_bancarias: {
        Row: {
          agencia: string
          agencia_digito: string | null
          ativo: boolean | null
          banco_codigo: string
          banco_nome: string
          conta: string
          conta_digito: string | null
          created_at: string | null
          created_by: string | null
          data_ultimo_saldo: string | null
          finalidade: string | null
          fonte_recurso_id: string | null
          id: string
          nome_conta: string
          responsavel_id: string | null
          saldo_atual: number | null
          tipo: Database["public"]["Enums"]["tipo_conta_bancaria"]
          updated_at: string | null
        }
        Insert: {
          agencia: string
          agencia_digito?: string | null
          ativo?: boolean | null
          banco_codigo: string
          banco_nome: string
          conta: string
          conta_digito?: string | null
          created_at?: string | null
          created_by?: string | null
          data_ultimo_saldo?: string | null
          finalidade?: string | null
          fonte_recurso_id?: string | null
          id?: string
          nome_conta: string
          responsavel_id?: string | null
          saldo_atual?: number | null
          tipo?: Database["public"]["Enums"]["tipo_conta_bancaria"]
          updated_at?: string | null
        }
        Update: {
          agencia?: string
          agencia_digito?: string | null
          ativo?: boolean | null
          banco_codigo?: string
          banco_nome?: string
          conta?: string
          conta_digito?: string | null
          created_at?: string | null
          created_by?: string | null
          data_ultimo_saldo?: string | null
          finalidade?: string | null
          fonte_recurso_id?: string | null
          id?: string
          nome_conta?: string
          responsavel_id?: string | null
          saldo_atual?: number | null
          tipo?: Database["public"]["Enums"]["tipo_conta_bancaria"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_contas_bancarias_fonte_recurso_id_fkey"
            columns: ["fonte_recurso_id"]
            isOneToOne: false
            referencedRelation: "fin_fontes_recurso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_contas_bancarias_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_contas_bancarias_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "fin_contas_bancarias_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_contas_bancarias_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_documentos: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string | null
          data_documento: string | null
          documento_anterior_id: string | null
          entidade_id: string
          entidade_tipo: string
          excluido_em: string | null
          excluido_por: string | null
          hash_arquivo: string | null
          id: string
          ip_address: unknown
          motivo_exclusao: string | null
          nome_arquivo: string
          numero_documento: string | null
          obrigatorio: boolean | null
          storage_path: string
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          valor_documento: number | null
          versao: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string | null
          data_documento?: string | null
          documento_anterior_id?: string | null
          entidade_id: string
          entidade_tipo: string
          excluido_em?: string | null
          excluido_por?: string | null
          hash_arquivo?: string | null
          id?: string
          ip_address?: unknown
          motivo_exclusao?: string | null
          nome_arquivo: string
          numero_documento?: string | null
          obrigatorio?: boolean | null
          storage_path: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          valor_documento?: number | null
          versao?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string | null
          data_documento?: string | null
          documento_anterior_id?: string | null
          entidade_id?: string
          entidade_tipo?: string
          excluido_em?: string | null
          excluido_por?: string | null
          hash_arquivo?: string | null
          id?: string
          ip_address?: unknown
          motivo_exclusao?: string | null
          nome_arquivo?: string
          numero_documento?: string | null
          obrigatorio?: boolean | null
          storage_path?: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          valor_documento?: number | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_documentos_documento_anterior_id_fkey"
            columns: ["documento_anterior_id"]
            isOneToOne: false
            referencedRelation: "fin_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_dotacoes: {
        Row: {
          acao_id: string | null
          ativo: boolean | null
          bloqueado: boolean | null
          classificacao_pcasp: string | null
          cod_acompanhamento: string | null
          codigo_dotacao: string
          conta_contabil_id: string | null
          created_at: string | null
          created_by: string | null
          exercicio: number
          fonte_recurso_id: string | null
          id: string
          idu: string | null
          motivo_bloqueio: string | null
          natureza_despesa_id: string | null
          paoe: string | null
          programa_id: string | null
          regional: string | null
          saldo_disponivel: number | null
          tro: string | null
          unidade_orcamentaria_id: string | null
          updated_at: string | null
          valor_atual: number | null
          valor_bloqueado: number | null
          valor_em_liquidacao: number | null
          valor_empenhado: number | null
          valor_inicial: number
          valor_liquidado: number | null
          valor_pago: number | null
          valor_ped: number | null
          valor_reduzido: number | null
          valor_reserva: number | null
          valor_restos_pagar: number | null
          valor_suplementado: number | null
        }
        Insert: {
          acao_id?: string | null
          ativo?: boolean | null
          bloqueado?: boolean | null
          classificacao_pcasp?: string | null
          cod_acompanhamento?: string | null
          codigo_dotacao: string
          conta_contabil_id?: string | null
          created_at?: string | null
          created_by?: string | null
          exercicio: number
          fonte_recurso_id?: string | null
          id?: string
          idu?: string | null
          motivo_bloqueio?: string | null
          natureza_despesa_id?: string | null
          paoe?: string | null
          programa_id?: string | null
          regional?: string | null
          saldo_disponivel?: number | null
          tro?: string | null
          unidade_orcamentaria_id?: string | null
          updated_at?: string | null
          valor_atual?: number | null
          valor_bloqueado?: number | null
          valor_em_liquidacao?: number | null
          valor_empenhado?: number | null
          valor_inicial?: number
          valor_liquidado?: number | null
          valor_pago?: number | null
          valor_ped?: number | null
          valor_reduzido?: number | null
          valor_reserva?: number | null
          valor_restos_pagar?: number | null
          valor_suplementado?: number | null
        }
        Update: {
          acao_id?: string | null
          ativo?: boolean | null
          bloqueado?: boolean | null
          classificacao_pcasp?: string | null
          cod_acompanhamento?: string | null
          codigo_dotacao?: string
          conta_contabil_id?: string | null
          created_at?: string | null
          created_by?: string | null
          exercicio?: number
          fonte_recurso_id?: string | null
          id?: string
          idu?: string | null
          motivo_bloqueio?: string | null
          natureza_despesa_id?: string | null
          paoe?: string | null
          programa_id?: string | null
          regional?: string | null
          saldo_disponivel?: number | null
          tro?: string | null
          unidade_orcamentaria_id?: string | null
          updated_at?: string | null
          valor_atual?: number | null
          valor_bloqueado?: number | null
          valor_em_liquidacao?: number | null
          valor_empenhado?: number | null
          valor_inicial?: number
          valor_liquidado?: number | null
          valor_pago?: number | null
          valor_ped?: number | null
          valor_reduzido?: number | null
          valor_reserva?: number | null
          valor_restos_pagar?: number | null
          valor_suplementado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_dotacoes_acao_id_fkey"
            columns: ["acao_id"]
            isOneToOne: false
            referencedRelation: "fin_acoes_orcamentarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_dotacoes_conta_contabil_id_fkey"
            columns: ["conta_contabil_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_dotacoes_fonte_recurso_id_fkey"
            columns: ["fonte_recurso_id"]
            isOneToOne: false
            referencedRelation: "fin_fontes_recurso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_dotacoes_natureza_despesa_id_fkey"
            columns: ["natureza_despesa_id"]
            isOneToOne: false
            referencedRelation: "fin_naturezas_despesa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_dotacoes_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "fin_programas_orcamentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_dotacoes_unidade_orcamentaria_id_fkey"
            columns: ["unidade_orcamentaria_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_empenho_anulacoes: {
        Row: {
          anulado_por: string | null
          created_at: string | null
          data_anulacao: string
          empenho_id: string
          id: string
          motivo: string
          numero: string
          valor: number
        }
        Insert: {
          anulado_por?: string | null
          created_at?: string | null
          data_anulacao?: string
          empenho_id: string
          id?: string
          motivo: string
          numero: string
          valor: number
        }
        Update: {
          anulado_por?: string | null
          created_at?: string | null
          data_anulacao?: string
          empenho_id?: string
          id?: string
          motivo?: string
          numero?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_empenho_anulacoes_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "fin_empenhos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_empenhos: {
        Row: {
          conta_contabil_credito_id: string | null
          conta_contabil_debito_id: string | null
          contrato_id: string | null
          created_at: string | null
          created_by: string | null
          data_empenho: string
          data_inscricao_rp: string | null
          dotacao_id: string
          emitido_por: string | null
          exercicio: number
          fonte_recurso_id: string | null
          fornecedor_id: string
          historico_status: Json | null
          id: string
          inscrito_rp: boolean | null
          natureza_despesa_id: string | null
          numero: string
          objeto: string
          observacoes: string | null
          processo_sei: string | null
          saldo_liquidar: number | null
          saldo_pagar: number | null
          solicitacao_id: string | null
          status: Database["public"]["Enums"]["status_empenho"] | null
          tipo: Database["public"]["Enums"]["tipo_empenho"]
          tipo_rp: string | null
          updated_at: string | null
          valor_anulado: number | null
          valor_empenhado: number
          valor_liquidado: number | null
          valor_pago: number | null
        }
        Insert: {
          conta_contabil_credito_id?: string | null
          conta_contabil_debito_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_empenho?: string
          data_inscricao_rp?: string | null
          dotacao_id: string
          emitido_por?: string | null
          exercicio: number
          fonte_recurso_id?: string | null
          fornecedor_id: string
          historico_status?: Json | null
          id?: string
          inscrito_rp?: boolean | null
          natureza_despesa_id?: string | null
          numero: string
          objeto: string
          observacoes?: string | null
          processo_sei?: string | null
          saldo_liquidar?: number | null
          saldo_pagar?: number | null
          solicitacao_id?: string | null
          status?: Database["public"]["Enums"]["status_empenho"] | null
          tipo?: Database["public"]["Enums"]["tipo_empenho"]
          tipo_rp?: string | null
          updated_at?: string | null
          valor_anulado?: number | null
          valor_empenhado: number
          valor_liquidado?: number | null
          valor_pago?: number | null
        }
        Update: {
          conta_contabil_credito_id?: string | null
          conta_contabil_debito_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_empenho?: string
          data_inscricao_rp?: string | null
          dotacao_id?: string
          emitido_por?: string | null
          exercicio?: number
          fonte_recurso_id?: string | null
          fornecedor_id?: string
          historico_status?: Json | null
          id?: string
          inscrito_rp?: boolean | null
          natureza_despesa_id?: string | null
          numero?: string
          objeto?: string
          observacoes?: string | null
          processo_sei?: string | null
          saldo_liquidar?: number | null
          saldo_pagar?: number | null
          solicitacao_id?: string | null
          status?: Database["public"]["Enums"]["status_empenho"] | null
          tipo?: Database["public"]["Enums"]["tipo_empenho"]
          tipo_rp?: string | null
          updated_at?: string | null
          valor_anulado?: number | null
          valor_empenhado?: number
          valor_liquidado?: number | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_empenhos_conta_contabil_credito_id_fkey"
            columns: ["conta_contabil_credito_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_empenhos_conta_contabil_debito_id_fkey"
            columns: ["conta_contabil_debito_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_empenhos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_empenhos_dotacao_id_fkey"
            columns: ["dotacao_id"]
            isOneToOne: false
            referencedRelation: "fin_dotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_empenhos_fonte_recurso_id_fkey"
            columns: ["fonte_recurso_id"]
            isOneToOne: false
            referencedRelation: "fin_fontes_recurso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_empenhos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_empenhos_natureza_despesa_id_fkey"
            columns: ["natureza_despesa_id"]
            isOneToOne: false
            referencedRelation: "fin_naturezas_despesa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_empenhos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "fin_solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_extrato_transacoes: {
        Row: {
          conciliado_em: string | null
          conciliado_por: string | null
          created_at: string | null
          data_balancete: string | null
          data_transacao: string
          documento: string | null
          extrato_id: string
          historico: string | null
          id: string
          justificativa_divergencia: string | null
          numero_sequencial: number | null
          pagamento_id: string | null
          receita_id: string | null
          status: Database["public"]["Enums"]["status_conciliacao"] | null
          tipo: string
          valor: number
        }
        Insert: {
          conciliado_em?: string | null
          conciliado_por?: string | null
          created_at?: string | null
          data_balancete?: string | null
          data_transacao: string
          documento?: string | null
          extrato_id: string
          historico?: string | null
          id?: string
          justificativa_divergencia?: string | null
          numero_sequencial?: number | null
          pagamento_id?: string | null
          receita_id?: string | null
          status?: Database["public"]["Enums"]["status_conciliacao"] | null
          tipo: string
          valor: number
        }
        Update: {
          conciliado_em?: string | null
          conciliado_por?: string | null
          created_at?: string | null
          data_balancete?: string | null
          data_transacao?: string
          documento?: string | null
          extrato_id?: string
          historico?: string | null
          id?: string
          justificativa_divergencia?: string | null
          numero_sequencial?: number | null
          pagamento_id?: string | null
          receita_id?: string | null
          status?: Database["public"]["Enums"]["status_conciliacao"] | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_extrato_transacoes_extrato_id_fkey"
            columns: ["extrato_id"]
            isOneToOne: false
            referencedRelation: "fin_extratos_bancarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_extrato_transacoes_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "fin_pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_extrato_transacoes_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "fin_receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_extratos_bancarios: {
        Row: {
          ano_referencia: number
          arquivo_original: string | null
          conciliado: boolean | null
          conciliado_em: string | null
          conciliado_por: string | null
          conta_bancaria_id: string
          created_at: string | null
          data_importacao: string | null
          id: string
          importado_por: string | null
          mes_referencia: number
          saldo_anterior: number | null
          saldo_final: number | null
          total_creditos: number | null
          total_debitos: number | null
        }
        Insert: {
          ano_referencia: number
          arquivo_original?: string | null
          conciliado?: boolean | null
          conciliado_em?: string | null
          conciliado_por?: string | null
          conta_bancaria_id: string
          created_at?: string | null
          data_importacao?: string | null
          id?: string
          importado_por?: string | null
          mes_referencia: number
          saldo_anterior?: number | null
          saldo_final?: number | null
          total_creditos?: number | null
          total_debitos?: number | null
        }
        Update: {
          ano_referencia?: number
          arquivo_original?: string | null
          conciliado?: boolean | null
          conciliado_em?: string | null
          conciliado_por?: string | null
          conta_bancaria_id?: string
          created_at?: string | null
          data_importacao?: string | null
          id?: string
          importado_por?: string | null
          mes_referencia?: number
          saldo_anterior?: number | null
          saldo_final?: number | null
          total_creditos?: number | null
          total_debitos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_extratos_bancarios_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "fin_contas_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_fechamentos: {
        Row: {
          created_at: string | null
          data_fechamento: string | null
          exercicio: number
          fechado_em: string | null
          fechado_por: string | null
          id: string
          mes: number
          motivo_reabertura: string | null
          observacoes: string | null
          reaberto_em: string | null
          reaberto_por: string | null
          resultado_mes: number | null
          status: string | null
          total_despesas: number | null
          total_receitas: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fechamento?: string | null
          exercicio: number
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          motivo_reabertura?: string | null
          observacoes?: string | null
          reaberto_em?: string | null
          reaberto_por?: string | null
          resultado_mes?: number | null
          status?: string | null
          total_despesas?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fechamento?: string | null
          exercicio?: number
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          motivo_reabertura?: string | null
          observacoes?: string | null
          reaberto_em?: string | null
          reaberto_por?: string | null
          resultado_mes?: number | null
          status?: string | null
          total_despesas?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fin_fontes_recurso: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          descricao: string | null
          detalhamento_fonte: string | null
          id: string
          nome: string
          origem: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          detalhamento_fonte?: string | null
          id?: string
          nome: string
          origem?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          detalhamento_fonte?: string | null
          id?: string
          nome?: string
          origem?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fin_lancamentos_contabeis: {
        Row: {
          complemento: string | null
          conta_credito_id: string
          conta_debito_id: string
          created_at: string | null
          created_by: string | null
          data_competencia: string
          data_lancamento: string
          estornado: boolean | null
          exercicio: number
          fechamento_id: string | null
          historico: string
          id: string
          lancamento_estorno_id: string | null
          mes_referencia: number
          numero: string
          origem_id: string | null
          tipo_origem: string
          valor: number
        }
        Insert: {
          complemento?: string | null
          conta_credito_id: string
          conta_debito_id: string
          created_at?: string | null
          created_by?: string | null
          data_competencia: string
          data_lancamento: string
          estornado?: boolean | null
          exercicio: number
          fechamento_id?: string | null
          historico: string
          id?: string
          lancamento_estorno_id?: string | null
          mes_referencia: number
          numero: string
          origem_id?: string | null
          tipo_origem: string
          valor: number
        }
        Update: {
          complemento?: string | null
          conta_credito_id?: string
          conta_debito_id?: string
          created_at?: string | null
          created_by?: string | null
          data_competencia?: string
          data_lancamento?: string
          estornado?: boolean | null
          exercicio?: number
          fechamento_id?: string | null
          historico?: string
          id?: string
          lancamento_estorno_id?: string | null
          mes_referencia?: number
          numero?: string
          origem_id?: string | null
          tipo_origem?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_lancamentos_contabeis_conta_credito_id_fkey"
            columns: ["conta_credito_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_contabeis_conta_debito_id_fkey"
            columns: ["conta_debito_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_liquidacoes: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          atestado_em: string | null
          atestado_por: string | null
          cargo_atestante: string | null
          chave_nfe: string | null
          conta_contabil_credito_id: string | null
          conta_contabil_debito_id: string | null
          created_at: string | null
          created_by: string | null
          data_documento: string
          data_liquidacao: string
          empenho_id: string
          exercicio: number
          historico_status: Json | null
          id: string
          motivo_rejeicao: string | null
          numero: string
          numero_documento: string
          observacoes: string | null
          outras_retencoes: number | null
          retencao_inss: number | null
          retencao_irrf: number | null
          retencao_iss: number | null
          serie_documento: string | null
          status: Database["public"]["Enums"]["status_liquidacao"] | null
          tipo_documento: string
          updated_at: string | null
          valor_documento: number
          valor_liquidado: number
          valor_liquido: number | null
          valor_retencoes: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          atestado_em?: string | null
          atestado_por?: string | null
          cargo_atestante?: string | null
          chave_nfe?: string | null
          conta_contabil_credito_id?: string | null
          conta_contabil_debito_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_documento: string
          data_liquidacao?: string
          empenho_id: string
          exercicio: number
          historico_status?: Json | null
          id?: string
          motivo_rejeicao?: string | null
          numero: string
          numero_documento: string
          observacoes?: string | null
          outras_retencoes?: number | null
          retencao_inss?: number | null
          retencao_irrf?: number | null
          retencao_iss?: number | null
          serie_documento?: string | null
          status?: Database["public"]["Enums"]["status_liquidacao"] | null
          tipo_documento: string
          updated_at?: string | null
          valor_documento: number
          valor_liquidado: number
          valor_liquido?: number | null
          valor_retencoes?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          atestado_em?: string | null
          atestado_por?: string | null
          cargo_atestante?: string | null
          chave_nfe?: string | null
          conta_contabil_credito_id?: string | null
          conta_contabil_debito_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_documento?: string
          data_liquidacao?: string
          empenho_id?: string
          exercicio?: number
          historico_status?: Json | null
          id?: string
          motivo_rejeicao?: string | null
          numero?: string
          numero_documento?: string
          observacoes?: string | null
          outras_retencoes?: number | null
          retencao_inss?: number | null
          retencao_irrf?: number | null
          retencao_iss?: number | null
          serie_documento?: string | null
          status?: Database["public"]["Enums"]["status_liquidacao"] | null
          tipo_documento?: string
          updated_at?: string | null
          valor_documento?: number
          valor_liquidado?: number
          valor_liquido?: number | null
          valor_retencoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_liquidacoes_conta_contabil_credito_id_fkey"
            columns: ["conta_contabil_credito_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_liquidacoes_conta_contabil_debito_id_fkey"
            columns: ["conta_contabil_debito_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_liquidacoes_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "fin_empenhos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_naturezas_despesa: {
        Row: {
          ativo: boolean | null
          categoria_economica: string | null
          codigo: string
          created_at: string | null
          descricao: string | null
          elemento: string | null
          grupo_natureza: string | null
          id: string
          modalidade_aplicacao: string | null
          nome: string
          subelemento: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_economica?: string | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          elemento?: string | null
          grupo_natureza?: string | null
          id?: string
          modalidade_aplicacao?: string | null
          nome: string
          subelemento?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria_economica?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          elemento?: string | null
          grupo_natureza?: string | null
          id?: string
          modalidade_aplicacao?: string | null
          nome?: string
          subelemento?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fin_pagamentos: {
        Row: {
          agencia_favorecido: string | null
          autorizado_em: string | null
          autorizado_por: string | null
          banco_favorecido: string | null
          conta_bancaria_id: string
          conta_contabil_credito_id: string | null
          conta_contabil_debito_id: string | null
          conta_favorecido: string | null
          created_at: string | null
          created_by: string | null
          data_efetivacao: string | null
          data_estorno: string | null
          data_pagamento: string
          empenho_id: string
          estornado: boolean | null
          estornado_por: string | null
          executado_em: string | null
          executado_por: string | null
          exercicio: number
          forma_pagamento: string
          fornecedor_id: string | null
          historico_status: Json | null
          id: string
          identificador_transacao: string | null
          liquidacao_id: string
          motivo_estorno: string | null
          numero: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          tipo_conta_favorecido: string | null
          updated_at: string | null
          valor_bruto: number
          valor_liquido: number | null
          valor_retencoes: number | null
        }
        Insert: {
          agencia_favorecido?: string | null
          autorizado_em?: string | null
          autorizado_por?: string | null
          banco_favorecido?: string | null
          conta_bancaria_id: string
          conta_contabil_credito_id?: string | null
          conta_contabil_debito_id?: string | null
          conta_favorecido?: string | null
          created_at?: string | null
          created_by?: string | null
          data_efetivacao?: string | null
          data_estorno?: string | null
          data_pagamento?: string
          empenho_id: string
          estornado?: boolean | null
          estornado_por?: string | null
          executado_em?: string | null
          executado_por?: string | null
          exercicio: number
          forma_pagamento: string
          fornecedor_id?: string | null
          historico_status?: Json | null
          id?: string
          identificador_transacao?: string | null
          liquidacao_id: string
          motivo_estorno?: string | null
          numero: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          tipo_conta_favorecido?: string | null
          updated_at?: string | null
          valor_bruto: number
          valor_liquido?: number | null
          valor_retencoes?: number | null
        }
        Update: {
          agencia_favorecido?: string | null
          autorizado_em?: string | null
          autorizado_por?: string | null
          banco_favorecido?: string | null
          conta_bancaria_id?: string
          conta_contabil_credito_id?: string | null
          conta_contabil_debito_id?: string | null
          conta_favorecido?: string | null
          created_at?: string | null
          created_by?: string | null
          data_efetivacao?: string | null
          data_estorno?: string | null
          data_pagamento?: string
          empenho_id?: string
          estornado?: boolean | null
          estornado_por?: string | null
          executado_em?: string | null
          executado_por?: string | null
          exercicio?: number
          forma_pagamento?: string
          fornecedor_id?: string | null
          historico_status?: Json | null
          id?: string
          identificador_transacao?: string | null
          liquidacao_id?: string
          motivo_estorno?: string | null
          numero?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          tipo_conta_favorecido?: string | null
          updated_at?: string | null
          valor_bruto?: number
          valor_liquido?: number | null
          valor_retencoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_pagamentos_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "fin_contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_pagamentos_conta_contabil_credito_id_fkey"
            columns: ["conta_contabil_credito_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_pagamentos_conta_contabil_debito_id_fkey"
            columns: ["conta_contabil_debito_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_pagamentos_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "fin_empenhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_pagamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_pagamentos_liquidacao_id_fkey"
            columns: ["liquidacao_id"]
            isOneToOne: false
            referencedRelation: "fin_liquidacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_parametros: {
        Row: {
          categoria: string | null
          chave: string
          created_at: string | null
          descricao: string | null
          editavel: boolean | null
          id: string
          tipo: string | null
          updated_at: string | null
          valor: string
        }
        Insert: {
          categoria?: string | null
          chave: string
          created_at?: string | null
          descricao?: string | null
          editavel?: boolean | null
          id?: string
          tipo?: string | null
          updated_at?: string | null
          valor: string
        }
        Update: {
          categoria?: string | null
          chave?: string
          created_at?: string | null
          descricao?: string | null
          editavel?: boolean | null
          id?: string
          tipo?: string | null
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      fin_plano_contas: {
        Row: {
          aceita_lancamento: boolean | null
          ativo: boolean | null
          codigo: string
          conta_pai_id: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          natureza: Database["public"]["Enums"]["natureza_conta"]
          nivel: number
          nome: string
          updated_at: string | null
        }
        Insert: {
          aceita_lancamento?: boolean | null
          ativo?: boolean | null
          codigo: string
          conta_pai_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          natureza: Database["public"]["Enums"]["natureza_conta"]
          nivel?: number
          nome: string
          updated_at?: string | null
        }
        Update: {
          aceita_lancamento?: boolean | null
          ativo?: boolean | null
          codigo?: string
          conta_pai_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          natureza?: Database["public"]["Enums"]["natureza_conta"]
          nivel?: number
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_plano_contas_conta_pai_id_fkey"
            columns: ["conta_pai_id"]
            isOneToOne: false
            referencedRelation: "fin_plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_programas_orcamentarios: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          exercicio: number
          id: string
          nome: string
          objetivo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          exercicio: number
          id?: string
          nome: string
          objetivo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          exercicio?: number
          id?: string
          nome?: string
          objetivo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fin_receitas: {
        Row: {
          cnpj_cpf_pagador: string | null
          conciliacao_id: string | null
          conciliado: boolean | null
          conta_bancaria_id: string | null
          convenio_id: string | null
          created_at: string | null
          created_by: string | null
          data_receita: string
          documento_origem: string | null
          entidade_pagadora: string | null
          exercicio: number
          fonte_recurso_id: string | null
          id: string
          numero: string
          observacoes: string | null
          origem_descricao: string
          tipo: Database["public"]["Enums"]["tipo_receita"]
          updated_at: string | null
          valor: number
        }
        Insert: {
          cnpj_cpf_pagador?: string | null
          conciliacao_id?: string | null
          conciliado?: boolean | null
          conta_bancaria_id?: string | null
          convenio_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_receita?: string
          documento_origem?: string | null
          entidade_pagadora?: string | null
          exercicio: number
          fonte_recurso_id?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          origem_descricao: string
          tipo: Database["public"]["Enums"]["tipo_receita"]
          updated_at?: string | null
          valor: number
        }
        Update: {
          cnpj_cpf_pagador?: string | null
          conciliacao_id?: string | null
          conciliado?: boolean | null
          conta_bancaria_id?: string | null
          convenio_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_receita?: string
          documento_origem?: string | null
          entidade_pagadora?: string | null
          exercicio?: number
          fonte_recurso_id?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          origem_descricao?: string
          tipo?: Database["public"]["Enums"]["tipo_receita"]
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_receitas_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "fin_contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_receitas_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_receitas_fonte_recurso_id_fkey"
            columns: ["fonte_recurso_id"]
            isOneToOne: false
            referencedRelation: "fin_fontes_recurso"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_restos_pagar: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_cancelamento: string | null
          data_inscricao: string
          data_prescricao: string | null
          empenho_id: string
          exercicio_inscricao: number
          exercicio_origem: number
          id: string
          motivo_cancelamento: string | null
          observacoes: string | null
          saldo: number | null
          status: string
          tipo: string
          updated_at: string | null
          valor_cancelado: number
          valor_inscrito: number
          valor_liquidado: number
          valor_pago: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_cancelamento?: string | null
          data_inscricao?: string
          data_prescricao?: string | null
          empenho_id: string
          exercicio_inscricao: number
          exercicio_origem: number
          id?: string
          motivo_cancelamento?: string | null
          observacoes?: string | null
          saldo?: number | null
          status?: string
          tipo: string
          updated_at?: string | null
          valor_cancelado?: number
          valor_inscrito: number
          valor_liquidado?: number
          valor_pago?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_cancelamento?: string | null
          data_inscricao?: string
          data_prescricao?: string | null
          empenho_id?: string
          exercicio_inscricao?: number
          exercicio_origem?: number
          id?: string
          motivo_cancelamento?: string | null
          observacoes?: string | null
          saldo?: number | null
          status?: string
          tipo?: string
          updated_at?: string | null
          valor_cancelado?: number
          valor_inscrito?: number
          valor_liquidado?: number
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_restos_pagar_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "fin_empenhos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_solicitacao_itens: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          item_numero: number
          observacoes: string | null
          quantidade: number
          solicitacao_id: string
          unidade: string | null
          valor_total_estimado: number | null
          valor_unitario_estimado: number | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          item_numero: number
          observacoes?: string | null
          quantidade?: number
          solicitacao_id: string
          unidade?: string | null
          valor_total_estimado?: number | null
          valor_unitario_estimado?: number | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          item_numero?: number
          observacoes?: string | null
          quantidade?: number
          solicitacao_id?: string
          unidade?: string | null
          valor_total_estimado?: number | null
          valor_unitario_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_solicitacao_itens_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "fin_solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_solicitacoes: {
        Row: {
          autorizado_em: string | null
          autorizado_por: string | null
          ci_aprovado_em: string | null
          ci_aprovado_por: string | null
          contrato_id: string | null
          created_at: string | null
          created_by: string | null
          data_solicitacao: string
          dotacao_sugerida_id: string | null
          exercicio: number
          fornecedor_id: string | null
          historico_status: Json | null
          id: string
          justificativa: string
          motivo_rejeicao: string | null
          numero: string
          objeto: string
          observacoes: string | null
          parecer_ci: string | null
          prazo_execucao: string | null
          prioridade: string | null
          processo_licitatorio_id: string | null
          ressalvas_ci: string | null
          servidor_solicitante_id: string | null
          status:
            | Database["public"]["Enums"]["status_workflow_financeiro"]
            | null
          tipo_despesa: string
          unidade_solicitante_id: string
          updated_at: string | null
          valor_estimado: number
        }
        Insert: {
          autorizado_em?: string | null
          autorizado_por?: string | null
          ci_aprovado_em?: string | null
          ci_aprovado_por?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_solicitacao?: string
          dotacao_sugerida_id?: string | null
          exercicio: number
          fornecedor_id?: string | null
          historico_status?: Json | null
          id?: string
          justificativa: string
          motivo_rejeicao?: string | null
          numero: string
          objeto: string
          observacoes?: string | null
          parecer_ci?: string | null
          prazo_execucao?: string | null
          prioridade?: string | null
          processo_licitatorio_id?: string | null
          ressalvas_ci?: string | null
          servidor_solicitante_id?: string | null
          status?:
            | Database["public"]["Enums"]["status_workflow_financeiro"]
            | null
          tipo_despesa: string
          unidade_solicitante_id: string
          updated_at?: string | null
          valor_estimado: number
        }
        Update: {
          autorizado_em?: string | null
          autorizado_por?: string | null
          ci_aprovado_em?: string | null
          ci_aprovado_por?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_solicitacao?: string
          dotacao_sugerida_id?: string | null
          exercicio?: number
          fornecedor_id?: string | null
          historico_status?: Json | null
          id?: string
          justificativa?: string
          motivo_rejeicao?: string | null
          numero?: string
          objeto?: string
          observacoes?: string | null
          parecer_ci?: string | null
          prazo_execucao?: string | null
          prioridade?: string | null
          processo_licitatorio_id?: string | null
          ressalvas_ci?: string | null
          servidor_solicitante_id?: string | null
          status?:
            | Database["public"]["Enums"]["status_workflow_financeiro"]
            | null
          tipo_despesa?: string
          unidade_solicitante_id?: string
          updated_at?: string | null
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_solicitacoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_solicitacoes_dotacao_sugerida_id_fkey"
            columns: ["dotacao_sugerida_id"]
            isOneToOne: false
            referencedRelation: "fin_dotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_solicitacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_solicitacoes_processo_licitatorio_id_fkey"
            columns: ["processo_licitatorio_id"]
            isOneToOne: false
            referencedRelation: "processos_licitatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_solicitacoes_servidor_solicitante_id_fkey"
            columns: ["servidor_solicitante_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_solicitacoes_servidor_solicitante_id_fkey"
            columns: ["servidor_solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "fin_solicitacoes_servidor_solicitante_id_fkey"
            columns: ["servidor_solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_solicitacoes_servidor_solicitante_id_fkey"
            columns: ["servidor_solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_solicitacoes_unidade_solicitante_id_fkey"
            columns: ["unidade_solicitante_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_sub_empenhos: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_registro: string
          documento_referencia: string | null
          empenho_id: string
          id: string
          justificativa: string
          numero: string
          observacoes: string | null
          status: string
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_registro?: string
          documento_referencia?: string | null
          empenho_id: string
          id?: string
          justificativa: string
          numero: string
          observacoes?: string | null
          status?: string
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_registro?: string
          documento_referencia?: string | null
          empenho_id?: string
          id?: string
          justificativa?: string
          numero?: string
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_sub_empenhos_empenho_id_fkey"
            columns: ["empenho_id"]
            isOneToOne: false
            referencedRelation: "fin_empenhos"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_historico_status: {
        Row: {
          created_at: string | null
          folha_id: string
          id: string
          ip_address: unknown
          justificativa: string | null
          status_anterior: string | null
          status_novo: string
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          created_at?: string | null
          folha_id: string
          id?: string
          ip_address?: unknown
          justificativa?: string | null
          status_anterior?: string | null
          status_novo: string
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          created_at?: string | null
          folha_id?: string
          id?: string
          ip_address?: unknown
          justificativa?: string | null
          status_anterior?: string | null
          status_novo?: string
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folha_historico_status_folha_id_fkey"
            columns: ["folha_id"]
            isOneToOne: false
            referencedRelation: "folhas_pagamento"
            referencedColumns: ["id"]
          },
        ]
      }
      folhas_pagamento: {
        Row: {
          competencia_ano: number
          competencia_mes: number
          conferido_em: string | null
          conferido_por: string | null
          created_at: string | null
          created_by: string | null
          data_fechamento: string | null
          data_processamento: string | null
          fechado_em: string | null
          fechado_por: string | null
          hash_fechamento: string | null
          id: string
          justificativa_fechamento: string | null
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
          conferido_em?: string | null
          conferido_por?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fechamento?: string | null
          data_processamento?: string | null
          fechado_em?: string | null
          fechado_por?: string | null
          hash_fechamento?: string | null
          id?: string
          justificativa_fechamento?: string | null
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
          conferido_em?: string | null
          conferido_por?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fechamento?: string | null
          data_processamento?: string | null
          fechado_em?: string | null
          fechado_por?: string | null
          hash_fechamento?: string | null
          id?: string
          justificativa_fechamento?: string | null
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
            foreignKeyName: "folhas_pagamento_fechado_por_fkey"
            columns: ["fechado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "folhas_pagamento_reaberto_por_fkey"
            columns: ["reaberto_por"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "frequencia_arquivos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "frequencia_fechamento_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "frequencia_mensal_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      galeria_eventos_esportivos: {
        Row: {
          created_at: string
          created_by: string | null
          data_evento: string | null
          descricao: string | null
          destaque: boolean | null
          evento: string
          foto_thumbnail_url: string | null
          foto_url: string
          fotografo: string | null
          id: string
          modalidade: string | null
          naipe: string | null
          ordem: number | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_evento?: string | null
          descricao?: string | null
          destaque?: boolean | null
          evento?: string
          foto_thumbnail_url?: string | null
          foto_url: string
          fotografo?: string | null
          id?: string
          modalidade?: string | null
          naipe?: string | null
          ordem?: number | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_evento?: string | null
          descricao?: string | null
          destaque?: boolean | null
          evento?: string
          foto_thumbnail_url?: string | null
          foto_url?: string
          fotografo?: string | null
          id?: string
          modalidade?: string | null
          naipe?: string | null
          ordem?: number | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      gestores_escolares: {
        Row: {
          acesso_testado: boolean
          celular: string
          contato_realizado: boolean
          cpf: string
          created_at: string
          data_cadastro_cbde: string | null
          data_confirmacao: string | null
          data_contato: string | null
          data_nascimento: string | null
          email: string
          endereco: string | null
          escola_id: string
          id: string
          nome: string
          observacoes: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          rg: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acesso_testado?: boolean
          celular: string
          contato_realizado?: boolean
          cpf: string
          created_at?: string
          data_cadastro_cbde?: string | null
          data_confirmacao?: string | null
          data_contato?: string | null
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          escola_id: string
          id?: string
          nome: string
          observacoes?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          rg?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acesso_testado?: boolean
          celular?: string
          contato_realizado?: boolean
          cpf?: string
          created_at?: string
          data_cadastro_cbde?: string | null
          data_confirmacao?: string | null
          data_contato?: string | null
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          escola_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          rg?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gestores_escolares_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: true
            referencedRelation: "escolas_jer"
            referencedColumns: ["id"]
          },
        ]
      }
      gestores_escolares_historico: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          gestor_id: string
          id: string
          ip_address: unknown
          status_anterior: string | null
          status_novo: string
          usuario_email: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          gestor_id: string
          id?: string
          ip_address?: unknown
          status_anterior?: string | null
          status_novo: string
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          gestor_id?: string
          id?: string
          ip_address?: unknown
          status_anterior?: string | null
          status_novo?: string
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestores_escolares_historico_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores_escolares"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "historico_funcional_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      historico_patrimonio: {
        Row: {
          baixa_id: string | null
          bem_id: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          data_evento: string
          documento_url: string | null
          estado_conservacao: string | null
          id: string
          ip_address: unknown
          justificativa: string | null
          localizacao_especifica: string | null
          manutencao_id: string | null
          movimentacao_id: string | null
          responsavel_id: string | null
          tipo_evento: string
          unidade_local_id: string | null
          usuario_id: string | null
          valor_aquisicao: number | null
        }
        Insert: {
          baixa_id?: string | null
          bem_id: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_evento?: string
          documento_url?: string | null
          estado_conservacao?: string | null
          id?: string
          ip_address?: unknown
          justificativa?: string | null
          localizacao_especifica?: string | null
          manutencao_id?: string | null
          movimentacao_id?: string | null
          responsavel_id?: string | null
          tipo_evento: string
          unidade_local_id?: string | null
          usuario_id?: string | null
          valor_aquisicao?: number | null
        }
        Update: {
          baixa_id?: string | null
          bem_id?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_evento?: string
          documento_url?: string | null
          estado_conservacao?: string | null
          id?: string
          ip_address?: unknown
          justificativa?: string | null
          localizacao_especifica?: string | null
          manutencao_id?: string | null
          movimentacao_id?: string | null
          responsavel_id?: string | null
          tipo_evento?: string
          unidade_local_id?: string | null
          usuario_id?: string | null
          valor_aquisicao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_patrimonio_baixa_id_fkey"
            columns: ["baixa_id"]
            isOneToOne: false
            referencedRelation: "baixas_patrimonio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
          },
          {
            foreignKeyName: "historico_patrimonio_manutencao_id_fkey"
            columns: ["manutencao_id"]
            isOneToOne: false
            referencedRelation: "manutencoes_patrimonio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_patrimonio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "historico_patrimonio_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
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
      instituicoes: {
        Row: {
          area_atuacao: string[] | null
          ativo: boolean
          ato_constituicao: string | null
          ato_documento_url: string | null
          cnpj: string | null
          codigo_instituicao: string | null
          created_at: string
          created_by: string | null
          data_fundacao: string | null
          data_validacao: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          esfera_governo: Database["public"]["Enums"]["esfera_governo"] | null
          id: string
          inscricao_estadual: string | null
          nome_fantasia: string | null
          nome_razao_social: string
          observacoes: string | null
          orgao_vinculado: string | null
          responsavel_cargo: string | null
          responsavel_cpf: string | null
          responsavel_data_nascimento: string | null
          responsavel_email: string | null
          responsavel_nome: string
          responsavel_telefone: string | null
          site: string | null
          status: Database["public"]["Enums"]["status_instituicao"]
          telefone: string | null
          tipo_instituicao: Database["public"]["Enums"]["tipo_instituicao"]
          updated_at: string
          updated_by: string | null
          validado_por: string | null
        }
        Insert: {
          area_atuacao?: string[] | null
          ativo?: boolean
          ato_constituicao?: string | null
          ato_documento_url?: string | null
          cnpj?: string | null
          codigo_instituicao?: string | null
          created_at?: string
          created_by?: string | null
          data_fundacao?: string | null
          data_validacao?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          esfera_governo?: Database["public"]["Enums"]["esfera_governo"] | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          nome_razao_social: string
          observacoes?: string | null
          orgao_vinculado?: string | null
          responsavel_cargo?: string | null
          responsavel_cpf?: string | null
          responsavel_data_nascimento?: string | null
          responsavel_email?: string | null
          responsavel_nome: string
          responsavel_telefone?: string | null
          site?: string | null
          status?: Database["public"]["Enums"]["status_instituicao"]
          telefone?: string | null
          tipo_instituicao: Database["public"]["Enums"]["tipo_instituicao"]
          updated_at?: string
          updated_by?: string | null
          validado_por?: string | null
        }
        Update: {
          area_atuacao?: string[] | null
          ativo?: boolean
          ato_constituicao?: string | null
          ato_documento_url?: string | null
          cnpj?: string | null
          codigo_instituicao?: string | null
          created_at?: string
          created_by?: string | null
          data_fundacao?: string | null
          data_validacao?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          esfera_governo?: Database["public"]["Enums"]["esfera_governo"] | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          nome_razao_social?: string
          observacoes?: string | null
          orgao_vinculado?: string | null
          responsavel_cargo?: string | null
          responsavel_cpf?: string | null
          responsavel_data_nascimento?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string
          responsavel_telefone?: string | null
          site?: string | null
          status?: Database["public"]["Enums"]["status_instituicao"]
          telefone?: string | null
          tipo_instituicao?: Database["public"]["Enums"]["tipo_instituicao"]
          updated_at?: string
          updated_by?: string | null
          validado_por?: string | null
        }
        Relationships: []
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
          codigo_sku: string | null
          created_at: string | null
          descricao: string
          especificacao: string | null
          estoque_maximo: number | null
          estoque_minimo: number | null
          id: string
          lote: string | null
          ponto_reposicao: number | null
          ultimo_valor_compra: number | null
          unidade_medida: string
          updated_at: string | null
          validade: string | null
          valor_unitario_medio: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          codigo: string
          codigo_sku?: string | null
          created_at?: string | null
          descricao: string
          especificacao?: string | null
          estoque_maximo?: number | null
          estoque_minimo?: number | null
          id?: string
          lote?: string | null
          ponto_reposicao?: number | null
          ultimo_valor_compra?: number | null
          unidade_medida: string
          updated_at?: string | null
          validade?: string | null
          valor_unitario_medio?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          codigo?: string
          codigo_sku?: string | null
          created_at?: string | null
          descricao?: string
          especificacao?: string | null
          estoque_maximo?: number | null
          estoque_minimo?: number | null
          id?: string
          lote?: string | null
          ponto_reposicao?: number | null
          ultimo_valor_compra?: number | null
          unidade_medida?: string
          updated_at?: string | null
          validade?: string | null
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "itens_retorno_bancario_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "licencas_afastamentos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "liquidacoes_atestado_por_fkey"
            columns: ["atestado_por"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "lotacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      manutencoes_patrimonio: {
        Row: {
          bem_id: string
          created_at: string | null
          created_by: string | null
          custo_estimado: number | null
          custo_final: number | null
          data_abertura: string
          data_conclusao: string | null
          data_inicio: string | null
          descricao_problema: string
          fornecedor_externo: string | null
          fornecedor_id: string | null
          fotos_urls: Json | null
          id: string
          laudo_url: string | null
          nota_fiscal_url: string | null
          observacoes: string | null
          status: string | null
          tipo: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at: string | null
        }
        Insert: {
          bem_id: string
          created_at?: string | null
          created_by?: string | null
          custo_estimado?: number | null
          custo_final?: number | null
          data_abertura?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao_problema: string
          fornecedor_externo?: string | null
          fornecedor_id?: string | null
          fotos_urls?: Json | null
          id?: string
          laudo_url?: string | null
          nota_fiscal_url?: string | null
          observacoes?: string | null
          status?: string | null
          tipo: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at?: string | null
        }
        Update: {
          bem_id?: string
          created_at?: string | null
          created_by?: string | null
          custo_estimado?: number | null
          custo_final?: number | null
          data_abertura?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao_problema?: string
          fornecedor_externo?: string | null
          fornecedor_id?: string | null
          fotos_urls?: Json | null
          id?: string
          laudo_url?: string | null
          nota_fiscal_url?: string | null
          observacoes?: string | null
          status?: string | null
          tipo?: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
          },
          {
            foreignKeyName: "manutencoes_patrimonio_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "medicoes_contrato_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
        }
        Relationships: []
      }
      module_permissions_catalog: {
        Row: {
          action_type: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          label: string
          module_code: string
          permission_code: string
          sort_order: number | null
        }
        Insert: {
          action_type?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          module_code: string
          permission_code: string
          sort_order?: number | null
        }
        Update: {
          action_type?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          module_code?: string
          permission_code?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      module_settings: {
        Row: {
          description: string | null
          display_name: string | null
          enabled: boolean
          features: Json | null
          id: string
          module_code: string
          settings: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          display_name?: string | null
          enabled?: boolean
          features?: Json | null
          id?: string
          module_code: string
          settings?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          display_name?: string | null
          enabled?: boolean
          features?: Json | null
          id?: string
          module_code?: string
          settings?: Json | null
          updated_at?: string
          updated_by?: string | null
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
            foreignKeyName: "movimentacoes_bem_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "movimentacoes_bem_responsavel_destino_id_fkey"
            columns: ["responsavel_destino_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "movimentacoes_bem_responsavel_origem_id_fkey"
            columns: ["responsavel_origem_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      movimentacoes_patrimonio: {
        Row: {
          aceite_responsavel: boolean | null
          aprovado_por: string | null
          bem_id: string
          created_at: string | null
          created_by: string | null
          dados_snapshot: Json | null
          data_aceite: string | null
          data_aprovacao: string | null
          data_movimentacao: string
          data_solicitacao: string | null
          documento_url: string | null
          id: string
          motivo: string
          motivo_rejeicao: string | null
          observacoes: string | null
          responsavel_destino_id: string | null
          responsavel_origem_id: string | null
          sala_destino: string | null
          sala_origem: string | null
          setor_destino: string | null
          setor_origem: string | null
          solicitado_por: string | null
          status:
            | Database["public"]["Enums"]["status_movimentacao_patrimonio"]
            | null
          termo_transferencia_url: string | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao_patrimonio"]
          unidade_destino_id: string | null
          unidade_local_destino_id: string | null
          unidade_local_origem_id: string | null
          unidade_origem_id: string | null
          updated_at: string | null
        }
        Insert: {
          aceite_responsavel?: boolean | null
          aprovado_por?: string | null
          bem_id: string
          created_at?: string | null
          created_by?: string | null
          dados_snapshot?: Json | null
          data_aceite?: string | null
          data_aprovacao?: string | null
          data_movimentacao?: string
          data_solicitacao?: string | null
          documento_url?: string | null
          id?: string
          motivo: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          responsavel_destino_id?: string | null
          responsavel_origem_id?: string | null
          sala_destino?: string | null
          sala_origem?: string | null
          setor_destino?: string | null
          setor_origem?: string | null
          solicitado_por?: string | null
          status?:
            | Database["public"]["Enums"]["status_movimentacao_patrimonio"]
            | null
          termo_transferencia_url?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao_patrimonio"]
          unidade_destino_id?: string | null
          unidade_local_destino_id?: string | null
          unidade_local_origem_id?: string | null
          unidade_origem_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aceite_responsavel?: boolean | null
          aprovado_por?: string | null
          bem_id?: string
          created_at?: string | null
          created_by?: string | null
          dados_snapshot?: Json | null
          data_aceite?: string | null
          data_aprovacao?: string | null
          data_movimentacao?: string
          data_solicitacao?: string | null
          documento_url?: string | null
          id?: string
          motivo?: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          responsavel_destino_id?: string | null
          responsavel_origem_id?: string | null
          sala_destino?: string | null
          sala_origem?: string | null
          setor_destino?: string | null
          setor_origem?: string | null
          solicitado_por?: string | null
          status?:
            | Database["public"]["Enums"]["status_movimentacao_patrimonio"]
            | null
          termo_transferencia_url?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimentacao_patrimonio"]
          unidade_destino_id?: string | null
          unidade_local_destino_id?: string | null
          unidade_local_origem_id?: string | null
          unidade_origem_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_responsavel_destino_id_fkey"
            columns: ["responsavel_destino_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_responsavel_destino_id_fkey"
            columns: ["responsavel_destino_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_responsavel_destino_id_fkey"
            columns: ["responsavel_destino_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_responsavel_destino_id_fkey"
            columns: ["responsavel_destino_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_responsavel_origem_id_fkey"
            columns: ["responsavel_origem_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_responsavel_origem_id_fkey"
            columns: ["responsavel_origem_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_responsavel_origem_id_fkey"
            columns: ["responsavel_origem_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_responsavel_origem_id_fkey"
            columns: ["responsavel_origem_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_destino_id_fkey"
            columns: ["unidade_destino_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_destino_id_fkey"
            columns: ["unidade_local_destino_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "v_cedencias_a_vencer"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_patrimonio"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_unidades_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_local_origem_id_fkey"
            columns: ["unidade_local_origem_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_uso_unidades"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "movimentacoes_patrimonio_unidade_origem_id_fkey"
            columns: ["unidade_origem_id"]
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_servidor_destino_id_fkey"
            columns: ["servidor_destino_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_servidor_origem_id_fkey"
            columns: ["servidor_origem_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
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
      noticias_eventos_esportivos: {
        Row: {
          autor_id: string | null
          autor_nome: string | null
          categoria: string
          conteudo: string
          created_at: string
          data_publicacao: string | null
          destaque: boolean | null
          evento_relacionado: string | null
          id: string
          imagem_destaque_alt: string | null
          imagem_destaque_url: string | null
          resumo: string | null
          slug: string
          status: string
          subtitulo: string | null
          tags: string[] | null
          titulo: string
          updated_at: string
          visualizacoes: number | null
        }
        Insert: {
          autor_id?: string | null
          autor_nome?: string | null
          categoria?: string
          conteudo: string
          created_at?: string
          data_publicacao?: string | null
          destaque?: boolean | null
          evento_relacionado?: string | null
          id?: string
          imagem_destaque_alt?: string | null
          imagem_destaque_url?: string | null
          resumo?: string | null
          slug: string
          status?: string
          subtitulo?: string | null
          tags?: string[] | null
          titulo: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Update: {
          autor_id?: string | null
          autor_nome?: string | null
          categoria?: string
          conteudo?: string
          created_at?: string
          data_publicacao?: string | null
          destaque?: boolean | null
          evento_relacionado?: string | null
          id?: string
          imagem_destaque_alt?: string | null
          imagem_destaque_url?: string | null
          resumo?: string | null
          slug?: string
          status?: string
          subtitulo?: string | null
          tags?: string[] | null
          titulo?: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Relationships: []
      }
      ocorrencias_patrimonio: {
        Row: {
          anexos_urls: Json | null
          bem_id: string
          created_at: string | null
          created_by: string | null
          data_fato: string
          encaminhamento: string | null
          id: string
          providencias_adotadas: string | null
          relato_detalhado: string
          responsavel_relato_id: string | null
          tipo: Database["public"]["Enums"]["tipo_ocorrencia_patrimonio"]
          updated_at: string | null
        }
        Insert: {
          anexos_urls?: Json | null
          bem_id: string
          created_at?: string | null
          created_by?: string | null
          data_fato: string
          encaminhamento?: string | null
          id?: string
          providencias_adotadas?: string | null
          relato_detalhado: string
          responsavel_relato_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_ocorrencia_patrimonio"]
          updated_at?: string | null
        }
        Update: {
          anexos_urls?: Json | null
          bem_id?: string
          created_at?: string | null
          created_by?: string | null
          data_fato?: string
          encaminhamento?: string | null
          id?: string
          providencias_adotadas?: string | null
          relato_detalhado?: string
          responsavel_relato_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_ocorrencia_patrimonio"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
          },
          {
            foreignKeyName: "ocorrencias_patrimonio_responsavel_relato_id_fkey"
            columns: ["responsavel_relato_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_patrimonio_responsavel_relato_id_fkey"
            columns: ["responsavel_relato_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "ocorrencias_patrimonio_responsavel_relato_id_fkey"
            columns: ["responsavel_relato_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_patrimonio_responsavel_relato_id_fkey"
            columns: ["responsavel_relato_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "ocorrencias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            foreignKeyName: "parametros_folha_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "pareceres_tecnicos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "participantes_reuniao_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "patrimonio_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "patrimonio_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "patrimonio_unidade_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "pensoes_alimenticias_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            foreignKeyName: "perfil_permissoes_permissao_id_fkey"
            columns: ["permissao_id"]
            isOneToOne: false
            referencedRelation: "permissoes"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "planos_tratamento_risco_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      portal_diretoria: {
        Row: {
          ativo: boolean | null
          bio: string | null
          cargo: string
          created_at: string | null
          data_posse: string | null
          decreto_nomeacao: string | null
          email: string | null
          foto_url: string | null
          id: string
          linkedin_url: string | null
          nome: string
          ordem_exibicao: number | null
          telefone: string | null
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bio?: string | null
          cargo: string
          created_at?: string | null
          data_posse?: string | null
          decreto_nomeacao?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          linkedin_url?: string | null
          nome: string
          ordem_exibicao?: number | null
          telefone?: string | null
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bio?: string | null
          cargo?: string
          created_at?: string | null
          data_posse?: string | null
          decreto_nomeacao?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          linkedin_url?: string | null
          nome?: string
          ordem_exibicao?: number | null
          telefone?: string | null
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "portarias_servidor_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "prazos_processo_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
          acumula_cargo: boolean | null
          acumulo_descricao: string | null
          ano_conclusao: number | null
          ano_fim_primeiro_emprego: number | null
          ano_inicio_primeiro_emprego: number | null
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
          contato_emergencia_nome: string | null
          contato_emergencia_parentesco: string | null
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
          estrangeiro_ano_chegada: number | null
          estrangeiro_data_chegada: string | null
          estrangeiro_data_limite_permanencia: string | null
          estrangeiro_registro_nacional: string | null
          experiencia_resumo: string | null
          formacao_academica: string | null
          foto_url: string | null
          habilidades: string[] | null
          id: string
          idiomas: Json | null
          indicacao: string | null
          instituicao_ensino: string | null
          ip_envio: string | null
          molestia_grave: boolean | null
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
          telefone_emergencia: string | null
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
          acumula_cargo?: boolean | null
          acumulo_descricao?: string | null
          ano_conclusao?: number | null
          ano_fim_primeiro_emprego?: number | null
          ano_inicio_primeiro_emprego?: number | null
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
          contato_emergencia_nome?: string | null
          contato_emergencia_parentesco?: string | null
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
          estrangeiro_ano_chegada?: number | null
          estrangeiro_data_chegada?: string | null
          estrangeiro_data_limite_permanencia?: string | null
          estrangeiro_registro_nacional?: string | null
          experiencia_resumo?: string | null
          formacao_academica?: string | null
          foto_url?: string | null
          habilidades?: string[] | null
          id?: string
          idiomas?: Json | null
          indicacao?: string | null
          instituicao_ensino?: string | null
          ip_envio?: string | null
          molestia_grave?: boolean | null
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
          telefone_emergencia?: string | null
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
          acumula_cargo?: boolean | null
          acumulo_descricao?: string | null
          ano_conclusao?: number | null
          ano_fim_primeiro_emprego?: number | null
          ano_inicio_primeiro_emprego?: number | null
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
          contato_emergencia_nome?: string | null
          contato_emergencia_parentesco?: string | null
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
          estrangeiro_ano_chegada?: number | null
          estrangeiro_data_chegada?: string | null
          estrangeiro_data_limite_permanencia?: string | null
          estrangeiro_registro_nacional?: string | null
          experiencia_resumo?: string | null
          formacao_academica?: string | null
          foto_url?: string | null
          habilidades?: string[] | null
          id?: string
          idiomas?: Json | null
          indicacao?: string | null
          instituicao_ensino?: string | null
          ip_envio?: string | null
          molestia_grave?: boolean | null
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
          telefone_emergencia?: string | null
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "pre_cadastros_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "processos_licitatorios_pregoeiro_id_fkey"
            columns: ["pregoeiro_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "processos_licitatorios_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
          restringir_modulos: boolean | null
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
          restringir_modulos?: boolean | null
          servidor_id?: string | null
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
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
          restringir_modulos?: boolean | null
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "profiles_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "programas_servidor_responsavel_id_fkey"
            columns: ["servidor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "provimentos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "publicacoes_lai_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
          instituicao_id: string | null
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
          instituicao_id?: string | null
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
          instituicao_id?: string | null
          nome?: string
          padrao_escala?: string | null
          permite_ponto_remoto?: boolean | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regimes_trabalho_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "registros_ponto_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
        ]
      }
      requisicao_itens: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          observacoes: string | null
          quantidade_atendida: number | null
          quantidade_solicitada: number
          requisicao_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          observacoes?: string | null
          quantidade_atendida?: number | null
          quantidade_solicitada: number
          requisicao_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          observacoes?: string | null
          quantidade_atendida?: number | null
          quantidade_solicitada?: number
          requisicao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisicao_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_material"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicao_itens_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "requisicoes_material"
            referencedColumns: ["id"]
          },
        ]
      }
      requisicoes_material: {
        Row: {
          almoxarifado_id: string | null
          anexos_urls: Json | null
          assinatura_eletronica_aceite: string | null
          created_at: string | null
          created_by: string | null
          data_entrega: string | null
          data_solicitacao: string
          finalidade: string | null
          id: string
          numero: string
          observacoes: string | null
          responsavel_entrega_id: string | null
          setor_solicitante_id: string | null
          solicitante_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          almoxarifado_id?: string | null
          anexos_urls?: Json | null
          assinatura_eletronica_aceite?: string | null
          created_at?: string | null
          created_by?: string | null
          data_entrega?: string | null
          data_solicitacao?: string
          finalidade?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          responsavel_entrega_id?: string | null
          setor_solicitante_id?: string | null
          solicitante_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          almoxarifado_id?: string | null
          anexos_urls?: Json | null
          assinatura_eletronica_aceite?: string | null
          created_at?: string | null
          created_by?: string | null
          data_entrega?: string | null
          data_solicitacao?: string
          finalidade?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          responsavel_entrega_id?: string | null
          setor_solicitante_id?: string | null
          solicitante_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisicoes_material_almoxarifado_id_fkey"
            columns: ["almoxarifado_id"]
            isOneToOne: false
            referencedRelation: "almoxarifados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_material_responsavel_entrega_id_fkey"
            columns: ["responsavel_entrega_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_material_responsavel_entrega_id_fkey"
            columns: ["responsavel_entrega_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "requisicoes_material_responsavel_entrega_id_fkey"
            columns: ["responsavel_entrega_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_material_responsavel_entrega_id_fkey"
            columns: ["responsavel_entrega_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_material_setor_solicitante_id_fkey"
            columns: ["setor_solicitante_id"]
            isOneToOne: false
            referencedRelation: "estrutura_organizacional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_material_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_material_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "requisicoes_material_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_material_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "respostas_checklist_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "reunioes_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "riscos_institucionais_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
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
            foreignKeyName: "rubricas_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "servidor_regime_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      servidor_tag_vinculos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          servidor_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          servidor_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          servidor_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servidor_tag_vinculos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidor_tag_vinculos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "servidor_tag_vinculos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidor_tag_vinculos_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_servidores_situacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidor_tag_vinculos_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "servidor_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      servidor_tags: {
        Row: {
          cor: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          cor?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      servidores: {
        Row: {
          acumula_cargo: boolean | null
          acumulo_descricao: string | null
          ano_conclusao: number | null
          ano_fim_primeiro_emprego: number | null
          ano_inicio_primeiro_emprego: number | null
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
          codigo_interno: string | null
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
          estrangeiro_ano_chegada: number | null
          estrangeiro_data_chegada: string | null
          estrangeiro_data_limite_permanencia: string | null
          estrangeiro_registro_nacional: string | null
          formacao_academica: string | null
          foto_url: string | null
          funcao_exercida: string | null
          gratificacoes: number | null
          id: string
          indicacao: string | null
          instituicao_ensino: string | null
          matricula: string | null
          molestia_grave: boolean | null
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
          possui_vinculo_externo: boolean | null
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
          vinculo_externo_ato_id: string | null
          vinculo_externo_cargo: string | null
          vinculo_externo_esfera: string | null
          vinculo_externo_forma: string | null
          vinculo_externo_matricula: string | null
          vinculo_externo_observacoes: string | null
          vinculo_externo_orgao: string | null
          vinculo_externo_situacao: string | null
        }
        Insert: {
          acumula_cargo?: boolean | null
          acumulo_descricao?: string | null
          ano_conclusao?: number | null
          ano_fim_primeiro_emprego?: number | null
          ano_inicio_primeiro_emprego?: number | null
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
          codigo_interno?: string | null
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
          estrangeiro_ano_chegada?: number | null
          estrangeiro_data_chegada?: string | null
          estrangeiro_data_limite_permanencia?: string | null
          estrangeiro_registro_nacional?: string | null
          formacao_academica?: string | null
          foto_url?: string | null
          funcao_exercida?: string | null
          gratificacoes?: number | null
          id?: string
          indicacao?: string | null
          instituicao_ensino?: string | null
          matricula?: string | null
          molestia_grave?: boolean | null
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
          possui_vinculo_externo?: boolean | null
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
          vinculo_externo_ato_id?: string | null
          vinculo_externo_cargo?: string | null
          vinculo_externo_esfera?: string | null
          vinculo_externo_forma?: string | null
          vinculo_externo_matricula?: string | null
          vinculo_externo_observacoes?: string | null
          vinculo_externo_orgao?: string | null
          vinculo_externo_situacao?: string | null
        }
        Update: {
          acumula_cargo?: boolean | null
          acumulo_descricao?: string | null
          ano_conclusao?: number | null
          ano_fim_primeiro_emprego?: number | null
          ano_inicio_primeiro_emprego?: number | null
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
          codigo_interno?: string | null
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
          estrangeiro_ano_chegada?: number | null
          estrangeiro_data_chegada?: string | null
          estrangeiro_data_limite_permanencia?: string | null
          estrangeiro_registro_nacional?: string | null
          formacao_academica?: string | null
          foto_url?: string | null
          funcao_exercida?: string | null
          gratificacoes?: number | null
          id?: string
          indicacao?: string | null
          instituicao_ensino?: string | null
          matricula?: string | null
          molestia_grave?: boolean | null
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
          possui_vinculo_externo?: boolean | null
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
          vinculo_externo_ato_id?: string | null
          vinculo_externo_cargo?: string | null
          vinculo_externo_esfera?: string | null
          vinculo_externo_forma?: string | null
          vinculo_externo_matricula?: string | null
          vinculo_externo_observacoes?: string | null
          vinculo_externo_orgao?: string | null
          vinculo_externo_situacao?: string | null
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
          {
            foreignKeyName: "servidores_vinculo_externo_ato_id_fkey"
            columns: ["vinculo_externo_ato_id"]
            isOneToOne: false
            referencedRelation: "documentos"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "solicitacoes_abono_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "solicitacoes_sic_recurso_respondido_por_fkey"
            columns: ["recurso_respondido_por"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "solicitacoes_sic_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["unidade_local_id"]
          },
          {
            foreignKeyName: "termos_cessao_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["destino_unidade_id"]
          },
          {
            foreignKeyName: "termos_cessao_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["origem_unidade_id"]
          },
          {
            foreignKeyName: "termos_cessao_unidade_local_id_fkey"
            columns: ["unidade_local_id"]
            isOneToOne: false
            referencedRelation: "v_patrimonio_por_unidade"
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
          instituicao_id: string | null
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
          instituicao_id?: string | null
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
          instituicao_id?: string | null
          max_horas_dia?: number | null
          max_ocorrencias_mes?: number | null
          nome?: string
          ordem?: number | null
          tipos_documento_aceitos?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_abono_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "config_institucional"
            referencedColumns: ["id"]
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
      user_modules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          module: Database["public"]["Enums"]["app_module"]
          permissions: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          module: Database["public"]["Enums"]["app_module"]
          permissions?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          module?: Database["public"]["Enums"]["app_module"]
          permissions?: string[] | null
          user_id?: string
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
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
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
          numero_sei_diarias: string | null
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
          tipo_onus: string
          updated_at: string | null
          valor_diaria: number | null
          valor_total: number | null
          veiculo_oficial: boolean | null
          workflow_diraf_concluido_em: string | null
          workflow_diraf_observacoes: string | null
          workflow_diraf_solicitado_em: string | null
          workflow_diraf_status: string | null
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
          numero_sei_diarias?: string | null
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
          tipo_onus?: string
          updated_at?: string | null
          valor_diaria?: number | null
          valor_total?: number | null
          veiculo_oficial?: boolean | null
          workflow_diraf_concluido_em?: string | null
          workflow_diraf_observacoes?: string | null
          workflow_diraf_solicitado_em?: string | null
          workflow_diraf_status?: string | null
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
          numero_sei_diarias?: string | null
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
          tipo_onus?: string
          updated_at?: string | null
          valor_diaria?: number | null
          valor_total?: number | null
          veiculo_oficial?: boolean | null
          workflow_diraf_concluido_em?: string | null
          workflow_diraf_observacoes?: string | null
          workflow_diraf_solicitado_em?: string | null
          workflow_diraf_status?: string | null
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "viagens_diarias_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "vinculos_funcionais_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      v_gestores_workflow_auditoria: {
        Row: {
          acao: string | null
          alerta_parado: boolean | null
          data_acao: string | null
          data_criacao: string | null
          detalhes: Json | null
          dias_no_status_atual: number | null
          escola_municipio: string | null
          escola_nome: string | null
          gestor_cpf: string | null
          gestor_email: string | null
          gestor_id: string | null
          gestor_nome: string | null
          historico_id: string | null
          responsavel: string | null
          status_anterior: string | null
          status_atual: string | null
          status_novo: string | null
          ultima_atualizacao: string | null
          usuario_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestores_escolares_historico_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "gestores_escolares"
            referencedColumns: ["id"]
          },
        ]
      }
      v_historico_bem_completo: {
        Row: {
          bem_descricao: string | null
          bem_id: string | null
          codigo_unidade: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          data_evento: string | null
          documento_url: string | null
          id: string | null
          justificativa: string | null
          nome_unidade: string | null
          numero_patrimonio: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          tipo_evento: string | null
          unidade_local_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens_patrimoniais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_patrimonio_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "v_movimentacoes_completas"
            referencedColumns: ["bem_id"]
          },
        ]
      }
      v_instituicoes_resumo: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          codigo_instituicao: string | null
          created_at: string | null
          email: string | null
          endereco_cidade: string | null
          endereco_uf: string | null
          esfera_governo: Database["public"]["Enums"]["esfera_governo"] | null
          id: string | null
          nome_fantasia: string | null
          nome_razao_social: string | null
          orgao_vinculado: string | null
          responsavel_cargo: string | null
          responsavel_nome: string | null
          solicitacoes_aprovadas: number | null
          status: Database["public"]["Enums"]["status_instituicao"] | null
          telefone: string | null
          tipo_instituicao:
            | Database["public"]["Enums"]["tipo_instituicao"]
            | null
          total_solicitacoes: number | null
        }
        Insert: {
          ativo?: boolean | null
          cnpj?: string | null
          codigo_instituicao?: string | null
          created_at?: string | null
          email?: string | null
          endereco_cidade?: string | null
          endereco_uf?: string | null
          esfera_governo?: Database["public"]["Enums"]["esfera_governo"] | null
          id?: string | null
          nome_fantasia?: string | null
          nome_razao_social?: string | null
          orgao_vinculado?: string | null
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          solicitacoes_aprovadas?: never
          status?: Database["public"]["Enums"]["status_instituicao"] | null
          telefone?: string | null
          tipo_instituicao?:
            | Database["public"]["Enums"]["tipo_instituicao"]
            | null
          total_solicitacoes?: never
        }
        Update: {
          ativo?: boolean | null
          cnpj?: string | null
          codigo_instituicao?: string | null
          created_at?: string | null
          email?: string | null
          endereco_cidade?: string | null
          endereco_uf?: string | null
          esfera_governo?: Database["public"]["Enums"]["esfera_governo"] | null
          id?: string | null
          nome_fantasia?: string | null
          nome_razao_social?: string | null
          orgao_vinculado?: string | null
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          solicitacoes_aprovadas?: never
          status?: Database["public"]["Enums"]["status_instituicao"] | null
          telefone?: string | null
          tipo_instituicao?:
            | Database["public"]["Enums"]["tipo_instituicao"]
            | null
          total_solicitacoes?: never
        }
        Relationships: []
      }
      v_movimentacoes_completas: {
        Row: {
          aceite_responsavel: boolean | null
          aprovador_nome: string | null
          bem_descricao: string | null
          bem_id: string | null
          bem_valor: number | null
          categoria_bem: Database["public"]["Enums"]["categoria_bem"] | null
          created_at: string | null
          data_aceite: string | null
          data_aprovacao: string | null
          data_movimentacao: string | null
          destino_codigo: string | null
          destino_nome: string | null
          destino_responsavel_nome: string | null
          destino_unidade_id: string | null
          documento_url: string | null
          id: string | null
          motivo: string | null
          numero_patrimonio: string | null
          observacoes: string | null
          origem_codigo: string | null
          origem_nome: string | null
          origem_responsavel_nome: string | null
          origem_unidade_id: string | null
          solicitante_nome: string | null
          status:
            | Database["public"]["Enums"]["status_movimentacao_patrimonio"]
            | null
          termo_transferencia_url: string | null
          tipo:
            | Database["public"]["Enums"]["tipo_movimentacao_patrimonio"]
            | null
        }
        Relationships: []
      }
      v_patrimonio_por_unidade: {
        Row: {
          bens_alocados: number | null
          bens_baixados: number | null
          bens_manutencao: number | null
          codigo_unidade: string | null
          municipio: string | null
          nome_unidade: string | null
          status_unidade:
            | Database["public"]["Enums"]["status_unidade_local"]
            | null
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade_local"] | null
          total_bens: number | null
          total_responsaveis: number | null
          unidade_id: string | null
          valor_total: number | null
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
      v_relatorio_tce_pessoal: {
        Row: {
          anos_servico: number | null
          carga_horaria: number | null
          cargo_nome: string | null
          cpf: string | null
          data_admissao: string | null
          data_nascimento: string | null
          data_posse: string | null
          descontos: number | null
          escolaridade: string | null
          gratificacoes: number | null
          id: string | null
          idade: number | null
          matricula: string | null
          nome_completo: string | null
          pcd: boolean | null
          pcd_tipo: string | null
          raca_cor: string | null
          regime_juridico: string | null
          remuneracao_bruta: number | null
          remuneracao_liquida: number | null
          sexo: string | null
          situacao: Database["public"]["Enums"]["situacao_funcional"] | null
          tipo_servidor: Database["public"]["Enums"]["tipo_servidor"] | null
          unidade_nome: string | null
          unidade_sigla: string | null
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
            referencedRelation: "v_historico_bem_completo"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "nomeacoes_chefe_unidade_servidor_id_fkey"
            columns: ["chefe_atual_id"]
            isOneToOne: false
            referencedRelation: "v_relatorio_tce_pessoal"
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
      v_resumo_patrimonio: {
        Row: {
          bens_alocados: number | null
          bens_atencao: number | null
          bens_baixados: number | null
          bens_bom_estado: number | null
          bens_manutencao: number | null
          total_bens: number | null
          valor_total_aquisicao: number | null
          valor_total_liquido: number | null
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
      can_access_module: {
        Args: { _module: Database["public"]["Enums"]["app_module"] }
        Returns: boolean
      }
      can_approve: {
        Args: { _module_name?: string; _user_id: string }
        Returns: boolean
      }
      can_manage_cms: { Args: never; Returns: boolean }
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
      enviar_folha_conferencia: { Args: { p_folha_id: string }; Returns: Json }
      fechar_folha: {
        Args: { p_folha_id: string; p_justificativa?: string }
        Returns: Json
      }
      fn_atualizar_situacao_servidor: {
        Args: { p_servidor_id: string }
        Returns: undefined
      }
      fn_calcular_13_proporcional: {
        Args: {
          p_ano: number
          p_remuneracao_base: number
          p_servidor_id: string
        }
        Returns: {
          meses_trabalhados: number
          valor_integral: number
          valor_proporcional: number
        }[]
      }
      fn_calcular_ferias: {
        Args: { p_dias_ferias?: number; p_remuneracao_base: number }
        Returns: {
          dias: number
          terco_constitucional: number
          valor_ferias: number
          valor_total: number
        }[]
      }
      fn_calcular_nivel_parametro: {
        Args: {
          p_servidor_id: string
          p_tipo_servidor: string
          p_unidade_id: string
        }
        Returns: number
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
      fn_gerar_esocial_s1200: {
        Args: {
          p_competencia_ano: number
          p_competencia_mes: number
          p_servidor_id: string
        }
        Returns: Json
      }
      fn_gerar_esocial_s2200: { Args: { p_servidor_id: string }; Returns: Json }
      fn_gerar_numero_financeiro: {
        Args: { p_exercicio?: number; p_tipo: string }
        Returns: string
      }
      fn_inscrever_restos_pagar: {
        Args: { p_exercicio_inscricao?: number; p_exercicio_origem: number }
        Returns: number
      }
      fn_pode_arquivar_processo: {
        Args: { p_processo_id: string }
        Returns: boolean
      }
      fn_proximo_numero_processo: { Args: { p_ano?: number }; Returns: string }
      fn_validar_margem_consignavel: {
        Args: { p_servidor_id: string }
        Returns: {
          dentro_limite: boolean
          margem_disponivel: number
          margem_total_percentual: number
          margem_total_valor: number
          margem_utilizada: number
          percentual_utilizado: number
          salario_liquido: number
        }[]
      }
      fn_validar_teto_remuneratorio: {
        Args: { p_remuneracao_bruta: number }
        Returns: {
          dentro_teto: boolean
          percentual_teto: number
          valor_excedente: number
          valor_teto: number
        }[]
      }
      folha_esta_bloqueada: { Args: { p_folha_id: string }; Returns: boolean }
      generate_schema_ddl: { Args: never; Returns: Json }
      gerar_codigo_pre_cadastro: { Args: never; Returns: string }
      gerar_link_frequencia: { Args: never; Returns: string }
      gerar_numero_portaria: { Args: { p_ano?: number }; Returns: string }
      gerar_numero_tombamento: {
        Args: { p_unidade_local_id: string }
        Returns: string
      }
      gerar_protocolo_cedencia: {
        Args: { p_unidade_id: string }
        Returns: string
      }
      gerar_protocolo_memorando_lotacao: { Args: never; Returns: string }
      gerar_relatorio_responsavel: {
        Args: { p_responsavel_id: string }
        Returns: {
          bem_id: string
          categoria: string
          data_atribuicao: string
          descricao: string
          estado_conservacao: string
          localizacao: string
          numero_patrimonio: string
          unidade_local: string
          valor_aquisicao: number
        }[]
      }
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
      has_module: {
        Args: { _module: Database["public"]["Enums"]["app_module"] }
        Returns: boolean
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_active_user:
        | { Args: never; Returns: boolean }
        | { Args: { p_user_id: string }; Returns: boolean }
      is_admin_user:
        | { Args: never; Returns: boolean }
        | { Args: { p_user_id: string }; Returns: boolean }
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
      obter_parametro_simples: {
        Args: {
          p_data_referencia?: string
          p_instituicao_id: string
          p_parametro_codigo: string
          p_servidor_id?: string
          p_tipo_servidor?: string
          p_unidade_id?: string
        }
        Returns: string
      }
      obter_parametro_vigente: {
        Args: {
          p_data_referencia?: string
          p_instituicao_id: string
          p_parametro_codigo: string
          p_servidor_id?: string
          p_tipo_servidor?: string
          p_unidade_id?: string
        }
        Returns: Json
      }
      processar_folha_pagamento: { Args: { p_folha_id: string }; Returns: Json }
      promover_rascunho: {
        Args: { p_justificativa?: string; p_rascunho_id: string }
        Returns: boolean
      }
      reabrir_folha: {
        Args: { p_folha_id: string; p_justificativa: string }
        Returns: Json
      }
      user_context: {
        Args: never
        Returns: {
          is_active: boolean
          modules: Database["public"]["Enums"]["app_module"][]
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      user_has_unit_access: {
        Args: { _unidade_id: string; _user_id: string }
        Returns: boolean
      }
      usuario_eh_super_admin: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      usuario_pode_fechar_folha: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      usuario_pode_reabrir_folha: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      usuario_tem_acesso_modulo: {
        Args: { _codigo_modulo: string; _user_id: string }
        Returns: boolean
      }
      usuario_tem_acesso_rota: {
        Args: { _pathname: string; _user_id: string }
        Returns: boolean
      }
      usuario_tem_permissao: {
        Args: { p_modulo: string; p_user_id: string }
        Returns: boolean
      }
      usuario_tem_permissao_financeira: {
        Args: { p_permissao: string; p_user_id: string }
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
      app_module:
        | "rh"
        | "financeiro"
        | "compras"
        | "patrimonio"
        | "contratos"
        | "workflow"
        | "governanca"
        | "transparencia"
        | "comunicacao"
        | "programas"
        | "gestores_escolares"
        | "integridade"
        | "admin"
        | "federacoes"
        | "organizacoes"
        | "gabinete"
        | "patrimonio_mobile"
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
      app_role: "admin" | "manager" | "user"
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
      categoria_bem:
        | "mobiliario"
        | "informatica"
        | "equipamento_esportivo"
        | "veiculo"
        | "eletrodomestico"
        | "outros"
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
      cms_destino:
        | "portal_home"
        | "portal_noticias"
        | "portal_eventos"
        | "portal_programas"
        | "selecoes_estudantis"
        | "jogos_escolares"
        | "esports"
        | "institucional"
        | "transparencia"
        | "redes_sociais"
      cms_tipo_conteudo:
        | "noticia"
        | "comunicado"
        | "banner"
        | "destaque"
        | "evento"
        | "galeria"
        | "video"
        | "documento"
      decisao_despacho:
        | "deferido"
        | "indeferido"
        | "parcialmente_deferido"
        | "encaminhar"
        | "arquivar"
        | "suspender"
        | "informar"
      esfera_governo: "municipal" | "estadual" | "federal"
      estado_conservacao: "otimo" | "bom" | "regular" | "ruim" | "inservivel"
      estado_conservacao_inventario:
        | "novo"
        | "bom"
        | "regular"
        | "ruim"
        | "inservivel"
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
      forma_aquisicao: "compra" | "doacao" | "cessao" | "transferencia"
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
      motivo_baixa_patrimonio:
        | "inservivel"
        | "obsoleto"
        | "doacao"
        | "alienacao"
        | "perda"
      natureza_cargo: "efetivo" | "comissionado"
      natureza_conta:
        | "ativo"
        | "passivo"
        | "patrimonio_liquido"
        | "receita"
        | "despesa"
        | "resultado"
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
      situacao_bem_patrimonio:
        | "cadastrado"
        | "tombado"
        | "alocado"
        | "em_manutencao"
        | "baixado"
        | "extraviado"
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
      status_adiantamento:
        | "solicitado"
        | "autorizado"
        | "liberado"
        | "em_uso"
        | "prestacao_pendente"
        | "prestado"
        | "aprovado"
        | "rejeitado"
        | "bloqueado"
      status_agenda:
        | "solicitado"
        | "aprovado"
        | "rejeitado"
        | "cancelado"
        | "concluido"
      status_coleta_inventario:
        | "conferido"
        | "nao_localizado"
        | "divergente"
        | "avariado"
        | "em_manutencao"
      status_conciliacao:
        | "pendente"
        | "conciliado"
        | "divergente"
        | "justificado"
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
      status_empenho:
        | "emitido"
        | "parcialmente_liquidado"
        | "liquidado"
        | "parcialmente_pago"
        | "pago"
        | "anulado"
      status_evento_esocial:
        | "pendente"
        | "gerado"
        | "validado"
        | "enviado"
        | "aceito"
        | "rejeitado"
        | "erro"
      status_folha: "aberta" | "previa" | "processando" | "fechada" | "reaberta"
      status_instituicao: "ativo" | "inativo" | "pendente_validacao"
      status_liquidacao:
        | "pendente"
        | "atestada"
        | "aprovada"
        | "rejeitada"
        | "cancelada"
      status_medicao: "rascunho" | "enviada" | "aprovada" | "rejeitada" | "paga"
      status_movimentacao_patrimonio:
        | "pendente"
        | "aprovado"
        | "rejeitado"
        | "concluido"
      status_movimentacao_processo:
        | "pendente"
        | "recebido"
        | "respondido"
        | "vencido"
        | "cancelado"
      status_nomeacao: "ativo" | "encerrado" | "revogado"
      status_pagamento:
        | "programado"
        | "autorizado"
        | "pago"
        | "devolvido"
        | "estornado"
        | "cancelado"
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
      status_workflow_financeiro:
        | "rascunho"
        | "pendente_analise"
        | "em_analise"
        | "aprovado"
        | "rejeitado"
        | "cancelado"
        | "executado"
        | "estornado"
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
      tipo_alteracao_orcamentaria:
        | "suplementacao"
        | "reducao"
        | "remanejamento"
        | "transposicao"
        | "transferencia"
        | "credito_especial"
        | "credito_extraordinario"
      tipo_ato_nomeacao: "portaria" | "decreto" | "ato" | "outro"
      tipo_campanha_inventario: "geral" | "setorial" | "rotativo"
      tipo_conta_bancaria: "corrente" | "poupanca" | "aplicacao" | "vinculada"
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
      tipo_empenho: "ordinario" | "estimativo" | "global"
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
      tipo_instituicao: "formal" | "informal" | "orgao_publico"
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
      tipo_manutencao: "preventiva" | "corretiva"
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
      tipo_movimentacao_patrimonio:
        | "transferencia_interna"
        | "cessao"
        | "emprestimo"
        | "recolhimento"
      tipo_movimentacao_processo:
        | "despacho"
        | "encaminhamento"
        | "juntada"
        | "decisao"
        | "informacao"
        | "ciencia"
        | "devolucao"
      tipo_ocorrencia_patrimonio: "dano" | "extravio" | "sinistro"
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
      tipo_receita:
        | "repasse_tesouro"
        | "convenio"
        | "doacao"
        | "restituicao"
        | "rendimento_aplicacao"
        | "taxa_servico"
        | "multa"
        | "outros"
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
      app_module: [
        "rh",
        "financeiro",
        "compras",
        "patrimonio",
        "contratos",
        "workflow",
        "governanca",
        "transparencia",
        "comunicacao",
        "programas",
        "gestores_escolares",
        "integridade",
        "admin",
        "federacoes",
        "organizacoes",
        "gabinete",
        "patrimonio_mobile",
      ],
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
      app_role: ["admin", "manager", "user"],
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
      categoria_bem: [
        "mobiliario",
        "informatica",
        "equipamento_esportivo",
        "veiculo",
        "eletrodomestico",
        "outros",
      ],
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
      cms_destino: [
        "portal_home",
        "portal_noticias",
        "portal_eventos",
        "portal_programas",
        "selecoes_estudantis",
        "jogos_escolares",
        "esports",
        "institucional",
        "transparencia",
        "redes_sociais",
      ],
      cms_tipo_conteudo: [
        "noticia",
        "comunicado",
        "banner",
        "destaque",
        "evento",
        "galeria",
        "video",
        "documento",
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
      esfera_governo: ["municipal", "estadual", "federal"],
      estado_conservacao: ["otimo", "bom", "regular", "ruim", "inservivel"],
      estado_conservacao_inventario: [
        "novo",
        "bom",
        "regular",
        "ruim",
        "inservivel",
      ],
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
      forma_aquisicao: ["compra", "doacao", "cessao", "transferencia"],
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
      motivo_baixa_patrimonio: [
        "inservivel",
        "obsoleto",
        "doacao",
        "alienacao",
        "perda",
      ],
      natureza_cargo: ["efetivo", "comissionado"],
      natureza_conta: [
        "ativo",
        "passivo",
        "patrimonio_liquido",
        "receita",
        "despesa",
        "resultado",
      ],
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
      situacao_bem_patrimonio: [
        "cadastrado",
        "tombado",
        "alocado",
        "em_manutencao",
        "baixado",
        "extraviado",
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
      status_adiantamento: [
        "solicitado",
        "autorizado",
        "liberado",
        "em_uso",
        "prestacao_pendente",
        "prestado",
        "aprovado",
        "rejeitado",
        "bloqueado",
      ],
      status_agenda: [
        "solicitado",
        "aprovado",
        "rejeitado",
        "cancelado",
        "concluido",
      ],
      status_coleta_inventario: [
        "conferido",
        "nao_localizado",
        "divergente",
        "avariado",
        "em_manutencao",
      ],
      status_conciliacao: [
        "pendente",
        "conciliado",
        "divergente",
        "justificado",
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
      status_empenho: [
        "emitido",
        "parcialmente_liquidado",
        "liquidado",
        "parcialmente_pago",
        "pago",
        "anulado",
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
      status_instituicao: ["ativo", "inativo", "pendente_validacao"],
      status_liquidacao: [
        "pendente",
        "atestada",
        "aprovada",
        "rejeitada",
        "cancelada",
      ],
      status_medicao: ["rascunho", "enviada", "aprovada", "rejeitada", "paga"],
      status_movimentacao_patrimonio: [
        "pendente",
        "aprovado",
        "rejeitado",
        "concluido",
      ],
      status_movimentacao_processo: [
        "pendente",
        "recebido",
        "respondido",
        "vencido",
        "cancelado",
      ],
      status_nomeacao: ["ativo", "encerrado", "revogado"],
      status_pagamento: [
        "programado",
        "autorizado",
        "pago",
        "devolvido",
        "estornado",
        "cancelado",
      ],
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
      status_workflow_financeiro: [
        "rascunho",
        "pendente_analise",
        "em_analise",
        "aprovado",
        "rejeitado",
        "cancelado",
        "executado",
        "estornado",
      ],
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
      tipo_alteracao_orcamentaria: [
        "suplementacao",
        "reducao",
        "remanejamento",
        "transposicao",
        "transferencia",
        "credito_especial",
        "credito_extraordinario",
      ],
      tipo_ato_nomeacao: ["portaria", "decreto", "ato", "outro"],
      tipo_campanha_inventario: ["geral", "setorial", "rotativo"],
      tipo_conta_bancaria: ["corrente", "poupanca", "aplicacao", "vinculada"],
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
      tipo_empenho: ["ordinario", "estimativo", "global"],
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
      tipo_instituicao: ["formal", "informal", "orgao_publico"],
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
      tipo_manutencao: ["preventiva", "corretiva"],
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
      tipo_movimentacao_patrimonio: [
        "transferencia_interna",
        "cessao",
        "emprestimo",
        "recolhimento",
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
      tipo_ocorrencia_patrimonio: ["dano", "extravio", "sinistro"],
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
      tipo_receita: [
        "repasse_tesouro",
        "convenio",
        "doacao",
        "restituicao",
        "rendimento_aplicacao",
        "taxa_servico",
        "multa",
        "outros",
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
