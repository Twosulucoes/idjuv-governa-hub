/**
 * Página de Consulta Pública de Status do Gestor
 * /cadastrogestores/consulta
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Loader2, AlertCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { SkipLink, StatusBadge, type TomStatus } from '@/components/design-system';
import { useGestoresEscolares } from '@/hooks/useGestoresEscolares';
import { 
  STATUS_GESTOR_CONFIG, 
  formatarCPF, 
  type GestorEscolar 
} from '@/types/gestoresEscolares';
import { HeaderPublico } from '@/components/cadastrogestores/HeaderPublico';

import { useTenant } from '@/core/tenant';

// Situação do pré-cadastro → tom do selo. Valor fora do mapa cai em neutro.
const TOM_STATUS_GESTOR: Record<string, TomStatus> = {
  aguardando: 'pendente',
  em_processamento: 'andamento',
  cadastrado_cbde: 'andamento',
  contato_realizado: 'andamento',
  confirmado: 'sucesso',
  problema: 'erro',
};

export default function ConsultaGestorPage() {
  const { contato } = useTenant();
  const [cpf, setCpf] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<GestorEscolar | null | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);

  const { buscarPorCpf } = useGestoresEscolares();

  const handleBuscar = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setErro('Digite um CPF válido (11 dígitos)');
      return;
    }

    setErro(null);
    setBuscando(true);

    try {
      const gestor = await buscarPorCpf(cpfLimpo);
      setResultado(gestor);
    } catch (error) {
      console.error('Erro na busca:', error);
      setErro('Erro ao consultar. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCpf(valor);
    setResultado(undefined);
    setErro(null);
  };

  const statusConfig = resultado?.status 
    ? STATUS_GESTOR_CONFIG[resultado.status as keyof typeof STATUS_GESTOR_CONFIG]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <SkipLink />
      <HeaderPublico 
        titulo="Consulta de situação" 
        subtitulo="Acompanhe seu pré-cadastro - JER's 2026" 
      />

      <main id="conteudo" tabIndex={-1} className="container mx-auto px-4 py-8 focus:outline-none">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <h2 className="text-h3 leading-tight tracking-tight flex items-center gap-2">
              <Search className="h-5 w-5" aria-hidden="true" />
              Consultar situação
            </h2>
            <CardDescription className="text-base">
              Digite seu CPF para consultar o status do seu pré-cadastro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campo de busca */}
            <div className="flex gap-2">
              <label htmlFor="cpf-consulta" className="sr-only">CPF</label>
              <Input
                id="cpf-consulta"
                inputMode="numeric"
                aria-describedby={erro ? 'cpf-consulta-erro' : undefined}
                aria-invalid={erro ? true : undefined}
                placeholder="Digite seu CPF"
                value={formatarCPF(cpf)}
                onChange={handleCpfChange}
                maxLength={14}
                className="flex-1 h-11"
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
              <Button onClick={handleBuscar} disabled={buscando || cpf.length < 11} className="h-11" aria-label="Consultar CPF">
                {buscando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>

            {/* Erro */}
            {erro && (
              <div id="cpf-consulta-erro" role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md text-base">
                {erro}
              </div>
            )}

            {/* Resultado: Não encontrado */}
            {resultado === null && (
              <div className="text-center py-6" role="status">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
                <p className="text-muted-foreground">
                  Nenhum pré-cadastro encontrado para este CPF.
                </p>
                <Button variant="link" className="mt-2" asChild>
                  <Link to="/cadastrogestores">Fazer pré-cadastro agora</Link>
                </Button>
              </div>
            )}

            {/* Resultado: Encontrado */}
            {resultado && statusConfig && (
              <div className="space-y-4">
                {/* Dados do gestor */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">{resultado.nome}</p>
                  <p className="text-base text-muted-foreground">
                    {resultado.escola?.nome}
                  </p>
                </div>

                {/* Status */}
                <div className="p-4 rounded-lg border border-border bg-card">
                  <StatusBadge tom={TOM_STATUS_GESTOR[resultado.status] ?? 'neutro'}>
                    {statusConfig.label ?? resultado.status ?? 'Sem situação'}
                  </StatusBadge>
                  <p className="text-base mt-2 text-muted-foreground">
                    {statusConfig.description}
                  </p>
                </div>

                {/* Próximo passo */}
                <div className="bg-info/10 border border-info/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-info mb-1">
                    Próximo passo:
                  </p>
                  <p className="text-base text-foreground">
                    {statusConfig.proximoPasso}
                  </p>
                </div>

                {/* Timeline simples */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground" id="progresso-gestor">Progresso:</p>
                  <ol aria-labelledby="progresso-gestor" className="flex items-center gap-2">
                    {[
                      { rotulo: 'Pré-cadastro', feito: resultado.status !== 'aguardando' },
                      { rotulo: 'CBDE', feito: ['cadastrado_cbde', 'contato_realizado', 'confirmado'].includes(resultado.status) },
                      { rotulo: 'Contato', feito: ['contato_realizado', 'confirmado'].includes(resultado.status) },
                      { rotulo: 'Confirmado', feito: resultado.status === 'confirmado' },
                    ].map((etapa, indice) => (
                      <li key={etapa.rotulo} className={`flex items-center gap-2 ${indice > 0 ? 'flex-1' : ''}`}>
                        {indice > 0 && <div className="flex-1 h-0.5 bg-muted" aria-hidden="true" />}
                        <div className={`h-3 w-3 rounded-full ${etapa.feito ? 'bg-success' : 'bg-muted'}`} aria-hidden="true" />
                        <span className="text-xs">
                          {etapa.rotulo}
                          <span className="sr-only">{etapa.feito ? ' (concluída)' : ' (pendente)'}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Contato em caso de problema */}
                {resultado.status === 'problema' && (
                  <div className="bg-warning/15 border border-warning/40 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-warning mb-2">
                      Entre em contato:
                    </p>
                    <div className="flex flex-col gap-1">
                      <p className="text-base text-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" aria-hidden="true" />
                        {contato?.telefone}
                      </p>
                      <p className="text-base text-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        {contato?.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Link voltar */}
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/cadastrogestores">
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  Fazer novo pré-cadastro
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
