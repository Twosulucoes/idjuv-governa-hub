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
  // Suporta chave em hex (64 chars) ou texto (será hashado)
  let keyData: Uint8Array;
  
  if (/^[a-fA-F0-9]{64}$/.test(keyString)) {
    // Chave em formato hexadecimal (32 bytes = 64 hex chars)
    keyData = hexToBytes(keyString);
  } else {
    // Se não for hex, usar hash SHA-256 da string
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, backupId, backupType } = await req.json();

    // Clientes Supabase
    const supabaseOrigin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const destUrl = Deno.env.get('BACKUP_DEST_SUPABASE_URL');
    const destKey = Deno.env.get('BACKUP_DEST_SERVICE_ROLE_KEY');
    const encryptionKey = Deno.env.get('BACKUP_ENCRYPTION_KEY');

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
        // Testar conexão com Supabase destino
        console.log('Testando conexão com destino:', destUrl);
        
        try {
          const { data, error } = await supabaseDest.storage.listBuckets();
          
          if (error) {
            console.error('Erro ao listar buckets:', error);
            throw new Error(`Falha na conexão: ${error.message}`);
          }

          console.log('Buckets encontrados:', data?.map(b => b.name));

          // Verificar se bucket existe, se não tentar criar
          const bucketExists = data?.some(b => b.name === 'idjuv-backups');
          if (!bucketExists) {
            console.log('Bucket não existe, tentando criar...');
            // Nota: A criação do bucket requer service_role key com permissões adequadas
            // Se falhar, informar o usuário para criar manualmente
            const { error: createError } = await supabaseDest.storage.createBucket('idjuv-backups', {
              public: false
            });
            if (createError) {
              if (createError.message.includes('already exists')) {
                console.log('Bucket já existe');
              } else if (createError.message.includes('row-level security') || createError.message.includes('policy')) {
                // RLS está ativo, o bucket precisa ser criado manualmente
                console.warn('RLS ativo no destino. Bucket deve ser criado manualmente.');
                return new Response(
                  JSON.stringify({ 
                    success: false, 
                    message: 'Conexão OK, mas o bucket "idjuv-backups" precisa ser criado manualmente no projeto de destino. Acesse o Supabase de destino e crie o bucket.',
                    needsManualBucket: true
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              } else {
                throw new Error(`Falha ao criar bucket: ${createError.message}`);
              }
            }
          }

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
        
        // Criar registro de backup
        const { data: backupRecord, error: insertError } = await supabaseOrigin
          .from('backup_history')
          .insert({
            backup_type: type,
            status: 'running',
            triggered_by: user.id,
            trigger_mode: type === 'manual' ? 'manual' : 'auto',
            system_version: '1.0.0'
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
          // 1. Backup do banco de dados via pg_dump simulation
          // Como não temos acesso direto ao pg_dump, vamos exportar tabelas principais
          const tables = [
            'profiles', 'servidores', 'cargos', 'estrutura_organizacional',
            'documentos', 'ferias_servidor', 'licencas_afastamentos',
            'historico_funcional', 'lotacoes', 'agenda_unidade',
            'unidades_locais', 'patrimonio_unidade', 'audit_logs'
          ];

          const dbData: Record<string, unknown[]> = {};
          for (const table of tables) {
            const { data, error } = await supabaseOrigin.from(table).select('*');
            if (!error && data) {
              dbData[table] = data;
            }
          }

          const dbJson = JSON.stringify(dbData, null, 2);
          const dbBytes = new TextEncoder().encode(dbJson);
          dbChecksum = await sha256(dbBytes);

          let dbToUpload = dbBytes;
          let dbFileName = `db/idjuv_prod_${dateTime}.json`;

          if (encryptionKey) {
            const { encrypted, iv } = await encryptData(dbBytes, encryptionKey);
            // Concatenar IV + dados criptografados
            const combined = new Uint8Array(iv.length + encrypted.length);
            combined.set(iv);
            combined.set(encrypted, iv.length);
            dbToUpload = combined;
            dbFileName += '.enc';
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
              for (const file of files.slice(0, 100)) { // Limitar a 100 arquivos por bucket
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

          // 3. Criar manifest
          const manifest = {
            created_at: new Date().toISOString(),
            type,
            system_version: '1.0.0',
            files: {
              db: {
                path: dbFileName,
                size: dbToUpload.length,
                checksum: dbChecksum,
                encrypted: !!encryptionKey
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
            status: 'success'
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
              duration_seconds: duration
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
            _description: `Backup ${type} executado com sucesso`,
            _metadata: { total_size: totalSize, duration }
          });

          return new Response(
            JSON.stringify({
              success: true,
              backupId: backupRecord.id,
              dbFilePath: dbFileName,
              storageFilePath: storageFileName,
              manifestPath: manifestFileName,
              totalSize,
              duration
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (backupError) {
          const errorMessage = backupError instanceof Error ? backupError.message : 'Erro desconhecido';
          // Atualizar registro com erro
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

        // Buscar backup
        const { data: backup } = await supabaseOrigin
          .from('backup_history')
          .select('*')
          .eq('id', backupId)
          .single();

        if (!backup || !backup.manifest_path) {
          throw new Error('Backup não encontrado');
        }

        // Baixar e verificar manifest
        const { data: manifestData } = await supabaseDest.storage
          .from('idjuv-backups')
          .download(backup.manifest_path);

        if (!manifestData) {
          throw new Error('Manifest não encontrado no destino');
        }

        const manifestText = await manifestData.text();
        const manifest = JSON.parse(manifestText);

        // Verificar checksums
        const dbValid = manifest.files.db.checksum === backup.db_checksum;
        const storageValid = manifest.files.storage.checksum === backup.storage_checksum;

        // Registrar verificação
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
        // Listar backups do destino
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
        // Obter configuração de retenção
        const { data: config } = await supabaseOrigin
          .from('backup_config')
          .select('*')
          .single();

        if (!config) {
          throw new Error('Configuração não encontrada');
        }

        const now = new Date();
        let deletedCount = 0;

        // Buscar backups antigos
        const { data: oldBackups } = await supabaseOrigin
          .from('backup_history')
          .select('*')
          .eq('status', 'success')
          .order('started_at', { ascending: true });

        if (oldBackups) {
          const dailyBackups = oldBackups.filter(b => b.backup_type === 'daily');
          const weeklyBackups = oldBackups.filter(b => b.backup_type === 'weekly');
          const monthlyBackups = oldBackups.filter(b => b.backup_type === 'monthly');

          // Limpar diários além da retenção
          const dailyToDelete = dailyBackups.slice(0, Math.max(0, dailyBackups.length - config.retention_daily));
          const weeklyToDelete = weeklyBackups.slice(0, Math.max(0, weeklyBackups.length - config.retention_weekly));
          const monthlyToDelete = monthlyBackups.slice(0, Math.max(0, monthlyBackups.length - config.retention_monthly));

          const toDelete = [...dailyToDelete, ...weeklyToDelete, ...monthlyToDelete];

          for (const backup of toDelete) {
            // Deletar arquivos do destino
            if (backup.db_file_path) {
              await supabaseDest.storage.from('idjuv-backups').remove([backup.db_file_path]);
            }
            if (backup.storage_file_path) {
              await supabaseDest.storage.from('idjuv-backups').remove([backup.storage_file_path]);
            }
            if (backup.manifest_path) {
              await supabaseDest.storage.from('idjuv-backups').remove([backup.manifest_path]);
            }

            // Deletar registro
            await supabaseOrigin.from('backup_history').delete().eq('id', backup.id);
            deletedCount++;
          }
        }

        // Log de auditoria
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
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
