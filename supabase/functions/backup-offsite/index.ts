import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos
interface BackupConfig {
  id: string;
  enabled: boolean;
  schedule_cron: string;
  retention_daily: number;
  retention_weekly: number;
  retention_monthly: number;
  buckets_included: string[];
  encryption_enabled: boolean;
}

interface BackupResult {
  success: boolean;
  backupId?: string;
  dbFilePath?: string;
  storageFilePath?: string;
  manifestPath?: string;
  totalSize?: number;
  duration?: number;
  error?: string;
}

interface DiscoveredTable {
  table_name: string;
  row_count: number;
}

// ============================================
// TABELAS DE SISTEMA A IGNORAR
// ============================================
const EXCLUDED_TABLES = [
  '_realtime_subscription',
  'schema_migrations',
  'supabase_functions_migrations',
  'supabase_functions_hooks',
];

// ============================================
// DESCOBERTA DINÂMICA DE TABELAS
// ============================================
// deno-lint-ignore no-explicit-any
async function discoverAllTables(supabase: SupabaseClient<any, any, any>): Promise<string[]> {
  console.log('[DISCOVERY] Consultando catálogo PostgreSQL para backup...');
  
  const { data, error } = await supabase.rpc('list_public_tables');
  
  if (error) {
    console.error('[DISCOVERY] Erro ao listar tabelas:', error);
    throw new Error(`Falha na descoberta de tabelas: ${error.message}`);
  }
  
  const rawData = data as DiscoveredTable[] | null;
  const tables = (rawData || [])
    .filter((t: DiscoveredTable) => !EXCLUDED_TABLES.includes(t.table_name))
    .map((t: DiscoveredTable) => t.table_name);
  
  console.log(`[DISCOVERY] ${tables.length} tabelas descobertas para backup`);
  
  return tables;
}

// Categorizar tabelas para organização por módulo
function categorizeTable(tableName: string): string {
  const categories: Record<string, string[]> = {
    '01_usuarios_permissoes': ['profile', 'user_role', 'user_permission', 'user_org', 'user_security', 'role_permission', 'module_access', 'perfis', 'funcoes_sistema', 'perfil_funcoes', 'usuario_perfis', 'user_module', 'module_permission', 'module_setting'],
    '02_estrutura_organizacional': ['estrutura_organizacional', 'cargo', 'composicao_cargo', 'cargo_unidade', 'centros_custo', 'config_agrupamento'],
    '03_servidores_rh': ['servidor', 'lotacao', 'memorando', 'historico_funcional', 'portarias_servidor', 'ocorrencia', 'ferias', 'licenca', 'cessao', 'designacao', 'provimento', 'vinculo', 'dependente', 'pensoes', 'consignac', 'pre_cadastro', 'adicionais_tempo'],
    '04_ponto_frequencia': ['jornada', 'horario', 'ponto', 'justificativa', 'solicitacoes_ajuste', 'banco_hora', 'lancamentos_banco', 'frequencia_mensal', 'feriado', 'viagens_diarias', 'config_compensacao', 'config_fechamento_freq', 'dias_nao_uteis'],
    '05_folha_pagamento': ['folha', 'lancamentos_folha', 'ficha', 'itens_ficha', 'rubrica', 'parametros_folha', 'tabela_inss', 'tabela_irrf', 'esocial', 'exportacoes_folha', 'bancos_cnab', 'contas_autarquia', 'remessa', 'retorno', 'config_autarquia', 'config_rubricas', 'config_tipos_rubrica', 'config_fechamento_folha', 'config_regras_calculo', 'config_incidencias'],
    '06_financeiro': ['fin_', 'dotacoes_orcamentarias', 'empenhos', 'creditos_adicionais'],
    '07_patrimonio': ['bens_patrimoniais', 'baixas_patrimonio', 'movimentacoes_patrimonio', 'inventario', 'campanha', 'coleta', 'conciliac', 'itens_material', 'categorias_material', 'almoxarifado', 'estoque'],
    '08_licitacoes_contratos': ['processo_licitatorio', 'contratos', 'aditivos', 'atas_registro', 'fornecedor', 'documentos_preparatorios', 'checklist', 'audit_log_licitacoes'],
    '09_unidades_locais': ['unidades_locais', 'agenda_unidade', 'documentos_cedencia', 'termos_cessao', 'nomeacoes_chefe', 'agrupamento_unidade'],
    '10_federacoes_esporte': ['federac', 'calendario_federacao', 'eventos_esportivo', 'escolas_jer', 'instituicoes', 'contatos_eventos'],
    '11_documentos_aprovacoes': ['documento', 'approval', 'despacho', 'encaminhamento', 'processo_administrativo', 'decisoes_admin'],
    '12_comunicacao': ['demandas_ascom', 'cms_', 'noticias', 'config_paginas'],
    '13_governanca': ['riscos_institucionais', 'controles_internos', 'avaliacoes', 'evidencias', 'planos_acao', 'programas', 'acoes', 'metas'],
    '14_auditoria_backup': ['audit', 'backup'],
    '15_configuracoes': ['config_institucional', 'config_motivos', 'config_situacoes', 'config_tipos_ato', 'config_tipos_onus', 'config_parametros', 'dados_oficiais', 'debitos_tecnicos'],
  };

  const lowerName = tableName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      return category;
    }
  }
  
  return '99_outros';
}

// Função para gerar hash SHA-256
async function sha256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Função para converter hex para bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Função para criptografar dados (AES-256-GCM)
async function encryptData(data: Uint8Array, keyString: string): Promise<{ encrypted: Uint8Array; iv: Uint8Array }> {
  let keyData: Uint8Array;
  
  if (/^[a-fA-F0-9]{64}$/.test(keyString)) {
    keyData = hexToBytes(keyString);
  } else {
    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(keyString));
    keyData = new Uint8Array(keyBuffer);
  }
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  
  return { encrypted: new Uint8Array(encrypted), iv };
}

// Função para descriptografar dados
async function decryptData(encrypted: Uint8Array, iv: Uint8Array, keyString: string): Promise<Uint8Array> {
  let keyData: Uint8Array;
  
  if (/^[a-fA-F0-9]{64}$/.test(keyString)) {
    keyData = hexToBytes(keyString);
  } else {
    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(keyString));
    keyData = new Uint8Array(keyBuffer);
  }
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encrypted.buffer as ArrayBuffer
  );
  
  return new Uint8Array(decrypted);
}

// Formatar data para nome de arquivo
function formatDateTime(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Converter dados para CSV
function jsonToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      return String(val);
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Gerar SQL INSERT statements
function jsonToSql(tableName: string, data: Record<string, unknown>[]): string {
  if (data.length === 0) return `-- Tabela ${tableName}: sem dados\n`;
  
  const headers = Object.keys(data[0]);
  const sqlLines = [`-- Tabela: ${tableName} (${data.length} registros)`];
  sqlLines.push(`DELETE FROM ${tableName};`);
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return String(val);
    });
    sqlLines.push(`INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values.join(', ')});`);
  }
  
  sqlLines.push('');
  return sqlLines.join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, backupId, backupType, format, tables, since, apiKey } = body;

    // Clientes Supabase
    const supabaseOrigin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const destUrl = Deno.env.get('BACKUP_DEST_SUPABASE_URL');
    const destKey = Deno.env.get('BACKUP_DEST_SERVICE_ROLE_KEY');
    const encryptionKey = Deno.env.get('BACKUP_ENCRYPTION_KEY');
    const externalApiKey = Deno.env.get('BACKUP_EXTERNAL_API_KEY');

    // ============================================
    // DESCOBERTA DINÂMICA DE TABELAS
    // ============================================
    let ALL_TABLES: string[];
    try {
      ALL_TABLES = await discoverAllTables(supabaseOrigin);
    } catch (discoveryError) {
      console.error('[DISCOVERY] Falha na descoberta:', discoveryError);
      // Fallback para lista mínima crítica em caso de erro
      ALL_TABLES = ['profiles', 'servidores', 'cargos', 'estrutura_organizacional'];
    }

    const discoveredAt = new Date().toISOString();

    // ============================================
    // ENDPOINT PÚBLICO PARA CONTINGÊNCIA EXTERNA
    // ============================================
    if (action === 'external-export') {
      const isLocalExport = body?.localExport === true;
      
      // Para exportação local, validar via auth header; para externa, via API key
      if (isLocalExport) {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ success: false, error: 'Não autorizado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authErr } = await supabaseOrigin.auth.getUser(token);
        if (authErr || !authUser) {
          return new Response(
            JSON.stringify({ success: false, error: 'Não autenticado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (!externalApiKey || apiKey !== externalApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'API key inválida' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const exportFormat = format || 'json'; // json, csv, sql
      const exportTables = tables || ALL_TABLES;
      const sinceDate = since ? new Date(since) : null;

      console.log(`[EXPORT] Formato: ${exportFormat}, Tabelas: ${exportTables.length}, Desde: ${sinceDate || 'completo'}`);

      const exportData: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        format: exportFormat,
        incremental: !!sinceDate,
        since: sinceDate?.toISOString() || null,
        discovery_mode: 'automatic',
        tables_count: 0,
        total_records: 0,
        data: {}
      };

      let totalRecords = 0;

      for (const table of exportTables) {
        try {
          let query = supabaseOrigin.from(table).select('*');
          
          // Backup incremental por updated_at ou created_at
          if (sinceDate) {
            query = query.or(`updated_at.gte.${sinceDate.toISOString()},created_at.gte.${sinceDate.toISOString()}`);
          }
          
          const { data, error } = await query;
          
          if (!error && data && data.length > 0) {
            if (exportFormat === 'csv') {
              (exportData.data as Record<string, string>)[table] = jsonToCsv(data);
            } else if (exportFormat === 'sql') {
              (exportData.data as Record<string, string>)[table] = jsonToSql(table, data);
            } else {
              (exportData.data as Record<string, unknown[]>)[table] = data;
            }
            totalRecords += data.length;
          }
        } catch (tableError) {
          console.warn(`[EXPORT] Erro na tabela ${table}:`, tableError);
        }
      }

      exportData.tables_count = Object.keys(exportData.data as Record<string, unknown>).length;
      exportData.total_records = totalRecords;

      // Log de acesso externo
      try {
        await supabaseOrigin.rpc('log_audit', {
          _action: 'view',
          _entity_type: 'backup_export',
          _module_name: 'backup_offsite',
          _description: `Exportação externa: ${exportFormat}, ${totalRecords} registros`,
          _metadata: { format: exportFormat, tables_count: exportData.tables_count, total_records: totalRecords, incremental: !!sinceDate }
        });
      } catch {
        // Ignora erro de log
      }

      return new Response(
        JSON.stringify(exportData),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Export-Format': exportFormat,
            'X-Export-Records': String(totalRecords),
            'X-Export-Tables': String(exportData.tables_count),
            'X-Discovery-Mode': 'automatic'
          } 
        }
      );
    }

    // ============================================
    // ENDPOINT PARA LISTAR TABELAS DISPONÍVEIS
    // ============================================
    if (action === 'list-tables') {
      // Organizar tabelas por categoria
      const categorizedTables: Record<string, string[]> = {};
      for (const table of ALL_TABLES) {
        const category = categorizeTable(table);
        if (!categorizedTables[category]) {
          categorizedTables[category] = [];
        }
        categorizedTables[category].push(table);
      }

      return new Response(
        JSON.stringify({
          success: true,
          discovery_mode: 'automatic',
          discovered_at: discoveredAt,
          tables: ALL_TABLES,
          total: ALL_TABLES.length,
          categories: categorizedTables
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ENDPOINTS AUTENTICADOS (ADMIN)
    // ============================================
    
    if (!destUrl || !destKey) {
      throw new Error('Credenciais do Supabase destino não configuradas');
    }

    const supabaseDest = createClient(destUrl, destKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar se é chamada via cron (anon key ou service role)
    // Decodificar JWT para verificar role
    let isCronCall = false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'anon' || payload.role === 'service_role') {
        isCronCall = true;
      }
    } catch {
      // Token inválido - não é cron
    }

    let user: { id: string } | null = null;

    if (isCronCall) {
      // Chamada automática via cron - permitida sem verificação de roles
      console.log('[AUTH] Chamada via cron/service_role - autorizada automaticamente');
      user = { id: 'cron-system' };
    } else {
      // Chamada de usuário - verificar autenticação e permissões
      const { data: { user: authUser }, error: authError } = await supabaseOrigin.auth.getUser(token);

      if (authError || !authUser) {
        throw new Error('Usuário não autenticado');
      }

      user = authUser;

      // Verificar permissões (TI-admin ou Presidência)
      const { data: userRoles } = await supabaseOrigin
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      const hasPermission = userRoles?.some(r => 
        r.role === 'ti_admin' || r.role === 'presidencia' || r.role === 'admin'
      );

      if (!hasPermission) {
        throw new Error('Sem permissão para executar backup');
      }
    }

    switch (action) {
      case 'test-connection': {
        console.log('Testando conexão com destino:', destUrl);
        
        try {
          const { data, error } = await supabaseDest.storage.listBuckets();
          
          if (error) {
            console.error('Erro ao listar buckets:', error);
            throw new Error(`Falha na conexão: ${error.message}`);
          }

          console.log('Buckets encontrados:', data?.map(b => b.name));

          const bucketExists = data?.some(b => b.name === 'idjuv-backups');
          
          if (!bucketExists) {
            console.log('Bucket não existe, tentando criar...');
            const { error: createError } = await supabaseDest.storage.createBucket('idjuv-backups', {
              public: false
            });
            
            if (createError) {
              if (createError.message.includes('already exists')) {
                console.log('Bucket já existe (condição de corrida)');
              } else {
                console.warn('Não foi possível criar bucket:', createError.message);
                return new Response(
                  JSON.stringify({
                    success: false,
                    error: `Bucket "idjuv-backups" não encontrado e não foi possível criá-lo. Detalhe: ${createError.message}`,
                    needsManualBucket: true,
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            } else {
              console.log('Bucket criado com sucesso');
            }
          }

          const testData = new TextEncoder().encode('test');
          const testPath = `_connection_test_${Date.now()}.txt`;
          
          const { error: uploadError } = await supabaseDest.storage
            .from('idjuv-backups')
            .upload(testPath, testData, { upsert: true });
          
          if (uploadError) {
            return new Response(
              JSON.stringify({
                success: false,
                error: `Conexão OK, mas falha ao gravar: ${uploadError.message}`,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          await supabaseDest.storage.from('idjuv-backups').remove([testPath]);

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Conexão estabelecida com sucesso',
              discovery_mode: 'automatic',
              tables_available: ALL_TABLES.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (connError) {
          console.error('Erro de conexão:', connError);
          throw connError;
        }
      }

      case 'execute-backup': {
        const dateTime = formatDateTime();
        const type = backupType || 'manual';
        const exportFormat = format || 'json';
        
        const { data: backupRecord, error: insertError } = await supabaseOrigin
          .from('backup_history')
          .insert({
            backup_type: type,
            status: 'running',
            triggered_by: user.id,
            trigger_mode: type === 'manual' ? 'manual' : 'auto',
            system_version: '2.0.0',
            metadata: { 
              format: exportFormat, 
              tables_count: ALL_TABLES.length,
              discovery_mode: 'automatic',
              discovered_at: discoveredAt
            }
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Falha ao criar registro: ${insertError.message}`);
        }

        const startTime = Date.now();
        let totalSize = 0;
        let dbChecksum = '';
        let storageChecksum = '';

        try {
          // 1. Backup ORGANIZADO POR CATEGORIA/MÓDULO
          console.log(`[BACKUP] Iniciando backup de ${ALL_TABLES.length} tabelas (descoberta automática)`);

          const dbData: Record<string, unknown[]> = {};
          const tableStats: Record<string, number> = {};
          const categorizedData: Record<string, Record<string, unknown[]>> = {};
          
          for (const table of ALL_TABLES) {
            try {
              const { data, error } = await supabaseOrigin.from(table).select('*');
              if (!error && data) {
                dbData[table] = data;
                tableStats[table] = data.length;
                
                // Categorizar por módulo
                const category = categorizeTable(table);
                if (!categorizedData[category]) {
                  categorizedData[category] = {};
                }
                categorizedData[category][table] = data;
              }
            } catch (tableError) {
              console.warn(`[BACKUP] Erro na tabela ${table}:`, tableError);
            }
          }

          // Upload de arquivos separados por categoria
          const categoryFiles: Record<string, { path: string; size: number; tables: number; records: number }> = {};
          
          for (const [category, tables] of Object.entries(categorizedData)) {
            const categoryContent = JSON.stringify({
              category,
              exported_at: new Date().toISOString(),
              tables_count: Object.keys(tables).length,
              total_records: Object.values(tables).reduce((acc, arr) => acc + arr.length, 0),
              data: tables
            }, null, 2);
            
            const categoryBytes = new TextEncoder().encode(categoryContent);
            let toUpload = categoryBytes;
            let fileName = `db/${dateTime}/${category}.json`;
            
            if (encryptionKey) {
              const { encrypted, iv } = await encryptData(categoryBytes, encryptionKey);
              const combined = new Uint8Array(iv.length + encrypted.length);
              combined.set(iv);
              combined.set(encrypted, iv.length);
              toUpload = combined;
              fileName += '.enc';
            }
            
            const { error: uploadError } = await supabaseDest.storage
              .from('idjuv-backups')
              .upload(fileName, toUpload, {
                contentType: 'application/octet-stream',
                upsert: true
              });
            
            if (uploadError) {
              console.warn(`[BACKUP] Erro ao salvar categoria ${category}:`, uploadError.message);
            } else {
              totalSize += toUpload.length;
              categoryFiles[category] = {
                path: fileName,
                size: toUpload.length,
                tables: Object.keys(tables).length,
                records: Object.values(tables).reduce((acc, arr) => acc + arr.length, 0)
              };
            }
          }

          // Gerar arquivo índice consolidado
          const indexContent = JSON.stringify({
            exported_at: new Date().toISOString(),
            system_version: '3.0.0',
            discovery_mode: 'automatic',
            organization: 'by_category',
            categories: Object.keys(categorizedData).length,
            tables_count: Object.keys(dbData).length,
            total_records: Object.values(tableStats).reduce((a, b) => a + b, 0),
            table_stats: tableStats,
            category_files: categoryFiles
          }, null, 2);

          const indexBytes = new TextEncoder().encode(indexContent);
          const dbChecksum_local = await sha256(indexBytes);
          dbChecksum = dbChecksum_local;
          
          let indexToUpload = indexBytes;
          let dbFileName = `db/${dateTime}/_index.json`;
          
          if (encryptionKey) {
            const { encrypted, iv } = await encryptData(indexBytes, encryptionKey);
            const combined = new Uint8Array(iv.length + encrypted.length);
            combined.set(iv);
            combined.set(encrypted, iv.length);
            indexToUpload = combined;
            dbFileName += '.enc';
          }

          // Verificar e criar bucket no destino se necessário
          const { data: destBuckets, error: destBucketsError } = await supabaseDest.storage.listBuckets();
          if (destBucketsError) {
            throw new Error(`Falha ao acessar buckets do destino: ${destBucketsError.message}`);
          }
          const hasBackupBucket = destBuckets?.some((b) => b.name === 'idjuv-backups');
          if (!hasBackupBucket) {
            console.log('[BACKUP] Bucket "idjuv-backups" não encontrado no destino, criando automaticamente...');
            const { error: createBucketError } = await supabaseDest.storage.createBucket('idjuv-backups', {
              public: false
            });
            if (createBucketError && !createBucketError.message.includes('already exists')) {
              throw new Error(`Bucket "idjuv-backups" não encontrado e não foi possível criá-lo: ${createBucketError.message}`);
            }
            console.log('[BACKUP] Bucket "idjuv-backups" criado com sucesso no destino');
          }

          const { error: indexUploadError } = await supabaseDest.storage
            .from('idjuv-backups')
            .upload(dbFileName, indexToUpload, {
              contentType: 'application/json',
              upsert: true
            });

          if (indexUploadError) {
            throw new Error(`Falha no upload do índice: ${indexUploadError.message}`);
          }

          totalSize += indexToUpload.length;
          console.log(`[BACKUP] ${Object.keys(categorizedData).length} categorias exportadas, ${Object.keys(dbData).length} tabelas, ${totalSize} bytes total`);

          // 2. Backup do Storage
          const { data: configData } = await supabaseOrigin
            .from('backup_config')
            .select('id, buckets_included')
            .single();

          const buckets = configData?.buckets_included || ['documentos'];
          const storageData: Record<string, { name: string; data: string }[]> = {};

          for (const bucket of buckets) {
            const { data: files } = await supabaseOrigin.storage.from(bucket).list();
            if (files) {
              storageData[bucket] = [];
              for (const file of files.slice(0, 100)) {
                if (file.name) {
                  const { data: fileData } = await supabaseOrigin.storage
                    .from(bucket)
                    .download(file.name);
                  
                  if (fileData) {
                    const arrayBuffer = await fileData.arrayBuffer();
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                    storageData[bucket].push({ name: file.name, data: base64 });
                  }
                }
              }
            }
          }

          const storageJson = JSON.stringify(storageData);
          const storageBytes = new TextEncoder().encode(storageJson);
          storageChecksum = await sha256(storageBytes);

          let storageToUpload = storageBytes;
          let storageFileName = `storage/storage_${dateTime}.json`;

          if (encryptionKey) {
            const { encrypted, iv } = await encryptData(storageBytes, encryptionKey);
            const combined = new Uint8Array(iv.length + encrypted.length);
            combined.set(iv);
            combined.set(encrypted, iv.length);
            storageToUpload = combined;
            storageFileName += '.enc';
          }

          const { error: storageUploadError } = await supabaseDest.storage
            .from('idjuv-backups')
            .upload(storageFileName, storageToUpload, {
              contentType: 'application/octet-stream',
              upsert: true
            });

          if (storageUploadError) {
            throw new Error(`Falha no upload do storage: ${storageUploadError.message}`);
          }

          totalSize += storageToUpload.length;

          // 3. Criar manifest detalhado
          const manifest = {
            created_at: new Date().toISOString(),
            type,
            format: exportFormat,
            system_version: '3.0.0',
            organization: 'by_category',
            discovery: {
              mode: 'automatic',
              discovered_at: discoveredAt,
              source: 'information_schema.tables via list_public_tables()'
            },
            tables: {
              total: ALL_TABLES.length,
              exported: Object.keys(dbData).length,
              list: ALL_TABLES,
              stats: tableStats
            },
            categories: categoryFiles,
            files: {
              db_index: {
                path: dbFileName,
                checksum: dbChecksum,
                encrypted: !!encryptionKey,
              },
              category_files: categoryFiles,
              storage: {
                path: storageFileName,
                size: storageToUpload.length,
                checksum: storageChecksum,
                encrypted: !!encryptionKey,
                objects_count: Object.values(storageData).flat().length
              }
            },
            total_size: totalSize,
            status: 'success',
            documentation: {
              restore_instructions: 'Cada módulo é salvo em arquivo separado na pasta db/<data>/. Importe cada arquivo individualmente ou use o _index.json para localizar todos.',
              organization: 'Dados organizados por módulo: 01_usuarios, 02_estrutura, 03_rh, 04_ponto, 05_folha, 06_financeiro, 07_patrimonio, etc.',
              auto_discovery: 'O sistema descobre automaticamente novas tabelas criadas no banco'
            }
          };

          const manifestJson = JSON.stringify(manifest, null, 2);
          const manifestBytes = new TextEncoder().encode(manifestJson);
          const manifestChecksum = await sha256(manifestBytes);
          const manifestFileName = `meta/backup_${dateTime}_manifest.json`;

          await supabaseDest.storage
            .from('idjuv-backups')
            .upload(manifestFileName, manifestBytes, {
              contentType: 'application/json',
              upsert: true
            });

          const duration = Math.round((Date.now() - startTime) / 1000);

          // Atualizar registro de backup
          await supabaseOrigin
            .from('backup_history')
            .update({
              status: 'success',
              completed_at: new Date().toISOString(),
              db_file_path: dbFileName,
              db_file_size: totalSize,
              db_checksum: dbChecksum,
              storage_file_path: storageFileName,
              storage_file_size: storageToUpload.length,
              storage_checksum: storageChecksum,
              storage_objects_count: Object.values(storageData).flat().length,
              manifest_path: manifestFileName,
              manifest_checksum: manifestChecksum,
              total_size: totalSize,
              duration_seconds: duration,
              metadata: { 
                format: exportFormat, 
                tables_count: Object.keys(dbData).length, 
                categories_count: Object.keys(categorizedData).length,
                category_files: categoryFiles,
                table_stats: tableStats,
                discovery_mode: 'automatic',
                organization: 'by_category'
              }
            })
            .eq('id', backupRecord.id);

          // Atualizar config
          if (configData?.id) {
            await supabaseOrigin
              .from('backup_config')
              .update({
                last_backup_at: new Date().toISOString(),
                last_backup_status: 'success'
              })
              .eq('id', configData.id);
          }

          // Log de auditoria
          await supabaseOrigin.rpc('log_audit', {
            _action: 'create',
            _entity_type: 'backup',
            _entity_id: backupRecord.id,
            _module_name: 'backup_offsite',
            _description: `Backup ${type} organizado em ${Object.keys(categorizedData).length} categorias - ${Object.keys(dbData).length} tabelas`,
            _metadata: { total_size: totalSize, duration, categories: Object.keys(categorizedData).length, tables: Object.keys(dbData).length }
          });

          return new Response(
            JSON.stringify({
              success: true,
              backupId: backupRecord.id,
              organization: 'by_category',
              categoriesCount: Object.keys(categorizedData).length,
              categoryFiles,
              storageFilePath: storageFileName,
              manifestPath: manifestFileName,
              totalSize,
              duration,
              tablesExported: Object.keys(dbData).length,
              totalRecords: Object.values(tableStats).reduce((a, b) => a + b, 0),
              discoveryMode: 'automatic'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (backupError) {
          const errorMessage = backupError instanceof Error ? backupError.message : 'Erro desconhecido';
          await supabaseOrigin
            .from('backup_history')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: errorMessage,
              duration_seconds: Math.round((Date.now() - startTime) / 1000)
            })
            .eq('id', backupRecord.id);

          throw backupError;
        }
      }

      case 'verify-integrity': {
        if (!backupId) {
          throw new Error('ID do backup não informado');
        }

        const { data: backup } = await supabaseOrigin
          .from('backup_history')
          .select('*')
          .eq('id', backupId)
          .single();

        if (!backup || !backup.manifest_path) {
          throw new Error('Backup não encontrado');
        }

        const { data: manifestData } = await supabaseDest.storage
          .from('idjuv-backups')
          .download(backup.manifest_path);

        if (!manifestData) {
          throw new Error('Manifest não encontrado no destino');
        }

        const manifestText = await manifestData.text();
        const manifest = JSON.parse(manifestText);

        const dbValid = manifest?.files?.db?.checksum 
          ? manifest.files.db.checksum === backup.db_checksum 
          : !backup.db_checksum; // both null = valid
        const storageValid = manifest?.files?.storage?.checksum 
          ? manifest.files.storage.checksum === backup.storage_checksum 
          : !backup.storage_checksum;

        await supabaseOrigin
          .from('backup_integrity_checks')
          .insert({
            backup_id: backupId,
            checked_by: user.id,
            is_valid: dbValid && storageValid,
            db_checksum_valid: dbValid,
            storage_checksum_valid: storageValid,
            manifest_valid: true,
            details: { manifest }
          });

        return new Response(
          JSON.stringify({
            success: true,
            isValid: dbValid && storageValid,
            dbChecksumValid: dbValid,
            storageChecksumValid: storageValid,
            manifestValid: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-backups': {
        const { data: dbFiles } = await supabaseDest.storage
          .from('idjuv-backups')
          .list('db');

        const { data: storageFiles } = await supabaseDest.storage
          .from('idjuv-backups')
          .list('storage');

        const { data: metaFiles } = await supabaseDest.storage
          .from('idjuv-backups')
          .list('meta');

        return new Response(
          JSON.stringify({
            success: true,
            files: {
              db: dbFiles || [],
              storage: storageFiles || [],
              meta: metaFiles || []
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cleanup-old-backups': {
        const { data: config } = await supabaseOrigin
          .from('backup_config')
          .select('*')
          .single();

        if (!config) {
          throw new Error('Configuração não encontrada');
        }

        let deletedCount = 0;

        const { data: oldBackups } = await supabaseOrigin
          .from('backup_history')
          .select('*')
          .eq('status', 'success')
          .order('started_at', { ascending: true });

        if (oldBackups) {
          const dailyBackups = oldBackups.filter(b => b.backup_type === 'daily');
          const weeklyBackups = oldBackups.filter(b => b.backup_type === 'weekly');
          const monthlyBackups = oldBackups.filter(b => b.backup_type === 'monthly');

          const dailyToDelete = dailyBackups.slice(0, Math.max(0, dailyBackups.length - config.retention_daily));
          const weeklyToDelete = weeklyBackups.slice(0, Math.max(0, weeklyBackups.length - config.retention_weekly));
          const monthlyToDelete = monthlyBackups.slice(0, Math.max(0, monthlyBackups.length - config.retention_monthly));

          const toDelete = [...dailyToDelete, ...weeklyToDelete, ...monthlyToDelete];

          for (const backup of toDelete) {
            if (backup.db_file_path) {
              await supabaseDest.storage.from('idjuv-backups').remove([backup.db_file_path]);
            }
            if (backup.storage_file_path) {
              await supabaseDest.storage.from('idjuv-backups').remove([backup.storage_file_path]);
            }
            if (backup.manifest_path) {
              await supabaseDest.storage.from('idjuv-backups').remove([backup.manifest_path]);
            }

            await supabaseOrigin.from('backup_history').delete().eq('id', backup.id);
            deletedCount++;
          }
        }

        await supabaseOrigin.rpc('log_audit', {
          _action: 'delete',
          _entity_type: 'backup',
          _module_name: 'backup_offsite',
          _description: `Limpeza de backups antigos: ${deletedCount} removidos`,
          _metadata: { deleted_count: deletedCount }
        });

        return new Response(
          JSON.stringify({
            success: true,
            deletedCount,
            message: `${deletedCount} backups antigos removidos`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync-database': {
        // ============================================
        // SINCRONIZAÇÃO DIRETA COM BANCO DESTINO
        // Replica dados em tabelas reais no Supabase destino
        // ============================================
        const syncStart = Date.now();
        console.log('[SYNC] Iniciando sincronização com banco espelho...');

        const syncResults: Record<string, { records: number; status: string; error?: string }> = {};
        let syncTotalRecords = 0;
        let syncErrors = 0;

        // Registrar início
        const { data: syncRecord } = await supabaseOrigin
          .from('backup_history')
          .insert({
            backup_type: 'manual',
            status: 'running',
            triggered_by: user.id,
            trigger_mode: 'sync',
            system_version: '3.0.0',
            metadata: { type: 'database_sync', tables_count: ALL_TABLES.length }
          })
          .select()
          .single();

        try {
          for (const table of ALL_TABLES) {
            try {
              // Ler dados da origem
              const { data: rows, error: readErr } = await supabaseOrigin.from(table).select('*');
              
              if (readErr || !rows) {
                syncResults[table] = { records: 0, status: 'skip', error: readErr?.message };
                continue;
              }

              if (rows.length === 0) {
                syncResults[table] = { records: 0, status: 'empty' };
                continue;
              }

              // Upsert em lotes no destino (lotes de 500)
              const batchSize = 500;
              let totalUpserted = 0;

              for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const { error: upsertErr } = await supabaseDest
                  .from(table)
                  .upsert(batch as any, { onConflict: 'id', ignoreDuplicates: false });

                if (upsertErr) {
                  // Tentar insert individual em caso de erro de lote
                  let individualSuccess = 0;
                  for (const row of batch) {
                    const { error: singleErr } = await supabaseDest
                      .from(table)
                      .upsert(row as any, { onConflict: 'id' });
                    if (!singleErr) individualSuccess++;
                  }
                  totalUpserted += individualSuccess;
                  if (individualSuccess < batch.length) {
                    console.warn(`[SYNC] ${table}: ${batch.length - individualSuccess} registros falharam`);
                  }
                } else {
                  totalUpserted += batch.length;
                }
              }

              syncResults[table] = { records: totalUpserted, status: 'ok' };
              syncTotalRecords += totalUpserted;
            } catch (tableErr) {
              const msg = tableErr instanceof Error ? tableErr.message : 'Erro';
              syncResults[table] = { records: 0, status: 'error', error: msg };
              syncErrors++;
              console.warn(`[SYNC] Erro na tabela ${table}: ${msg}`);
            }
          }

          const syncDuration = Math.round((Date.now() - syncStart) / 1000);
          const syncStatus = syncErrors === 0 ? 'success' : (syncErrors < ALL_TABLES.length ? 'partial' : 'failed');

          // Atualizar registro
          if (syncRecord?.id) {
            await supabaseOrigin
              .from('backup_history')
              .update({
                status: syncStatus,
                completed_at: new Date().toISOString(),
                duration_seconds: syncDuration,
                total_size: syncTotalRecords,
                metadata: {
                  type: 'database_sync',
                  tables_synced: Object.keys(syncResults).filter(k => syncResults[k].status === 'ok').length,
                  tables_failed: syncErrors,
                  total_records: syncTotalRecords,
                  details: syncResults
                }
              })
              .eq('id', syncRecord.id);
          }

          // Auditoria
          await supabaseOrigin.rpc('log_audit', {
            _action: 'create',
            _entity_type: 'backup',
            _entity_id: syncRecord?.id || 'unknown',
            _module_name: 'backup_offsite',
            _description: `Sync banco espelho: ${syncTotalRecords} registros em ${Object.keys(syncResults).filter(k => syncResults[k].status === 'ok').length} tabelas`,
            _metadata: { duration: syncDuration, errors: syncErrors }
          });

          return new Response(
            JSON.stringify({
              success: syncErrors < ALL_TABLES.length,
              syncId: syncRecord?.id,
              status: syncStatus,
              tablesSynced: Object.keys(syncResults).filter(k => syncResults[k].status === 'ok').length,
              tablesFailed: syncErrors,
              tablesEmpty: Object.keys(syncResults).filter(k => syncResults[k].status === 'empty').length,
              totalRecords: syncTotalRecords,
              duration: syncDuration,
              details: syncResults
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (syncError) {
          const errMsg = syncError instanceof Error ? syncError.message : 'Erro desconhecido';
          if (syncRecord?.id) {
            await supabaseOrigin.from('backup_history').update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: errMsg,
              duration_seconds: Math.round((Date.now() - syncStart) / 1000)
            }).eq('id', syncRecord.id);
          }
          throw syncError;
        }
      }

      case 'download-manifest': {
        if (!backupId) {
          throw new Error('ID do backup não informado');
        }

        const { data: backup } = await supabaseOrigin
          .from('backup_history')
          .select('manifest_path')
          .eq('id', backupId)
          .single();

        if (!backup?.manifest_path) {
          throw new Error('Manifest não encontrado');
        }

        const { data: signedUrl } = await supabaseDest.storage
          .from('idjuv-backups')
          .createSignedUrl(backup.manifest_path, 3600);

        return new Response(
          JSON.stringify({ success: true, url: signedUrl?.signedUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'generate-dest-schema': {
        // Gera DDL completo usando a RPC generate_schema_ddl
        const { data: schemaData, error: schemaError } = await supabaseOrigin.rpc('generate_schema_ddl');
        if (schemaError) throw new Error(`Erro ao gerar schema: ${schemaError.message}`);

        // deno-lint-ignore no-explicit-any
        const schema = schemaData as any;
        let sql = '-- ============================================\n';
        sql += '-- SCHEMA COMPLETO IDJUV - Gerado automaticamente\n';
        sql += `-- Data: ${new Date().toISOString()}\n`;
        sql += '-- ============================================\n\nBEGIN;\n\n';

        // Enums
        // deno-lint-ignore no-explicit-any
        const enums: any[] = schema?.enums || [];
        for (const e of enums) {
          const labels = e.labels.split(',').map((l: string) => `'${l.trim()}'`).join(', ');
          sql += `DO $$ BEGIN CREATE TYPE public.${e.name} AS ENUM (${labels}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n`;
        }
        sql += '\n';

        // Tables
        // deno-lint-ignore no-explicit-any
        const tables: any[] = schema?.tables || [];
        for (const table of tables) {
          if (EXCLUDED_TABLES.includes(table.name)) continue;
          sql += `CREATE TABLE IF NOT EXISTS public.${table.name} (\n`;
          // deno-lint-ignore no-explicit-any
          const colDefs = (table.columns || []).map((col: any) => {
            let colType = col.data_type;
            if (col.data_type === 'USER-DEFINED') colType = `public.${col.udt_name}`;
            else if (col.data_type === 'ARRAY') colType = `${col.udt_name.replace(/^_/, '')}[]`;
            else if (col.data_type === 'character varying') colType = col.char_max_length ? `varchar(${col.char_max_length})` : 'text';
            else if (col.data_type === 'numeric' && col.numeric_precision) colType = `numeric(${col.numeric_precision},${col.numeric_scale || 0})`;
            let def = `  ${col.column_name} ${colType}`;
            if (col.is_nullable === 'NO') def += ' NOT NULL';
            if (col.column_default) def += ` DEFAULT ${col.column_default}`;
            return def;
          });
          if (table.pk) colDefs.push(`  PRIMARY KEY (${table.pk.join(', ')})`);
          sql += colDefs.join(',\n') + '\n);\n\n';
        }

        sql += 'COMMIT;\n';

        const tablesCount = tables.filter((t: any) => !EXCLUDED_TABLES.includes(t.name)).length;

        return new Response(
          JSON.stringify({ success: true, tables_count: tablesCount, enums_count: enums.length, sql }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
