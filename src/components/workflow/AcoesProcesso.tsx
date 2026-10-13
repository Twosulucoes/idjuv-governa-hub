/**
 * Ações do processo (avançar, devolver, suspender, reativar, concluir, arquivar), por permissão e situação.
 * Toda escrita vai pelas RPCs wf_*; o banco repete as regras (RLS/RPC são a fronteira real, aqui é só UX).
 */
import { useState } from 'react';
import { Archive, CheckCheck, CornerUpLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  useArquivarProcesso, useAvancarEtapa, useConcluirProcesso, useDevolverEtapa,
  useReativarProcesso, useSuspenderProcesso,
} from '@/hooks/useAcompanhamentoProcessos';
import type { EtapaModelo, ProcessoAcompanhamento } from '@/types/workflow';

type Acao = 'avancar' | 'devolver' | 'suspender' | 'reativar' | 'concluir' | 'arquivar';

const TEXTOS: Record<Acao, { titulo: string; descricao: string; campo: string; obrigatorio: boolean; confirmar: string }> = {
  avancar: { titulo: 'Avançar etapa', descricao: 'O processo segue para a próxima etapa do fluxo.', campo: 'Observação (opcional)', obrigatorio: false, confirmar: 'Avançar' },
  devolver: { titulo: 'Devolver etapa', descricao: 'O processo volta para uma etapa anterior.', campo: 'Motivo da devolução', obrigatorio: true, confirmar: 'Devolver' },
  suspender: { titulo: 'Suspender processo', descricao: 'O prazo da etapa fica parado até a reativação.', campo: 'Motivo da suspensão', obrigatorio: true, confirmar: 'Suspender' },
  reativar: { titulo: 'Reativar processo', descricao: 'O processo volta a andar na etapa em que estava.', campo: 'Motivo da reativação', obrigatorio: true, confirmar: 'Reativar' },
  concluir: { titulo: 'Concluir processo', descricao: 'Depois de concluído, o processo só pode ser arquivado.', campo: 'Observação (opcional)', obrigatorio: false, confirmar: 'Concluir' },
  arquivar: { titulo: 'Arquivar processo', descricao: 'O processo arquivado não aceita mais alterações.', campo: 'Observação (opcional)', obrigatorio: false, confirmar: 'Arquivar' },
};

interface AcoesProcessoProps {
  processo: ProcessoAcompanhamento;
  /** Etapas do modelo (para escolher o destino da devolução); vazio se o processo não tem modelo */
  etapas: EtapaModelo[];
}

export function AcoesProcesso({ processo, etapas }: AcoesProcessoProps) {
  const { hasPermission } = useAuth();
  const [acao, setAcao] = useState<Acao | null>(null);
  const [texto, setTexto] = useState('');
  const [paraOrdem, setParaOrdem] = useState('');

  const avancar = useAvancarEtapa();
  const devolver = useDevolverEtapa();
  const suspender = useSuspenderProcesso();
  const reativar = useReativarProcesso();
  const concluir = useConcluirProcesso();
  const arquivar = useArquivarProcesso();

  const podeTramitar = hasPermission('workflow.tramitar');
  const podeConcluir = hasPermission('workflow.concluir');
  const podeArquivar = hasPermission('workflow.arquivar');

  const emAndamento = processo.status === 'aberto' || processo.status === 'em_tramitacao';
  const temModelo = !!processo.modelo_id && processo.etapa_atual_ordem != null;
  const etapa = processo.etapa_atual_ordem ?? 0;
  const ultima = temModelo && etapa >= processo.etapa_total;

  const mostrarAvancar = emAndamento && podeTramitar && temModelo && !ultima;
  const mostrarDevolver = emAndamento && podeTramitar && temModelo && etapa > 1;
  const mostrarSuspender = emAndamento && podeConcluir;
  const mostrarReativar = processo.status === 'suspenso' && podeConcluir;
  // sem modelo (processo antigo) pode concluir em qualquer momento; com modelo, só na última etapa
  const mostrarConcluir = emAndamento && podeConcluir && (!temModelo || ultima);
  const mostrarArquivar = podeArquivar && (emAndamento || processo.status === 'concluido');

  const nenhuma =
    !mostrarAvancar && !mostrarDevolver && !mostrarSuspender && !mostrarReativar && !mostrarConcluir && !mostrarArquivar;
  if (nenhuma) return null;

  const anteriores = etapas.filter((e) => e.ordem < etapa);
  const pendente = [avancar, devolver, suspender, reativar, concluir, arquivar].some((m) => m.isPending);

  function abrir(a: Acao) {
    setTexto('');
    setParaOrdem(a === 'devolver' && anteriores.length > 0 ? String(anteriores[anteriores.length - 1].ordem) : '');
    setAcao(a);
  }

  function fechar() {
    setAcao(null);
  }

  function confirmar() {
    if (!acao) return;
    const motivo = texto.trim();
    const aoTerminar = { onSuccess: fechar };
    const processoId = processo.id;
    switch (acao) {
      case 'avancar':
        avancar.mutate({ processoId, etapaEsperada: etapa, observacao: motivo || undefined }, aoTerminar);
        break;
      case 'devolver':
        devolver.mutate({ processoId, etapaEsperada: etapa, paraOrdem: Number(paraOrdem), motivo }, aoTerminar);
        break;
      case 'suspender':
        suspender.mutate({ processoId, motivo }, aoTerminar);
        break;
      case 'reativar':
        reativar.mutate({ processoId, motivo }, aoTerminar);
        break;
      case 'concluir':
        concluir.mutate({ processoId, motivo: motivo || undefined }, aoTerminar);
        break;
      case 'arquivar':
        arquivar.mutate({ processoId, motivo: motivo || undefined }, aoTerminar);
        break;
    }
  }

  const config = acao ? TEXTOS[acao] : null;
  const faltaTexto = !!config?.obrigatorio && texto.trim().length === 0;
  const faltaDestino = acao === 'devolver' && !paraOrdem;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {mostrarAvancar && (
          <Button onClick={() => abrir('avancar')}>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            Avançar
          </Button>
        )}
        {mostrarConcluir && (
          <Button onClick={() => abrir('concluir')}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Concluir
          </Button>
        )}
        {mostrarDevolver && (
          <Button variant="outline" onClick={() => abrir('devolver')}>
            <CornerUpLeft className="h-4 w-4" aria-hidden="true" />
            Devolver
          </Button>
        )}
        {mostrarSuspender && (
          <Button variant="outline" onClick={() => abrir('suspender')}>
            <Pause className="h-4 w-4" aria-hidden="true" />
            Suspender
          </Button>
        )}
        {mostrarReativar && (
          <Button onClick={() => abrir('reativar')}>
            <Play className="h-4 w-4" aria-hidden="true" />
            Reativar
          </Button>
        )}
        {mostrarArquivar && (
          <Button variant="outline" onClick={() => abrir('arquivar')}>
            <Archive className="h-4 w-4" aria-hidden="true" />
            Arquivar
          </Button>
        )}
      </div>

      <Dialog open={!!acao} onOpenChange={(aberto) => !aberto && !pendente && fechar()}>
        <DialogContent>
          {config && (
            <>
              <DialogHeader>
                <DialogTitle>{config.titulo}</DialogTitle>
                <DialogDescription>{config.descricao}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {acao === 'devolver' && (
                  <div className="space-y-2">
                    <Label htmlFor="acao-destino">Devolver para a etapa</Label>
                    <Select value={paraOrdem} onValueChange={setParaOrdem}>
                      <SelectTrigger id="acao-destino">
                        <SelectValue placeholder="Escolha a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {anteriores.map((e) => (
                          <SelectItem key={e.id} value={String(e.ordem)}>
                            {e.ordem}. {e.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="acao-texto">{config.campo}</Label>
                  <Textarea id="acao-texto" value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={fechar} disabled={pendente}>
                  Cancelar
                </Button>
                <Button onClick={confirmar} disabled={pendente || faltaTexto || faltaDestino}>
                  {config.confirmar}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
