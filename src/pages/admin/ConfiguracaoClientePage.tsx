/**
 * CONFIGURAÇÃO DO CLIENTE
 *
 * Cadastro de tudo que identifica a instituição que usa o sistema: nome do
 * sistema, nome oficial, sigla, CNPJ, base legal, dirigente, endereço, contato
 * e integrações. Os valores ficam em `dados_oficiais` e valem para o app
 * inteiro (aba, menu, portal e PDFs) sem novo deploy — nada disso fica no código.
 *
 * Ver: admin.configuracao_cliente. Salvar: papel admin (a RLS exige o mesmo).
 * Ver docs/CONFIGURACAO_CLIENTE.md.
 */

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleLayout } from '@/components/layout';
import { ErrorSummary, FormSection, PageHeader } from '@/components/design-system';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import {
  CAMPOS_CLIENTE,
  TENANT_ATIVO,
  fallbackDadosOficiais,
  nomeDoSistema,
  aplicarDadosOficiais,
  type CategoriaCampoCliente,
} from '@/core/tenant';
import { useConfiguracaoCliente, useSalvarConfiguracaoCliente } from '@/hooks/useConfiguracaoCliente';

const GRUPOS: { categoria: CategoriaCampoCliente; titulo: string; descricao: string }[] = [
  { categoria: 'sistema', titulo: 'Sistema', descricao: 'Nome do produto mostrado na aba do navegador, no menu e no rodapé dos documentos.' },
  { categoria: 'identificacao', titulo: 'Identificação da instituição', descricao: 'Como a instituição aparece nas telas, no portal e nos documentos.' },
  { categoria: 'vinculacao', titulo: 'Vinculação', descricao: 'A quem a instituição está ligada.' },
  { categoria: 'legal', titulo: 'Base legal', descricao: 'Dados de constituição usados nos atos e nas páginas de governança.' },
  { categoria: 'dirigente', titulo: 'Dirigente', descricao: 'Quem responde pela instituição.' },
  { categoria: 'endereco', titulo: 'Endereço', descricao: 'Sede da instituição.' },
  { categoria: 'contato', titulo: 'Contato e redes sociais', descricao: 'Canais exibidos no portal e no rodapé.' },
  { categoria: 'integracoes', titulo: 'Integrações', descricao: 'Endereços de sistemas externos.' },
];

const CNPJ = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
const texto = z.string().trim().max(500, 'Use no máximo 500 caracteres');
const opcional = (schema: z.ZodString) => z.union([schema, z.literal('')]);

const ESPECIFICOS: Record<string, z.ZodTypeAny> = {
  nome_oficial: texto.min(1, 'Informe o nome oficial'),
  sigla: texto.min(1, 'Informe a sigla').max(30, 'Use no máximo 30 caracteres'),
  cnpj: opcional(z.string().trim().regex(CNPJ, 'CNPJ inválido (ex.: 00.000.000/0000-00)')),
  email_institucional: opcional(z.string().trim().email('E-mail inválido')),
  email_suporte: opcional(z.string().trim().email('E-mail inválido')),
  endereco_uf: opcional(z.string().trim().regex(/^[A-Za-z]{2}$/, 'Use a sigla de 2 letras')),
  site: opcional(z.string().trim().url('Endereço inválido (comece com https://)')),
  diario_oficial_url: opcional(z.string().trim().url('Endereço inválido (comece com https://)')),
  portal_transparencia_url: opcional(z.string().trim().url('Endereço inválido (comece com https://)')),
};

const schema = z.object({
  ...Object.fromEntries(CAMPOS_CLIENTE.map((c) => [c.chave, ESPECIFICOS[c.chave] ?? opcional(texto)])),
  motivo: opcional(texto),
});

type Valores = Record<string, string>;

const ROTULOS: Record<string, string> = {
  ...Object.fromEntries(CAMPOS_CLIENTE.map((c) => [c.chave, c.rotulo])),
  motivo: 'Motivo da alteração',
};

/** Valores do arquivo de instalação (`tenants/<slug>`), sem o banco por cima. */
const DO_ARQUIVO = fallbackDadosOficiais(TENANT_ATIVO);

export default function ConfiguracaoClientePage() {
  const { isSuperAdmin } = useAuth();
  const podeEditar = isSuperAdmin;
  const { data: gravados, isLoading, error } = useConfiguracaoCliente();
  const salvar = useSalvarConfiguracaoCliente();

  const iniciais = useMemo<Valores>(() => {
    const valores: Valores = { motivo: '' };
    for (const campo of CAMPOS_CLIENTE) {
      valores[campo.chave] = gravados?.[campo.chave]?.valor ?? DO_ARQUIVO[campo.chave] ?? '';
    }
    return valores;
  }, [gravados]);

  const form = useForm<Valores>({ resolver: zodResolver(schema), defaultValues: iniciais });
  const { register, handleSubmit, reset, watch, formState } = form;

  useEffect(() => {
    reset(iniciais);
  }, [iniciais, reset]);

  const previa = nomeDoSistema(
    aplicarDadosOficiais(TENANT_ATIVO, { sistema_nome: watch('sistema_nome') ?? '', sigla: watch('sigla') ?? '' })
  );
  const faltamNoBanco = gravados ? CAMPOS_CLIENTE.filter((c) => !gravados[c.chave] && DO_ARQUIVO[c.chave]).length : 0;

  const enviar = handleSubmit(async ({ motivo, ...valores }) => {
    try {
      const { alterados } = await salvar.mutateAsync({ valores, gravados: gravados ?? {}, motivo });
      toast.success(alterados > 0 ? 'Configuração salva.' : 'Nada mudou.');
      reset({ ...valores, motivo: '' });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Tente de novo.';
      toast.error(`Não foi possível salvar: ${mensagem}`);
    }
  });

  return (
    <ModuleLayout module="admin">
      <PageHeader
        migalhas={[{ rotulo: 'Administração', href: '/admin' }, { rotulo: 'Configuração do cliente' }]}
        titulo="Configuração do cliente"
        descricao="Dados da instituição e nome do sistema. Valem para as telas, o portal e os documentos assim que você salva."
      />

      {!podeEditar && (
        <Alert className="mb-4">
          <AlertDescription>Você pode consultar, mas só um administrador altera estes dados.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Não foi possível ler a configuração salva. Os valores abaixo são os do arquivo de instalação.</AlertDescription>
        </Alert>
      )}
      {podeEditar && faltamNoBanco > 0 && (
        <Alert className="mb-4">
          <AlertDescription>
            {faltamNoBanco === 1 ? '1 campo ainda vem' : `${faltamNoBanco} campos ainda vêm`} do arquivo de instalação. Confira
            e salve para que passem a ficar no banco.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <form onSubmit={enviar} noValidate>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <ErrorSummary erros={formState.errors} envios={formState.submitCount} rotulos={ROTULOS} />
              <fieldset disabled={!podeEditar || salvar.isPending} className="space-y-6">
                {GRUPOS.map((grupo) => (
                  <FormSection key={grupo.categoria} titulo={grupo.titulo} descricao={grupo.descricao}>
                    {CAMPOS_CLIENTE.filter((c) => c.categoria === grupo.categoria).map((campo) => {
                      const erro = formState.errors[campo.chave]?.message;
                      const idAjuda = `${campo.chave}-ajuda`;
                      const doArquivo = gravados && !gravados[campo.chave] && DO_ARQUIVO[campo.chave];
                      const Campo = campo.longo ? Textarea : Input;
                      return (
                        <div key={campo.chave} className={campo.longo ? 'space-y-1.5 md:col-span-2' : 'space-y-1.5'}>
                          <Label htmlFor={campo.chave}>{campo.rotulo}</Label>
                          <Campo
                            id={campo.chave}
                            aria-invalid={!!erro}
                            aria-describedby={idAjuda}
                            {...register(campo.chave)}
                          />
                          <p id={idAjuda} className="text-sm text-muted-foreground">
                            {erro ? (
                              <span className="text-destructive">{String(erro)}</span>
                            ) : (
                              [campo.ajuda, doArquivo ? 'Ainda não salvo no banco.' : null].filter(Boolean).join(' ')
                            )}
                          </p>
                          {campo.chave === 'sistema_nome' && (
                            <p className="text-sm text-foreground">
                              Vai aparecer como: <strong>{previa}</strong>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </FormSection>
                ))}

                <FormSection titulo="Registro" descricao="Fica gravado junto com os campos alterados." colunas={1}>
                  <div className="space-y-1.5">
                    <Label htmlFor="motivo">Motivo da alteração (opcional)</Label>
                    <Input id="motivo" placeholder="Ex.: posse do novo presidente" {...register('motivo')} />
                  </div>
                </FormSection>
              </fieldset>

              {podeEditar && (
                <div className="flex justify-end">
                  <Button type="submit" disabled={salvar.isPending}>
                    {salvar.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    Salvar configuração
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      )}
    </ModuleLayout>
  );
}
