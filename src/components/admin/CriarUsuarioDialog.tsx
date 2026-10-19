// ============================================
// DIALOG PARA CRIAR USUÁRIO COM RBAC
// Suporta: Usuário-Servidor e Usuário Técnico
// ============================================

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUsuarios } from '@/hooks/useUsuarios';
import { 
  UserPlus, 
  Search, 
  Loader2, 
  User,
  Mail,
  AlertTriangle,
  CheckCircle,
  Shield,
  Briefcase,
  Users
} from 'lucide-react';
import { Modulo, MODULOS, MODULO_LABELS } from '@/types/rbac';

interface CriarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ServidorOption {
  id: string;
  nome_completo: string;
  cpf: string | null;
  matricula: string | null;
  cargo_nome: string | null;
  unidade_nome: string | null;
  email_pessoal: string | null;
  email_institucional: string | null;
  situacao: string;
  jaTemUsuario: boolean;
}

export const CriarUsuarioDialog: React.FC<CriarUsuarioDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const { criarUsuarioParaServidor, criarUsuarioTecnico } = useUsuarios();
  
  // Tab selecionada
  const [tipoUsuario, setTipoUsuario] = useState<'servidor' | 'tecnico'>('servidor');
  
  // Estados para Servidor
  const [servidores, setServidores] = useState<ServidorOption[]>([]);
  const [isLoadingServidores, setIsLoadingServidores] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServidor, setSelectedServidor] = useState<ServidorOption | null>(null);
  
  // Estados para Técnico
  const [tecnicoNome, setTecnicoNome] = useState('');
  const [tecnicoEmail, setTecnicoEmail] = useState('');
  
  // Estados compartilhados
  const [email, setEmail] = useState('');
  const [selectedModulos, setSelectedModulos] = useState<Modulo[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Usuário convidado: a tela de sucesso diz para qual e-mail o convite foi
  const [usuarioCriado, setUsuarioCriado] = useState<{ nome: string; email: string } | null>(null);

  // Carregar servidores
  const loadServidores = async () => {
    setIsLoadingServidores(true);
    try {
      const { data: servidoresData, error: servidoresError } = await supabase
        .from('servidores')
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          email_pessoal,
          email_institucional,
          situacao,
          cargo_atual_id,
          unidade_atual_id
        `)
        .eq('situacao', 'ativo')
        .order('nome_completo');

      if (servidoresError) throw servidoresError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('servidor_id')
        .not('servidor_id', 'is', null);

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
      }

      const servidoresComUsuario = new Set(
        (profiles || [])
          .filter(p => p.servidor_id !== null)
          .map(p => p.servidor_id as string)
      );

      const cargoIds = servidoresData?.filter(s => s.cargo_atual_id).map(s => s.cargo_atual_id) || [];
      const unidadeIds = servidoresData?.filter(s => s.unidade_atual_id).map(s => s.unidade_atual_id) || [];

      const cargosMap: Record<string, string> = {};
      const unidadesMap: Record<string, string> = {};

      if (cargoIds.length > 0) {
        const { data: cargos } = await supabase
          .from('cargos')
          .select('id, nome')
          .in('id', cargoIds);
        cargos?.forEach(c => { cargosMap[c.id] = c.nome; });
      }

      if (unidadeIds.length > 0) {
        const { data: unidades } = await supabase
          .from('estrutura_organizacional')
          .select('id, nome')
          .in('id', unidadeIds);
        unidades?.forEach(u => { unidadesMap[u.id] = u.nome; });
      }

      const opcoes: ServidorOption[] = (servidoresData || []).map(s => ({
        id: s.id,
        nome_completo: s.nome_completo,
        cpf: s.cpf,
        matricula: s.matricula,
        cargo_nome: s.cargo_atual_id ? cargosMap[s.cargo_atual_id] || null : null,
        unidade_nome: s.unidade_atual_id ? unidadesMap[s.unidade_atual_id] || null : null,
        email_pessoal: s.email_pessoal,
        email_institucional: s.email_institucional,
        situacao: s.situacao,
        jaTemUsuario: servidoresComUsuario.has(s.id)
      }));

      setServidores(opcoes);
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar servidores",
        description: "Não foi possível carregar a lista de servidores."
      });
    } finally {
      setIsLoadingServidores(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadServidores();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setTipoUsuario('servidor');
    setSelectedServidor(null);
    setEmail('');
    setEmail('');
    setSelectedModulos([]);
    setSearchTerm('');
    setUsuarioCriado(null);
    setTecnicoNome('');
    setTecnicoEmail('');
  };

  const handleSelectServidor = (servidor: ServidorOption) => {
    setSelectedServidor(servidor);
    setEmail(servidor.email_institucional || servidor.email_pessoal || '');
  };

  const toggleModulo = (modulo: Modulo) => {
    setSelectedModulos(prev => 
      prev.includes(modulo) 
        ? prev.filter(m => m !== modulo)
        : [...prev, modulo]
    );
  };

  const handleCriarServidor = async () => {
    if (!selectedServidor) {
      toast({
        variant: "destructive",
        title: "Selecione um servidor",
        description: "É necessário selecionar um servidor para criar o usuário."
      });
      return;
    }

    if (!email) {
      toast({
        variant: "destructive",
        title: "Informe o email",
        description: "É necessário informar um email para o usuário."
      });
      return;
    }

    setIsCreating(true);
    try {
      const resultado = await criarUsuarioParaServidor.mutateAsync({
        servidorId: selectedServidor.id,
        email,
        modulos: selectedModulos
      });

      if (resultado.usuarioAtualizado) {
        toast({
          title: "Permissões atualizadas!",
          description: "O usuário já existia. Suas permissões foram atualizadas com sucesso."
        });
        onSuccess?.();
        onOpenChange(false);
        return;
      }

      setUsuarioCriado({
        nome: selectedServidor.nome_completo,
        email: email
      });
      
      onSuccess?.();
    } catch (error: any) {
      // Erros já tratados no hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleCriarTecnico = async () => {
    if (!tecnicoNome.trim()) {
      toast({
        variant: "destructive",
        title: "Informe o nome",
        description: "É necessário informar o nome do usuário técnico."
      });
      return;
    }

    if (!tecnicoEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Informe o email",
        description: "É necessário informar o email do usuário técnico."
      });
      return;
    }

    setIsCreating(true);
    try {
      const resultado = await criarUsuarioTecnico.mutateAsync({
        email: tecnicoEmail,
        fullName: tecnicoNome,
        modulos: selectedModulos
      });

      onSuccess?.();

      // Convite enviado: a pessoa cria a própria senha pelo link do e-mail
      if (resultado.convidado) {
        setUsuarioCriado({ nome: tecnicoNome, email: tecnicoEmail });
      } else {
        onOpenChange(false);
      }
    } catch (error: any) {
      // Erros já tratados no hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleCriar = () => {
    if (tipoUsuario === 'servidor') {
      handleCriarServidor();
    } else {
      handleCriarTecnico();
    }
  };

  const servidoresFiltrados = servidores.filter(s => {
    if (!searchTerm) return true;
    const termo = searchTerm.toLowerCase();
    return (
      s.nome_completo.toLowerCase().includes(termo) ||
      s.cpf?.includes(termo) ||
      s.matricula?.toLowerCase().includes(termo)
    );
  });

  const servidoresVisiveis = servidoresFiltrados;

  const modulosDisponiveis = MODULOS.filter(m => m !== 'admin');

  const canCreate = tipoUsuario === 'servidor' 
    ? selectedServidor && email 
    : tecnicoNome.trim() && tecnicoEmail.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {usuarioCriado ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Convite enviado
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                Criar Novo Usuário
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {usuarioCriado 
              ? 'O usuário vai receber um e-mail para criar a própria senha'
              : 'Escolha o tipo de usuário e preencha os dados'}
          </DialogDescription>
        </DialogHeader>

        {/* Tela de sucesso: convite enviado */}
        {usuarioCriado ? (
          <div className="space-y-6 py-4">
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nome</Label>
                <div className="font-medium">{usuarioCriado.nome}</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Convite enviado para
                </Label>
                <div className="font-medium">{usuarioCriado.email}</div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O link do convite vale uma vez e por tempo limitado. Se a pessoa não receber ou o link vencer,
                abra a ficha do usuário e use <strong>Resetar senha</strong> para gerar uma senha temporária.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Tabs para tipo de usuário */}
            <Tabs value={tipoUsuario} onValueChange={(v) => setTipoUsuario(v as 'servidor' | 'tecnico')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="servidor" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuário-Servidor
                </TabsTrigger>
                <TabsTrigger value="tecnico" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Usuário Técnico
                </TabsTrigger>
              </TabsList>

              {/* Tab Servidor */}
              <TabsContent value="servidor" className="space-y-4 mt-4">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    Vincula uma conta de acesso a um servidor cadastrado no sistema de RH.
                  </AlertDescription>
                </Alert>

                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF ou matrícula..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Lista de servidores */}
                {isLoadingServidores ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : servidoresVisiveis.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {searchTerm 
                        ? 'Nenhum servidor encontrado com os termos de busca.'
                        : 'Nenhum servidor ativo encontrado.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {servidoresVisiveis.map((servidor) => {
                      const isLinked = servidor.jaTemUsuario;
                      const isSelected = selectedServidor?.id === servidor.id;

                      return (
                        <div
                          key={servidor.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-primary/10 border-primary'
                              : isLinked
                                ? 'bg-muted/40 border-border opacity-70'
                                : 'hover:bg-accent/50 cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!isLinked) handleSelectServidor(servidor);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{servidor.nome_completo}</div>
                                <div className="text-sm text-muted-foreground">
                                  {servidor.matricula && `Mat: ${servidor.matricula}`}
                                  {servidor.matricula && servidor.cargo_nome && ' • '}
                                  {servidor.cargo_nome}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isLinked && <Badge variant="secondary">Já possui usuário</Badge>}
                              {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Formulário do servidor selecionado */}
                {selectedServidor && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Servidor selecionado</Badge>
                      <span className="font-medium">{selectedServidor.nome_completo}</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-servidor">Email de acesso</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email-servidor"
                          type="email"
                          placeholder="email@exemplo.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab Técnico */}
              <TabsContent value="tecnico" className="space-y-4 mt-4">
                <Alert>
                  <Briefcase className="h-4 w-4" />
                  <AlertDescription>
                    Usuário não vinculado a servidor. Ideal para técnicos de TI, consultores externos, etc.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="tecnico-nome">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="tecnico-nome"
                        placeholder="Nome do usuário"
                        className="pl-10"
                        value={tecnicoNome}
                        onChange={(e) => setTecnicoNome(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tecnico-email">Email de acesso</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="tecnico-email"
                        type="email"
                        placeholder="email@exemplo.com"
                        className="pl-10"
                        value={tecnicoEmail}
                        onChange={(e) => setTecnicoEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Configuração de Módulos */}
            {(tipoUsuario === 'servidor' ? selectedServidor : (tecnicoNome && tecnicoEmail)) && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium">Módulos de acesso</span>
                </div>

                <div className="space-y-2">
                  <Label>Selecione os módulos</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {(MODULOS as readonly Modulo[]).map((modulo) => (
                      <div key={modulo} className="flex items-center space-x-2">
                        <Checkbox
                          id={`modulo-${modulo}`}
                          checked={selectedModulos.includes(modulo)}
                          onCheckedChange={() => toggleModulo(modulo)}
                        />
                        <label htmlFor={`modulo-${modulo}`} className="text-sm cursor-pointer">
                          {MODULO_LABELS[modulo]}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedModulos.length === 0 
                      ? 'Nenhum módulo selecionado'
                      : `${selectedModulos.length} módulo(s) selecionado(s)`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {usuarioCriado ? (
            <Button onClick={() => onOpenChange(false)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCriar} 
                disabled={!canCreate || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
