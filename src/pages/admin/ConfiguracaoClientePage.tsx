/**
 * CONFIGURAÇÃO DO CLIENTE
 *
 * Cadastro de tudo que identifica a instituição que usa o sistema: nome do
 * sistema, nome oficial, sigla, CNPJ, base legal, dirigente, endereço, contato
 * e integrações, mais a padronização dos documentos impressos (cor, logos,
 * cabeçalho, rodapé, letra, tabela, orientação) com pré-visualização. Os valores
 * ficam em `dados_oficiais` e valem para o app inteiro (aba, menu, portal e PDFs)
 * sem novo deploy — nada disso fica no código.
 *
 * Ver: admin.configuracao_cliente. Salvar: papel admin (a RLS exige o mesmo).
 * Ver docs/CONFIGURACAO_CLIENTE.md.
 */

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, FileText, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleLayout } from '@/components/layout';
import { ErrorSummary, FormSection, PageHeader } from '@/components/design-system';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  type CampoCliente,
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
  {
    categoria: 'impressao',
    titulo: 'Impressão de documentos',
    descricao: 'Padrão de todos os relatórios, fichas e comprovantes em PDF. Campo vazio usa o padrão do sistema.',
  },
];

const HEX = /^#[0-9a-f]{6}$/i;
/** Contraste mínimo (WCAG AA) da cor de destaque sobre o papel branco; abaixo disso o PDF usa o texto neutro. */
const CONTRASTE_MINIMO = 4.5;

const CNPJ = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
const texto = z.string().trim().max(500, 'Use no máximo 500 caracteres');
const opcional = (schema: z.ZodString) => z.union([schema, z.literal('')]);

// Só http(s): o valor vira link no portal público (z.url() aceitaria javascript:).
const url = opcional(
  z.string().trim().regex(/^https?:\/\/\S+$/i, 'Endereço inválido (comece com https://)')
);

const ESPECIFICOS: Record<string, z.ZodTypeAny> = {
  nome_oficial: texto.min(1, 'Informe o nome oficial'),
  sigla: texto.min(1, 'Informe a sigla').max(30, 'Use no máximo 30 caracteres'),
  cnpj: opcional(z.string().trim().regex(CNPJ, 'CNPJ inválido (ex.: 00.000.000/0000-00)')),
  email_institucional: opcional(z.string().trim().email('E-mail inválido')),
  email_suporte: opcional(z.string().trim().email('E-mail inválido')),
  endereco_uf: opcional(z.string().trim().regex(/^[A-Za-z]{2}$/, 'Use a sigla de 2 letras')),
  site: url,
  diario_oficial_url: url,
  portal_transparencia_url: url,
};

/** Regra derivada do catálogo: lista fechada, cor em hex ou limite de caracteres. */
function regraDoCatalogo(c: CampoCliente): z.ZodTypeAny | undefined {
  if (c.opcoes) {
    const valores = c.opcoes.map((o) => o.valor);
    return z.string().refine((v) => v === '' || valores.includes(v), 'Escolha uma das opções');
  }
  if (c.cor) return opcional(z.string().trim().regex(HEX, 'Use o formato #RRGGBB (ex.: #1E3A5F)'));
  if (c.maximo) return opcional(texto.max(c.maximo, `Use no máximo ${c.maximo} caracteres`));
  return undefined;
}

const schema = z.object({
  ...Object.fromEntries(
    CAMPOS_CLIENTE.map((c) => [c.chave, ESPECIFICOS[c.chave] ?? regraDoCatalogo(c) ?? opcional(texto)])
  ),
  motivo: opcional(texto),
});

type Valores = Record<string, string>;

const ROTULOS: Record<string, string> = {
  ...Object.fromEntries(CAMPOS_CLIENTE.map((c) => [c.chave, c.rotulo])),
  motivo: 'Motivo da alteração',
};

/** Valores do arquivo de instalação (`tenants/<slug>`), sem o banco por cima. */
const DO_ARQUIVO = fallbackDadosOficiais(TENANT_ATIVO);

/** Amostra de cor ao lado do campo e aviso quando o PDF não vai usá-la por falta de contraste. */
function AmostraCor({ valor }: { valor: string }) {
  const [contraste, setContraste] = useState<number | null>(null);
  const valida = HEX.test(valor);

  useEffect(() => {
    if (!valida) return setContraste(null);
    let ativo = true;
    void import('@/lib/documentos').then(({ contraste: medir, hexParaRGB }) => {
      if (ativo) setContraste(medir(hexParaRGB(valor), { r: 255, g: 255, b: 255 }));
    });
    return () => {
      ativo = false;
    };
  }, [valor, valida]);

  if (!valida) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Cor escolhida pela pessoa: só existe em tempo de execução, não é token do tema. */}
      <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded border border-border" style={{ backgroundColor: valor }} />
      {contraste !== null && contraste < CONTRASTE_MINIMO ? (
        <span className="flex items-center gap-1 text-warning">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Cor clara demais para texto no papel: os documentos vão usar cinza escuro no lugar dela.
        </span>
      ) : (
        <span className="text-muted-foreground">Prévia da cor</span>
      )}
    </div>
  );
}

export default function ConfiguracaoClientePage() {
  const { isSuperAdmin, user } = useAuth();
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

  // Recarga dos dados (refetch) não apaga o que a pessoa está digitando.
  useEffect(() => {
    if (!formState.isDirty) reset(iniciais);
  }, [iniciais, reset, formState.isDirty]);

  const previa = nomeDoSistema(
    aplicarDadosOficiais(TENANT_ATIVO, { sistema_nome: watch('sistema_nome') ?? '', sigla: watch('sigla') ?? '' })
  );
  const faltamNoBanco = gravados ? CAMPOS_CLIENTE.filter((c) => !gravados[c.chave] && DO_ARQUIVO[c.chave]).length : 0;

  // Pré-visualização: gera a amostra com o que está no formulário, salvo ou não.
  const [previaPdf, setPreviaPdf] = useState<{ url: string; titulo: string; nomeArquivo: string } | null>(null);
  const [gerandoPrevia, setGerandoPrevia] = useState(false);
  const fecharPrevia = () => {
    if (previaPdf) URL.revokeObjectURL(previaPdf.url);
    setPreviaPdf(null);
  };
  const verExemplo = async (tipo: 'amostra-relatorio' | 'amostra-ficha') => {
    setGerandoPrevia(true);
    try {
      const { motivo: _motivo, ...valores } = form.getValues();
      const tenant = aplicarDadosOficiais(TENANT_ATIVO, valores);
      const { emitirDocumento } = await import('@/lib/documentos');
      const quem = user?.fullName ?? user?.email;
      const { blob, nomeArquivo } = await emitirDocumento(tipo, { solicitante: quem }, { tenant, emitidoPor: quem });
      setPreviaPdf({
        url: URL.createObjectURL(blob),
        titulo: tipo === 'amostra-ficha' ? 'Ficha de exemplo' : 'Relatório de exemplo',
        nomeArquivo,
      });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Tente de novo.';
      toast.error(`Não foi possível gerar o exemplo: ${mensagem}`);
    } finally {
      setGerandoPrevia(false);
    }
  };

  const enviar = handleSubmit(async ({ motivo, ...valores }) => {
    try {
      const { alterados } = await salvar.mutateAsync({ valores, gravados: gravados ?? {}, motivo });
      toast.success(alterados > 0 ? 'Configuração salva.' : 'Nada mudou.');
      // Sem reset manual: a releitura dos dados preenche o formulário (campo apagado volta ao arquivo).
      reset(undefined, { keepValues: true });
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
                          {campo.opcoes ? (
                            <select
                              id={campo.chave}
                              aria-invalid={!!erro}
                              aria-describedby={idAjuda}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              {...register(campo.chave)}
                            >
                              <option value="">Padrão do sistema</option>
                              {campo.opcoes.map((o) => (
                                <option key={o.valor} value={o.valor}>
                                  {o.rotulo}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Campo
                              id={campo.chave}
                              aria-invalid={!!erro}
                              aria-describedby={idAjuda}
                              maxLength={campo.maximo}
                              placeholder={campo.cor ? '#1E3A5F' : undefined}
                              {...register(campo.chave)}
                            />
                          )}
                          {campo.cor && <AmostraCor valor={(watch(campo.chave) ?? '').trim()} />}
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
                    {grupo.categoria === 'impressao' && (
                      <div className="space-y-2 md:col-span-2">
                        <p className="text-sm text-muted-foreground">
                          Veja como os documentos vão sair com os valores acima, antes de salvar.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          {(['amostra-relatorio', 'amostra-ficha'] as const).map((tipo) => (
                            <Button
                              key={tipo}
                              type="button"
                              variant="outline"
                              disabled={gerandoPrevia}
                              onClick={() => void verExemplo(tipo)}
                            >
                              {gerandoPrevia ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                              )}
                              {tipo === 'amostra-ficha' ? 'Ver ficha de exemplo' : 'Ver relatório de exemplo'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
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

      <Dialog open={!!previaPdf} onOpenChange={(aberto) => !aberto && fecharPrevia()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previaPdf?.titulo}</DialogTitle>
            <DialogDescription>Pré-visualização com os valores do formulário. Nada foi salvo.</DialogDescription>
          </DialogHeader>
          {previaPdf && (
            <>
              <iframe title={previaPdf.titulo} src={previaPdf.url} className="h-[65vh] w-full rounded-md border border-border" />
              {/* Celular e alguns navegadores não mostram PDF dentro da página. */}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                  <a href={previaPdf.url} target="_blank" rel="noopener noreferrer">
                    Abrir em outra aba
                  </a>
                </Button>
                <Button asChild>
                  <a href={previaPdf.url} download={previaPdf.nomeArquivo}>
                    Baixar o PDF
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
