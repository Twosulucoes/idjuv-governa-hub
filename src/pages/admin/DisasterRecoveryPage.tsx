import type { ReactNode } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database, FileCheck2, Info, KeyRound, Rocket, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { useNomeSistema, useTenant } from "@/core/tenant";

/**
 * Página informativa: explica o caminho real de recuperação (backup cifrado fora do servidor,
 * banco novo pelo baseline e front publicado pelo CI). Não oferece download de arquivo: o antigo
 * "schema completo" era um dump antigo e parcial e foi retirado. O passo a passo operacional vive
 * na documentação do repositório (docs/BACKUP.md, docs/NOVO_BANCO.md, docs/DESENVOLVIMENTO.md).
 */

interface Camada {
  numero: number;
  titulo: string;
  descricao: string;
  icone: ReactNode;
  itens: ReactNode[];
  guia: string;
}

const CAMADAS: Camada[] = [
  {
    numero: 1,
    titulo: "Backup diário automático, cifrado e fora do servidor",
    descricao: "É o que permite voltar com os dados se o servidor for perdido.",
    icone: <Database className="h-5 w-5 text-success" aria-hidden="true" />,
    itens: [
      "Todo dia, uma rotina agendada no servidor copia o banco inteiro, os papéis do Postgres e os arquivos anexados (Storage).",
      "A cópia é cifrada antes de sair do servidor; lá fica só a chave pública. A chave que abre o backup fica com o responsável, fora do servidor.",
      "O destino é um armazenamento externo, separado do servidor, com retenção de cópias diárias, semanais e mensais.",
      "Um vigia diário reprova (e avisa por e-mail) se o backup do dia não chegou ao destino.",
      "Todo mês um teste automático baixa o backup mais recente, restaura num banco descartável e confere as contagens com o manifesto.",
      "Os segredos que o banco não guarda (configuração do Supabase e chave do cofre) vão num pacote cifrado à parte, semanal, em destino e credencial separados.",
    ],
    guia: "docs/BACKUP.md",
  },
  {
    numero: 2,
    titulo: "Banco novo do zero pelo baseline",
    descricao: "Recria toda a estrutura com segurança de acesso (RLS) já ligada, antes de restaurar os dados.",
    icone: <ShieldCheck className="h-5 w-5 text-info" aria-hidden="true" />,
    itens: [
      "Suba o Supabase self-hosted (com a mesma versão de imagem, numa recuperação real) e troque todos os segredos de exemplo.",
      "Aplique o baseline do repositório (supabase/baseline): ele cria tabelas, funções, políticas de acesso e buckets numa única transação.",
      "Para recuperar dados, restaure o backup cifrado do dia (banco e arquivos) seguindo o procedimento de restauração do guia de backup.",
      "Num banco vazio, crie e promova o primeiro administrador pelo script de bootstrap; os demais usuários entram pelo próprio sistema.",
      "Antes de liberar o acesso, rode as conferências do guia e teste login, uma listagem de cada módulo e o download de um anexo.",
    ],
    guia: "docs/NOVO_BANCO.md",
  },
  {
    numero: 3,
    titulo: "Front publicado pelo CI",
    descricao: "O código está no repositório; não há build manual nem cópia à mão para o servidor.",
    icone: <Rocket className="h-5 w-5 text-accent" aria-hidden="true" />,
    itens: [
      "A cada merge na branch principal, o CI só publica o front depois do gate de qualidade verde e das migrações do mesmo commit aplicadas.",
      "As migrações do banco também são aplicadas pelo CI, com aprovação no ambiente de produção.",
      "Num servidor novo, basta apontar as variáveis do front para o novo Supabase e rodar de novo o workflow de publicação.",
      "As Edge Functions são publicadas pelo CI; seus segredos ficam só no servidor, nunca no front.",
    ],
    guia: "docs/DESENVOLVIMENTO.md",
  },
];

const DisasterRecoveryPage = () => {
  const nomeSistema = useNomeSistema();
  const { contato } = useTenant();
  const emailSuporte = contato?.emailSuporte ?? contato?.email;

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6 pb-10">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Disaster recovery" }]}
          titulo="Disaster recovery"
          descricao={`Como o ${nomeSistema} volta ao ar se o servidor for perdido`}
        />

        <Alert>
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Página informativa</AlertTitle>
          <AlertDescription>
            A recuperação não depende de arquivo baixado desta tela. Ela se apoia em três camadas, cada uma com
            o passo a passo na documentação do repositório. As chaves e credenciais ficam com o responsável
            técnico e nunca são exibidas no sistema.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {CAMADAS.map((camada) => (
            <Card key={camada.numero}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {camada.numero}
                  </span>
                  {camada.icone}
                  {camada.titulo}
                </CardTitle>
                <CardDescription>{camada.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {camada.itens.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <FileCheck2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Passo a passo: <code className="rounded bg-muted px-1 py-0.5">{camada.guia}</code> no repositório.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-warning" aria-hidden="true" />
              Antes de precisar
            </CardTitle>
            <CardDescription>O que precisa estar garantido para a recuperação funcionar</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>A chave privada do backup guardada em cofre de senhas pelo responsável: sem ela, nenhum backup pode ser lido.</li>
              <li>O teste mensal de restauração e o vigia diário verdes na aba Actions do repositório.</li>
              <li>Um ensaio de restauração depois de toda atualização de versão do Supabase no servidor.</li>
            </ul>
            {emailSuporte && (
              <p className="mt-4 text-sm text-muted-foreground">
                Suporte técnico: <span className="font-medium text-foreground">{emailSuporte}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default DisasterRecoveryPage;
