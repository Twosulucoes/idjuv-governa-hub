/**
 * Dialog para cadastro de Árbitros vinculados à Federação
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NovoArbitroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  federacaoId: string;
  federacaoSigla: string;
}

export function NovoArbitroDialog({
  open,
  onOpenChange,
  federacaoId,
  federacaoSigla,
}: NovoArbitroDialogProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    disponibilidade: '',
    ativo: true,
    observacoes: '',
  });
  
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [novaModalidade, setNovaModalidade] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('federacao_arbitros').insert({
        federacao_id: federacaoId,
        nome: formData.nome,
        telefone: formData.telefone || null,
        email: formData.email || null,
        modalidades: modalidades.length > 0 ? modalidades : null,
        disponibilidade: formData.disponibilidade || null,
        ativo: formData.ativo,
        observacoes: formData.observacoes || null,
        created_by: userData.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Árbitro cadastrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['federacao-arbitros', federacaoId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar árbitro:', error);
      toast.error(error.message || 'Erro ao cadastrar árbitro');
    },
  });

  function resetForm() {
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      disponibilidade: '',
      ativo: true,
      observacoes: '',
    });
    setModalidades([]);
    setNovaModalidade('');
  }

  function handleAddModalidade() {
    const modalidade = novaModalidade.trim();
    if (modalidade && !modalidades.includes(modalidade)) {
      setModalidades([...modalidades, modalidade]);
      setNovaModalidade('');
    }
  }

  function handleRemoveModalidade(index: number) {
    setModalidades(modalidades.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddModalidade();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Árbitro</DialogTitle>
          <DialogDescription>
            Cadastrar árbitro vinculado à {federacaoSigla}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do árbitro"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Modalidades</Label>
            <div className="flex gap-2">
              <Input
                value={novaModalidade}
                onChange={(e) => setNovaModalidade(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite e pressione Enter"
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={handleAddModalidade}>
                Adicionar
              </Button>
            </div>
            {modalidades.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {modalidades.map((mod, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {mod}
                    <button
                      type="button"
                      onClick={() => handleRemoveModalidade(idx)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Disponibilidade</Label>
            <Input
              value={formData.disponibilidade}
              onChange={(e) => setFormData({ ...formData, disponibilidade: e.target.value })}
              placeholder="Ex: Fins de semana, Noturno..."
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label htmlFor="ativo" className="cursor-pointer">
              Árbitro ativo
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
