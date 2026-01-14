// ============================================
// DIALOG PARA CRIAR USUÁRIO A PARTIR DE SERVIDOR
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
  Copy,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppRole, ROLE_LABELS } from '@/types/auth';

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
  const { criarUsuarioParaServidor } = useUsuarios();
  
  // Estados
  const [servidores, setServidores] = useState<ServidorOption[]>([]);
  const [isLoadingServidores, setIsLoadingServidores] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedServidor, setSelectedServidor] = useState<ServidorOption | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('user');
  const [isCreating, setIsCreating] = useState(false);
  
  // Estado para exibir senha após criação
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null);
  const [usuarioCriado, setUsuarioCriado] = useState<{ nome: string; email: string } | null>(null);

  // Carregar servidores
  const loadServidores = async () => {
    setIsLoadingServidores(true);
    try {
      // Buscar servidores ativos
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

      // Buscar IDs de servidores que já têm usuário
      const { data: profiles } = await supabase
        .from('profiles')
        .select('servidor_id')
        .not('servidor_id', 'is', null);

      const servidoresComUsuario = new Set(profiles?.map(p => p.servidor_id) || []);

      // Buscar nomes de cargos e unidades
      const cargoIds = servidoresData?.filter(s => s.cargo_atual_id).map(s => s.cargo_atual_id) || [];
      const unidadeIds = servidoresData?.filter(s => s.unidade_atual_id).map(s => s.unidade_atual_id) || [];

      let cargosMap: Record<string, string> = {};
      let unidadesMap: Record<string, string> = {};

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
      setSelectedServidor(null);
      setEmail('');
      setRole('user');
      setSearchTerm('');
      setSenhaGerada(null);
      setUsuarioCriado(null);
    }
  }, [open]);

  // Quando selecionar servidor, preencher email
  const handleSelectServidor = (servidor: ServidorOption) => {
    setSelectedServidor(servidor);
    setEmail(servidor.email_institucional || servidor.email_pessoal || '');
  };

  // Criar usuário
  const handleCriar = async () => {
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
        role
      });

      // Exibir senha gerada
      setSenhaGerada(resultado.senhaTemporaria);
      setUsuarioCriado({
        nome: selectedServidor.nome_completo,
        email: email
      });
      
      toast({
        title: "Usuário criado com sucesso!",
        description: "Copie a senha temporária abaixo."
      });
      
      onSuccess?.();
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsCreating(false);
    }
  };

  // Filtrar servidores
  const servidoresFiltrados = servidores.filter(s => {
    if (!searchTerm) return true;
    const termo = searchTerm.toLowerCase();
    return (
      s.nome_completo.toLowerCase().includes(termo) ||
      s.cpf?.includes(termo) ||
      s.matricula?.toLowerCase().includes(termo)
    );
  });

  // Servidores disponíveis (sem usuário)
  const servidoresDisponiveis = servidoresFiltrados.filter(s => !s.jaTemUsuario);
  const servidoresComUsuario = servidoresFiltrados.filter(s => s.jaTemUsuario);

  // Estado para mostrar/ocultar senha
  const [showPassword, setShowPassword] = useState(false);

  // Copiar senha para clipboard
  const copiarSenha = () => {
    if (senhaGerada) {
      navigator.clipboard.writeText(senhaGerada);
      toast({
        title: "Senha copiada!",
        description: "A senha foi copiada para a área de transferência."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {senhaGerada ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Usuário Criado com Sucesso!
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                Criar Usuário para Servidor
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {senhaGerada 
              ? 'Copie a senha temporária e informe ao servidor'
              : 'Selecione um servidor ativo para criar acesso ao sistema'}
          </DialogDescription>
        </DialogHeader>

        {/* Tela de sucesso com senha */}
        {senhaGerada && usuarioCriado ? (
          <div className="space-y-6 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                O usuário foi criado com sucesso. Informe os dados abaixo ao servidor.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Servidor</Label>
                <div className="font-medium">{usuarioCriado.nome}</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email de acesso</Label>
                <div className="font-medium">{usuarioCriado.email}</div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Senha temporária
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-background border rounded-md font-mono text-lg">
                    {showPassword ? senhaGerada : '••••••••••••'}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copiarSenha}
                    title="Copiar senha"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O servidor deverá alterar esta senha no primeiro acesso.
                </p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Esta senha não será exibida novamente. 
                Certifique-se de copiá-la antes de fechar esta janela.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-6 py-4">
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
            ) : servidoresDisponiveis.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {searchTerm 
                    ? 'Nenhum servidor encontrado com os termos de busca.'
                    : 'Todos os servidores ativos já possuem usuário no sistema.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                {servidoresDisponiveis.map((servidor) => (
                  <div
                    key={servidor.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedServidor?.id === servidor.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleSelectServidor(servidor)}
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
                      {selectedServidor?.id === servidor.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Servidor selecionado */}
            {selectedServidor && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Servidor selecionado</Badge>
                  <span className="font-medium">{selectedServidor.nome_completo}</span>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email de acesso</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label>Nível de acesso</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {senhaGerada ? (
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
                disabled={!selectedServidor || !email || isCreating}
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
