/**
 * Dialog com detalhes completos do gestor
 */

import { useState } from 'react';
import { 
  User, 
  School, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Loader2,
  UserPlus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useGestoresEscolares } from '@/hooks/useGestoresEscolares';
import { useAuth } from '@/contexts/AuthContext';
import { 
  STATUS_GESTOR_CONFIG, 
  formatarCPF, 
  formatarCelular,
  type StatusGestor 
} from '@/types/gestoresEscolares';

interface Props {
  gestorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GestorDetalhesDialog({ gestorId, open, onOpenChange }: Props) {
  const [novaObservacao, setNovaObservacao] = useState('');
  const [mostrarObsForm, setMostrarObsForm] = useState(false);
  
  const { user } = useAuth();
  const { 
    gestores, 
    assumirTarefa,
    marcarCadastradoCbde,
    marcarContatoRealizado,
    confirmarAcesso,
    marcarProblema,
    adicionarObservacao,
  } = useGestoresEscolares();

  const gestor = gestores.find((g) => g.id === gestorId);
  if (!gestor) return null;

  const statusConfig = STATUS_GESTOR_CONFIG[gestor.status as StatusGestor];

  const handleAssumir = async () => {
    if (!user) return;
    await assumirTarefa.mutateAsync({
      gestorId: gestor.id,
      responsavelId: user.id,
      responsavelNome: user.email || '',
    });
  };

  const handleAdicionarObs = async () => {
    if (!novaObservacao.trim()) return;
    await adicionarObservacao.mutateAsync({
      gestorId: gestor.id,
      observacao: novaObservacao.trim(),
    });
    setNovaObservacao('');
    setMostrarObsForm(false);
  };

  const handleMarcarProblema = async () => {
    const motivo = prompt('Descreva o problema:');
    if (!motivo) return;
    await marcarProblema.mutateAsync({
      gestorId: gestor.id,
      observacao: motivo,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Gestor
          </DialogTitle>
          <DialogDescription>
            Informações completas e ações disponíveis
          </DialogDescription>
        </DialogHeader>

        {/* Status */}
        <div className={`p-4 rounded-lg ${statusConfig.bgColor}`}>
          <div className="flex items-center justify-between">
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-sm`}>
              {statusConfig.label}
            </Badge>
            {gestor.responsavel_nome && (
              <span className="text-sm text-muted-foreground">
                Responsável: {gestor.responsavel_nome}
              </span>
            )}
          </div>
          <p className="text-sm mt-2 text-muted-foreground">
            {statusConfig.description}
          </p>
        </div>

        <Separator />

        {/* Dados do Gestor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados Pessoais
            </h4>
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {gestor.nome}</p>
              <p><strong>CPF:</strong> {formatarCPF(gestor.cpf)}</p>
              {gestor.rg && <p><strong>RG:</strong> {gestor.rg}</p>}
              {gestor.data_nascimento && (
                <p><strong>Nascimento:</strong> {new Date(gestor.data_nascimento).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <School className="h-4 w-4" />
              Escola
            </h4>
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {gestor.escola?.nome}</p>
              {gestor.escola?.municipio && (
                <p><strong>Município:</strong> {gestor.escola.municipio}</p>
              )}
              {gestor.escola?.inep && (
                <p><strong>INEP:</strong> {gestor.escola.inep}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Contato */}
        <div>
          <h4 className="font-semibold mb-3">Contato</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {gestor.email}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {formatarCelular(gestor.celular)}
            </span>
          </div>
          {gestor.endereco && (
            <p className="text-sm mt-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {gestor.endereco}
            </p>
          )}
        </div>

        <Separator />

        {/* Timeline */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico
          </h4>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <strong>Pré-cadastro:</strong> {new Date(gestor.created_at).toLocaleString('pt-BR')}
            </p>
            {gestor.data_cadastro_cbde && (
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <strong>Cadastrado CBDE:</strong> {new Date(gestor.data_cadastro_cbde).toLocaleString('pt-BR')}
              </p>
            )}
            {gestor.data_contato && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <strong>Contato realizado:</strong> {new Date(gestor.data_contato).toLocaleString('pt-BR')}
              </p>
            )}
            {gestor.data_confirmacao && (
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <strong>Acesso confirmado:</strong> {new Date(gestor.data_confirmacao).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {/* Observações */}
        {(gestor.observacoes || mostrarObsForm) && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Observações
              </h4>
              {gestor.observacoes && (
                <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap mb-3">
                  {gestor.observacoes}
                </div>
              )}
              {mostrarObsForm && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Digite a observação..."
                    value={novaObservacao}
                    onChange={(e) => setNovaObservacao(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleAdicionarObs}
                      disabled={adicionarObservacao.isPending}
                    >
                      {adicionarObservacao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setMostrarObsForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!mostrarObsForm && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMostrarObsForm(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Observação
            </Button>
          )}

          {gestor.status !== 'problema' && gestor.status !== 'confirmado' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarcarProblema}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Problema
            </Button>
          )}

          {gestor.status === 'aguardando' && (
            <Button size="sm" onClick={handleAssumir}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assumir Tarefa
            </Button>
          )}

          {gestor.status === 'em_processamento' && (
            <Button size="sm" onClick={() => marcarCadastradoCbde.mutateAsync(gestor.id)}>
              <Mail className="h-4 w-4 mr-2" />
              Cadastrado CBDE
            </Button>
          )}

          {gestor.status === 'cadastrado_cbde' && (
            <Button size="sm" onClick={() => marcarContatoRealizado.mutateAsync(gestor.id)}>
              <Phone className="h-4 w-4 mr-2" />
              Contato Realizado
            </Button>
          )}

          {gestor.status === 'contato_realizado' && (
            <Button size="sm" onClick={() => confirmarAcesso.mutateAsync(gestor.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Acesso
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
