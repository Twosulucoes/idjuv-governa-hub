/**
 * Credenciais de acesso a processo restrito/sigiloso (só workflow.admin). Concede e revoga por RPC.
 */
import { useState } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/design-system';
import {
  useConcederAcesso, useCredenciaisProcesso, useRevogarAcesso, useUsuariosAtivos,
} from '@/hooks/useAcompanhamentoProcessos';
import type { NivelAcessoSigiloso, NivelSigilo } from '@/types/workflow';

const NIVEIS: Record<NivelAcessoSigiloso, string> = {
  leitura: 'Leitura',
  tramitacao: 'Tramitação',
  total: 'Total',
};

interface CredenciaisSigiloTabProps {
  processoId: string;
  sigilo: NivelSigilo;
}

export function CredenciaisSigiloTab({ processoId, sigilo }: CredenciaisSigiloTabProps) {
  const credenciais = useCredenciaisProcesso(processoId, true);
  const usuarios = useUsuariosAtivos(true);
  const conceder = useConcederAcesso();
  const revogar = useRevogarAcesso();
  const [usuarioId, setUsuarioId] = useState('');
  const [nivel, setNivel] = useState<NivelAcessoSigiloso>('leitura');
  const [motivo, setMotivo] = useState('');

  function aoConceder() {
    conceder.mutate(
      { processoId, usuarioId, nivel, motivo: motivo.trim() || undefined },
      { onSuccess: () => { setUsuarioId(''); setMotivo(''); } },
    );
  }

  return (
    <div className="space-y-6">
      {sigilo === 'publico' && (
        <p className="text-body text-muted-foreground">
          Este processo é público: a credencial só tem efeito se o sigilo for alterado para restrito ou sigiloso.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="cred-usuario">Usuário</Label>
          <Select value={usuarioId} onValueChange={setUsuarioId}>
            <SelectTrigger id="cred-usuario">
              <SelectValue placeholder={usuarios.isLoading ? 'Carregando…' : 'Escolha o usuário'} />
            </SelectTrigger>
            <SelectContent>
              {(usuarios.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || 'Usuário sem nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cred-nivel">Nível</Label>
          <Select value={nivel} onValueChange={(v) => setNivel(v as NivelAcessoSigiloso)}>
            <SelectTrigger id="cred-nivel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(NIVEIS) as NivelAcessoSigiloso[]).map((n) => (
                <SelectItem key={n} value={n}>{NIVEIS[n]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cred-motivo">Motivo (opcional)</Label>
          <Input id="cred-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <Button onClick={aoConceder} disabled={!usuarioId || conceder.isPending}>
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Conceder
        </Button>
      </div>

      {credenciais.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : credenciais.isError ? (
        <p className="text-body text-destructive" role="alert">Não foi possível carregar as credenciais.</p>
      ) : (credenciais.data ?? []).length === 0 ? (
        <EmptyState icone={KeyRound} titulo="Nenhuma credencial concedida" />
      ) : (
        <ul className="space-y-2">
          {credenciais.data!.map((c) => (
            <li key={c.usuario_id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.usuario_nome || 'Usuário sem nome'}</p>
                <p className="text-caption text-muted-foreground">
                  {NIVEIS[c.nivel_acesso] ?? c.nivel_acesso}
                  {c.concedido_por_nome ? ` • concedido por ${c.concedido_por_nome}` : ''}
                  {c.motivo ? ` • ${c.motivo}` : ''}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revogar.isPending}
                    aria-label={`Revogar acesso de ${c.usuario_nome || 'usuário'}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Revogar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revogar acesso?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {c.usuario_nome || 'O usuário'} perderá o acesso a este processo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => revogar.mutate({ processoId, usuarioId: c.usuario_id })}>
                      Revogar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
