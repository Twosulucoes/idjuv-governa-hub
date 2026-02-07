/**
 * Página de Consulta Pública de Status do Gestor
 * /cadastrogestores/consulta
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, School, ArrowLeft, Loader2, CheckCircle, Clock, AlertCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGestoresEscolares } from '@/hooks/useGestoresEscolares';
import { 
  STATUS_GESTOR_CONFIG, 
  formatarCPF, 
  formatarCelular,
  type GestorEscolar 
} from '@/types/gestoresEscolares';

export default function ConsultaGestorPage() {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'problema':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-blue-500" />;
    }
  };

  const statusConfig = resultado?.status 
    ? STATUS_GESTOR_CONFIG[resultado.status as keyof typeof STATUS_GESTOR_CONFIG]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <School className="h-8 w-8" />
          <div>
            <h1 className="font-bold text-lg">IDJuv - Instituto de Desporto e Juventude</h1>
            <p className="text-sm opacity-90">Credenciamento de Gestores Escolares - JER 2025</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Consultar Status
            </CardTitle>
            <CardDescription>
              Digite seu CPF para consultar o status do seu pré-cadastro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campo de busca */}
            <div className="flex gap-2">
              <Input
                placeholder="Digite seu CPF"
                value={formatarCPF(cpf)}
                onChange={handleCpfChange}
                maxLength={14}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
              <Button onClick={handleBuscar} disabled={buscando || cpf.length < 11}>
                {buscando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Erro */}
            {erro && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md text-sm">
                {erro}
              </div>
            )}

            {/* Resultado: Não encontrado */}
            {resultado === null && (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhum pré-cadastro encontrado para este CPF.
                </p>
                <Link to="/cadastrogestores">
                  <Button variant="link" className="mt-2">
                    Fazer pré-cadastro agora
                  </Button>
                </Link>
              </div>
            )}

            {/* Resultado: Encontrado */}
            {resultado && statusConfig && (
              <div className="space-y-4">
                {/* Dados do gestor */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">{resultado.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {resultado.escola?.nome}
                  </p>
                </div>

                {/* Status */}
                <div className={`p-4 rounded-lg border ${statusConfig.bgColor}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(resultado.status)}
                    <div className="flex-1">
                      <p className={`font-semibold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </p>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {statusConfig.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Próximo passo */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    Próximo passo:
                  </p>
                  <p className="text-sm text-blue-700">
                    {statusConfig.proximoPasso}
                  </p>
                </div>

                {/* Timeline simples */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Progresso:</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${
                      resultado.status !== 'aguardando' ? 'bg-green-500' : 'bg-muted'
                    }`} />
                    <span className="text-xs">Pré-cadastro</span>
                    
                    <div className="flex-1 h-0.5 bg-muted" />
                    
                    <div className={`h-3 w-3 rounded-full ${
                      ['cadastrado_cbde', 'contato_realizado', 'confirmado'].includes(resultado.status) 
                        ? 'bg-green-500' : 'bg-muted'
                    }`} />
                    <span className="text-xs">CBDE</span>
                    
                    <div className="flex-1 h-0.5 bg-muted" />
                    
                    <div className={`h-3 w-3 rounded-full ${
                      ['contato_realizado', 'confirmado'].includes(resultado.status) 
                        ? 'bg-green-500' : 'bg-muted'
                    }`} />
                    <span className="text-xs">Contato</span>
                    
                    <div className="flex-1 h-0.5 bg-muted" />
                    
                    <div className={`h-3 w-3 rounded-full ${
                      resultado.status === 'confirmado' ? 'bg-green-500' : 'bg-muted'
                    }`} />
                    <span className="text-xs">Confirmado</span>
                  </div>
                </div>

                {/* Contato em caso de problema */}
                {resultado.status === 'problema' && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-amber-800 mb-2">
                      Entre em contato:
                    </p>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-amber-700 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        (95) 3621-3232
                      </p>
                      <p className="text-sm text-amber-700 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        esporte@idjuv.rr.gov.br
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Link voltar */}
            <div className="pt-4 border-t">
              <Link to="/cadastrogestores">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Fazer novo pré-cadastro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
