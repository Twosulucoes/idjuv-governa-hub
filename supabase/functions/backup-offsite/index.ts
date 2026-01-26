import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// ============================================
// LISTA COMPLETA DE TABELAS DO SISTEMA
// Atualizada em 2026-01-26
// ============================================
const ALL_TABLES = [
  // ===== USUÁRIOS E PERMISSÕES =====
  'profiles',
  'user_roles',
  'user_permissions',
  'user_org_units',
  'user_security_settings',
  'role_permissions',
  'module_access_scopes',
  'perfis',
  'funcoes_sistema',
  'perfil_funcoes',
  'usuario_perfis',
  
  // ===== ESTRUTURA ORGANIZACIONAL =====
  'estrutura_organizacional',
  'cargos',
  'composicao_cargos',
  'cargo_unidade_compatibilidade',
  'centros_custo',
  
  // ===== SERVIDORES E RH =====
  'servidores',
  'lotacoes',
  'memorandos_lotacao',
  'historico_funcional',
  'portarias_servidor',
  'ocorrencias_servidor',
  'ferias_servidor',
  'licencas_afastamentos',
  'cessoes',
  'designacoes',
  'provimentos',
  'vinculos_funcionais',
  'dependentes_irrf',
  'pensoes_alimenticias',
  'consignacoes',
  
  // ===== PRÉ-CADASTROS =====
  'pre_cadastros',
  
  // ===== PONTO E FREQUÊNCIA =====
  'configuracao_jornada',
  'horarios_jornada',
  'registros_ponto',
  'justificativas_ponto',
  'solicitacoes_ajuste_ponto',
  'banco_horas',
  'lancamentos_banco_horas',
  'frequencia_mensal',
  'feriados',
  'viagens_diarias',
  
  // ===== FOLHA DE PAGAMENTO =====
  'folhas_pagamento',
  'lancamentos_folha',
  'fichas_financeiras',
  'itens_ficha_financeira',
  'rubricas',
  'rubricas_historico',
  'parametros_folha',
  'tabela_inss',
  'tabela_irrf',
  'eventos_esocial',
  'exportacoes_folha',
  'bancos_cnab',
  'contas_autarquia',
  'remessas_bancarias',
  'retornos_bancarios',
  'itens_retorno_bancario',
  'config_autarquia',
  
  // ===== UNIDADES LOCAIS =====
  'unidades_locais',
  'agenda_unidade',
  'documentos_cedencia',
  'termos_cessao',
  'patrimonio_unidade',
  'nomeacoes_chefe_unidade',
  
  // ===== FEDERAÇÕES ESPORTIVAS =====
  'federacoes_esportivas',
  'calendario_federacao',
  
  // ===== DOCUMENTOS E APROVAÇÕES =====
  'documentos',
  'approval_requests',
  'approval_delegations',
  
  // ===== REUNIÕES =====
  'reunioes',
  'participantes_reuniao',
  'config_assinatura_reuniao',
  'modelos_mensagem_reuniao',
  'historico_convites_reuniao',
  
  // ===== DEMANDAS ASCOM =====
  'demandas_ascom',
  'demandas_ascom_anexos',
  'demandas_ascom_comentarios',
  'demandas_ascom_entregaveis',
  
  // ===== AUDITORIA E BACKUP =====
  'audit_logs',
  'backup_config',
  'backup_history',
  'backup_integrity_checks'
];

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
    const { action, backupId, backupType, format, tables, since, apiKey } = await req.json();

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
    // ENDPOINT PÚBLICO PARA CONTINGÊNCIA EXTERNA
    // ============================================
    if (action === 'external-export') {
      // Validar API key para acesso externo
      if (!externalApiKey || apiKey !== externalApiKey) {
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
            // Tentar filtrar por updated_at primeiro, depois created_at
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
            'X-Export-Tables': String(exportData.tables_count)
          } 
        }
      );
    }

    // ============================================
    // ENDPOINT PARA LISTAR TABELAS DISPONÍVEIS
    // ============================================
    if (action === 'list-tables') {
      return new Response(
        JSON.stringify({
          success: true,
          tables: ALL_TABLES,
          total: ALL_TABLES.length,
          categories: {
            usuarios_permissoes: ALL_TABLES.slice(0, 11),
            estrutura_organizacional: ALL_TABLES.slice(11, 16),
            servidores_rh: ALL_TABLES.slice(16, 31),
            ponto_frequencia: ALL_TABLES.slice(32, 42),
            folha_pagamento: ALL_TABLES.slice(42, 59),
            unidades_locais: ALL_TABLES.slice(59, 65),
            federacoes: ALL_TABLES.slice(65, 67),
            documentos_aprovacoes: ALL_TABLES.slice(67, 70),
            reunioes: ALL_TABLES.slice(70, 75),
            demandas_ascom: ALL_TABLES.slice(75, 79),
            auditoria_backup: ALL_TABLES.slice(79)
          }
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

    const { data: { user }, error: authError } = await supabaseOrigin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar permissões (TI-admin ou Presidência)
    const { data: userRoles } = await supabaseOrigin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = userRoles?.some(r => 
      r.role === 'ti_admin' || r.role === 'presidencia' || r.role === 'admin'
    );

    if (!hasPermission) {
      throw new Error('Sem permissão para executar backup');
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
            JSON.stringify({ success: true, message: 'Conexão estabelecida com sucesso' }),
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
        const exportFormat = format || 'json'; // json, csv, sql
        
        const { data: backupRecord, error: insertError } = await supabaseOrigin
          .from('backup_history')
          .insert({
            backup_type: type,
            status: 'running',
            triggered_by: user.id,
            trigger_mode: type === 'manual' ? 'manual' : 'auto',
            system_version: '2.0.0',
            metadata: { format: exportFormat, tables_count: ALL_TABLES.length }
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
          // 1. Backup COMPLETO do banco de dados - TODAS as tabelas
          console.log(`[BACKUP] Iniciando backup de ${ALL_TABLES.length} tabelas`);

          const dbData: Record<string, unknown[]> = {};
          const tableStats: Record<string, number> = {};
          
          for (const table of ALL_TABLES) {
            try {
              const { data, error } = await supabaseOrigin.from(table).select('*');
              if (!error && data) {
                dbData[table] = data;
                tableStats[table] = data.length;
              }
            } catch (tableError) {
              console.warn(`[BACKUP] Erro na tabela ${table}:`, tableError);
            }
          }

          // Gerar no formato solicitado
          let dbContent: string;
          let dbContentType: string;
          let dbExtension: string;

          if (exportFormat === 'sql') {
            // SQL PostgreSQL
            const sqlLines = [
              '-- ============================================',
              '-- BACKUP COMPLETO IDJUV',
              `-- Gerado em: ${new Date().toISOString()}`,
              `-- Tabelas: ${Object.keys(dbData).length}`,
              `-- Total de registros: ${Object.values(tableStats).reduce((a, b) => a + b, 0)}`,
              '-- ============================================',
              '',
              'BEGIN;',
              ''
            ];
            
            for (const [table, data] of Object.entries(dbData)) {
              if (data.length > 0) {
                sqlLines.push(jsonToSql(table, data as Record<string, unknown>[]));
              }
            }
            
            sqlLines.push('COMMIT;');
            dbContent = sqlLines.join('\n');
            dbContentType = 'application/sql';
            dbExtension = 'sql';
          } else if (exportFormat === 'csv') {
            // CSV (arquivo ZIP seria ideal, mas simplificamos para JSON com CSVs internos)
            const csvData: Record<string, string> = {};
            for (const [table, data] of Object.entries(dbData)) {
              if (data.length > 0) {
                csvData[table] = jsonToCsv(data as Record<string, unknown>[]);
              }
            }
            dbContent = JSON.stringify({
              format: 'csv',
              exported_at: new Date().toISOString(),
              tables: csvData
            }, null, 2);
            dbContentType = 'application/json';
            dbExtension = 'csv.json';
          } else {
            // JSON padrão
            dbContent = JSON.stringify({
              exported_at: new Date().toISOString(),
              system_version: '2.0.0',
              tables_count: Object.keys(dbData).length,
              total_records: Object.values(tableStats).reduce((a, b) => a + b, 0),
              table_stats: tableStats,
              data: dbData
            }, null, 2);
            dbContentType = 'application/json';
            dbExtension = 'json';
          }

          const dbBytes = new TextEncoder().encode(dbContent);
          dbChecksum = await sha256(dbBytes);

          let dbToUpload = dbBytes;
          let dbFileName = `db/idjuv_prod_${dateTime}.${dbExtension}`;

          if (encryptionKey) {
            const { encrypted, iv } = await encryptData(dbBytes, encryptionKey);
            const combined = new Uint8Array(iv.length + encrypted.length);
            combined.set(iv);
            combined.set(encrypted, iv.length);
            dbToUpload = combined;
            dbFileName += '.enc';
          }

          // Verificar bucket no destino
          const { data: destBuckets, error: destBucketsError } = await supabaseDest.storage.listBuckets();
          if (destBucketsError) {
            throw new Error(`Falha ao acessar buckets do destino: ${destBucketsError.message}`);
          }
          const hasBackupBucket = destBuckets?.some((b) => b.name === 'idjuv-backups');
          if (!hasBackupBucket) {
            throw new Error('Bucket "idjuv-backups" não encontrado no destino.');
          }

          // Upload do banco
          const { error: dbUploadError } = await supabaseDest.storage
            .from('idjuv-backups')
            .upload(dbFileName, dbToUpload, {
              contentType: 'application/octet-stream',
              upsert: true
            });

          if (dbUploadError) {
            throw new Error(`Falha no upload do banco: ${dbUploadError.message}`);
          }

          totalSize += dbToUpload.length;
          console.log(`[BACKUP] Banco exportado: ${dbFileName} (${dbToUpload.length} bytes)`);

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
            system_version: '2.0.0',
            tables: {
              total: ALL_TABLES.length,
              exported: Object.keys(dbData).length,
              list: ALL_TABLES,
              stats: tableStats
            },
            files: {
              db: {
                path: dbFileName,
                size: dbToUpload.length,
                checksum: dbChecksum,
                encrypted: !!encryptionKey,
                format: exportFormat
              },
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
              restore_instructions: 'Para restaurar, importe o arquivo de banco diretamente no PostgreSQL ou use a API de importação.',
              formats_available: ['json', 'csv', 'sql'],
              incremental_field: 'updated_at ou created_at',
              external_access: 'Use action=external-export com API key para exportação via endpoint'
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
              db_file_size: dbToUpload.length,
              db_checksum: dbChecksum,
              storage_file_path: storageFileName,
              storage_file_size: storageToUpload.length,
              storage_checksum: storageChecksum,
              storage_objects_count: Object.values(storageData).flat().length,
              manifest_path: manifestFileName,
              manifest_checksum: manifestChecksum,
              total_size: totalSize,
              duration_seconds: duration,
              metadata: { format: exportFormat, tables_count: Object.keys(dbData).length, table_stats: tableStats }
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
            _description: `Backup ${type} (${exportFormat}) executado com sucesso`,
            _metadata: { total_size: totalSize, duration, format: exportFormat, tables: Object.keys(dbData).length }
          });

          return new Response(
            JSON.stringify({
              success: true,
              backupId: backupRecord.id,
              dbFilePath: dbFileName,
              storageFilePath: storageFileName,
              manifestPath: manifestFileName,
              totalSize,
              duration,
              format: exportFormat,
              tablesExported: Object.keys(dbData).length,
              totalRecords: Object.values(tableStats).reduce((a, b) => a + b, 0)
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

        const dbValid = manifest.files.db.checksum === backup.db_checksum;
        const storageValid = manifest.files.storage.checksum === backup.storage_checksum;

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
          JSON.stringify({ success: true, deletedCount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

        const { data: manifestData } = await supabaseDest.storage
          .from('idjuv-backups')
          .download(backup.manifest_path);

        if (!manifestData) {
          throw new Error('Falha ao baixar manifest');
        }

        const manifest = await manifestData.text();

        return new Response(
          JSON.stringify({ success: true, manifest: JSON.parse(manifest) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

  } catch (error) {
    console.error('Erro no backup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
