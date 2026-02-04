/**
 * Dialog para cadastro de Parcerias, Projetos e Convênios
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NovaParceriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  federacaoId: string;
  federacaoSigla: string;
}

const TIPOS_PARCERIA = [
  { value: 'parceria', label: 'Parceria' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'convenio', label: 'Convênio' },
  { value: 'patrocinio', label: 'Patrocínio' },
];

const STATUS_PARCERIA = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'encerrada', label: 'Encerrada' },
  { value: 'suspensa', label: 'Suspensa' },
  { value: 'em_analise', label: 'Em Análise' },
];

export function NovaParceriaDialog({
  open,
  onOpenChange,
  federacaoId,
  federacaoSigla,
}: NovaParceriaDialogProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'parceria',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    status: 'vigente',
    processo_sei: '',
    numero_termo: '',
    numero_portaria: '',
    observacoes: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('federacao_parcerias').insert({
        federacao_id: federacaoId,
        titulo: formData.titulo,
        tipo: formData.tipo,
        descricao: formData.descricao || null,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || null,
        status: formData.status,
        processo_sei: formData.processo_sei || null,
        numero_termo: formData.numero_termo || null,
        numero_portaria: formData.numero_portaria || null,
        observacoes: formData.observacoes || null,
        created_by: userData.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Parceria cadastrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['federacao-parcerias', federacaoId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar parceria:', error);
      toast.error(error.message || 'Erro ao cadastrar parceria');
    },
  });

  function resetForm() {
    setFormData({
      titulo: '',
      tipo: 'parceria',
      descricao: '',
      data_inicio: '',
      data_fim: '',
      status: 'vigente',
      processo_sei: '',
      numero_termo: '',
      numero_portaria: '',
      observacoes: '',
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    
    if (!formData.data_inicio) {
      toast.error('A data de início é obrigatória');
      return;
    }
    
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Parceria / Projeto</DialogTitle>
          <DialogDescription>
            Cadastrar novo vínculo para {federacaoSigla}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Projeto de Formação de Atletas"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PARCERIA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PARCERIA.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data Início *</Label>
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do projeto ou parceria..."
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Documentação</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Processo SEI</Label>
                <Input
                  value={formData.processo_sei}
                  onChange={(e) => setFormData({ ...formData, processo_sei: e.target.value })}
                  placeholder="00000.000000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label>Número do Termo</Label>
                <Input
                  value={formData.numero_termo}
                  onChange={(e) => setFormData({ ...formData, numero_termo: e.target.value })}
                  placeholder="Termo nº 000/0000"
                />
              </div>

              <div className="space-y-2">
                <Label>Número da Portaria</Label>
                <Input
                  value={formData.numero_portaria}
                  onChange={(e) => setFormData({ ...formData, numero_portaria: e.target.value })}
                  placeholder="Portaria nº 000/0000"
                />
              </div>
            </div>
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
