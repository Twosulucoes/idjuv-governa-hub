import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, Database, Code, FileDown, CheckCircle2, 
  AlertTriangle, Copy, ExternalLink, Server, GitBranch,
  Download, Upload, RefreshCw, Clock, Zap
} from "lucide-react";
import { toast } from "sonner";

const DisasterRecoveryPage = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const steps = [
    {
      id: 1,
      title: "Criar Projeto Supabase",
      description: "Crie um novo projeto no Supabase Dashboard",
      details: [
        "Acesse https://supabase.com/dashboard",
        "Clique em 'New Project'",
        "Escolha a organização e região (preferencialmente São Paulo)",
        "Defina nome e senha do banco",
        "Aguarde a criação (~2 minutos)"
      ]
    },
    {
      id: 2,
      title: "Executar Schema SQL",
      description: "Crie toda a estrutura de tabelas no novo banco",
      details: [
        "No painel do Supabase, vá em 'SQL Editor'",
        "Baixe o arquivo schema-completo.sql deste sistema",
        "Cole e execute o SQL no editor",
        "Verifique se todas as tabelas foram criadas"
      ]
    },
    {
      id: 3,
      title: "Restaurar Dados do Backup",
      description: "Importe os dados do último backup",
      details: [
        "Acesse o bucket 'idjuv-backups' no projeto de backup",
        "Baixe os arquivos mais recentes (db/*.json e storage/*.json)",
        "Se criptografados, descriptografe com a chave de backup",
        "Use o SQL Editor para inserir os dados JSON em cada tabela"
      ]
    },
    {
      id: 4,
      title: "Configurar Autenticação",
      description: "Configure as credenciais de autenticação",
      details: [
        "Vá em Authentication → Settings",
        "Configure SMTP para emails (ou use o padrão do Supabase)",
        "Ative 'Enable email confirmations' se necessário",
        "Configure as URLs de redirecionamento"
      ]
    },
    {
      id: 5,
      title: "Criar Usuário Admin",
      description: "Crie o primeiro usuário administrador",
      details: [
        "Vá em Authentication → Users",
        "Clique em 'Add user' → 'Create new user'",
        "Após criar, execute SQL para dar role admin:",
        "INSERT INTO user_roles (user_id, role) VALUES ('UUID_DO_USER', 'admin');"
      ]
    },
    {
      id: 6,
      title: "Deploy da Aplicação",
      description: "Faça deploy do código em um novo servidor",
      details: [
        "Clone o repositório do GitHub",
        "Configure as variáveis de ambiente (.env):",
        "  VITE_SUPABASE_URL = url do novo projeto",
        "  VITE_SUPABASE_PUBLISHABLE_KEY = anon key",
        "Execute: npm install && npm run build",
        "Faça deploy em Vercel, Netlify ou servidor próprio"
      ]
    }
  ];

  const schemaUrl = "/disaster-recovery/schema-completo.sql";

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Disaster Recovery
            </h1>
            <p className="text-muted-foreground">
              Documentação completa para recuperação do sistema em caso de desastre
            </p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Backup Ativo
          </Badge>
        </div>

        {/* Alertas */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Este documento contém procedimentos críticos. Mantenha uma cópia offline 
            (PDF ou impresso) em local seguro. Os backups automáticos rodam diariamente às 02:00.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="restore">Restauração</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-500" />
                    Código
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">GitHub sincronizado</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Código versionado e sincronizado automaticamente com GitHub
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-500" />
                    Banco de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Backup diário às 02:00</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      40 tabelas, dados completos, criptografado AES-256
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="h-5 w-5 text-purple-500" />
                    Storage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileDown className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Arquivos incluídos</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Bucket 'documentos' com todos os arquivos do sistema
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo de Redundância */}
            <Card>
              <CardHeader>
                <CardTitle>Estratégia de Redundância</CardTitle>
                <CardDescription>
                  Três camadas de proteção para garantir continuidade do serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                      <Code className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">1. Código-fonte (GitHub)</h4>
                      <p className="text-sm text-muted-foreground">
                        Repositório Git sincronizado bidirecionalmente com Lovable. 
                        Qualquer alteração é automaticamente versionada.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                      <Database className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">2. Banco de Dados (Supabase Externo)</h4>
                      <p className="text-sm text-muted-foreground">
                        Backup completo de 40 tabelas exportado diariamente para projeto 
                        Supabase separado. Criptografado com AES-256-GCM.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                      <Server className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">3. Arquivos/Storage (Supabase Externo)</h4>
                      <p className="text-sm text-muted-foreground">
                        Todos os documentos e arquivos do bucket 'documentos' são 
                        incluídos no backup diário.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração Atual de Backup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Agendamento</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Diário:</strong> 02:00 (todos os dias)</p>
                      <p><strong>Retenção:</strong> 7 dias</p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Segurança</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Criptografia:</strong> AES-256-GCM</p>
                      <p><strong>Checksum:</strong> SHA-256</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Dados Incluídos (40 tabelas)</h4>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {[
                      "profiles", "user_roles", "user_permissions", "servidores",
                      "cargos", "estrutura_organizacional", "lotacoes", "ferias_servidor",
                      "licencas_afastamentos", "historico_funcional", "registros_ponto",
                      "banco_horas", "unidades_locais", "agenda_unidade", "documentos",
                      "audit_logs", "... e mais 24 tabelas"
                    ].map((table, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button asChild variant="outline">
                  <a href="/admin/backup-offsite">
                    <Zap className="h-4 w-4 mr-2" />
                    Ir para Gestão de Backup
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restauração */}
          <TabsContent value="restore" className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Procedimento de Emergência</AlertTitle>
              <AlertDescription>
                Siga estes passos na ordem exata. Tempo estimado: 30-60 minutos.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {steps.map((step) => (
                <Card key={step.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {step.id}
                      </span>
                      {step.title}
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Script de Restauração de Dados */}
            <Card>
              <CardHeader>
                <CardTitle>Script de Restauração de Dados</CardTitle>
                <CardDescription>
                  Após criar as tabelas, use este template para inserir dados do backup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`-- 1. Descriptografar o arquivo JSON do backup (se necessário)
-- Use uma ferramenta de descriptografia AES-256-GCM

-- 2. Para cada tabela no JSON, inserir os dados:
-- Exemplo para profiles:

INSERT INTO public.profiles (id, full_name, email, avatar_url, created_at, updated_at)
SELECT 
  (value->>'id')::uuid,
  value->>'full_name',
  value->>'email',
  value->>'avatar_url',
  (value->>'created_at')::timestamptz,
  (value->>'updated_at')::timestamptz
FROM json_array_elements('[DADOS_JSON_AQUI]'::json) as value;

-- Repita para cada tabela, respeitando a ordem de dependências`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`-- Script de restauração...`, 'restore-script')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recursos */}
          <TabsContent value="resources" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <a href={schemaUrl} download>
                      <FileDown className="h-4 w-4 mr-2" />
                      Schema Completo (SQL)
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Script SQL completo com todas as tabelas, tipos, funções, triggers e políticas RLS.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Links Úteis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Supabase Dashboard
                    </a>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <a href="https://github.com" target="_blank" rel="noopener">
                      <GitBranch className="h-4 w-4 mr-2" />
                      GitHub (Repositório)
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Variáveis de Ambiente */}
            <Card>
              <CardHeader>
                <CardTitle>Variáveis de Ambiente Necessárias</CardTitle>
                <CardDescription>
                  Configure estas variáveis no novo ambiente de deploy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`# Arquivo .env para o frontend
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
VITE_SUPABASE_PROJECT_ID=seu_projeto_id

# Secrets para Edge Functions (configurar no Supabase Dashboard)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
BACKUP_DEST_SUPABASE_URL=https://BACKUP_PROJETO.supabase.co
BACKUP_DEST_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
BACKUP_ENCRYPTION_KEY=sua_chave_hex_64_caracteres`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`VITE_SUPABASE_URL=...`, 'env')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contatos de Emergência */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Contatos de Emergência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded">
                    <p className="font-medium">TI - Suporte</p>
                    <p className="text-muted-foreground">ti@idjuv.rr.gov.br</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">Supabase Support</p>
                    <p className="text-muted-foreground">support@supabase.io</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
};

export default DisasterRecoveryPage;
