// ============================================
// COMPONENTE DE ASSOCIAÇÃO USUÁRIO-PERFIS
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePerfis } from '@/hooks/usePerfis';
import { useUsuarioPerfis } from '@/hooks/useUsuarioPerfis';
import type { Perfil } from '@/types/perfis';
import { NIVEL_PERFIL_CORES, NIVEL_PERFIL_LABELS } from '@/types/perfis';
import { 
  Users, 
  Search, 
  UserPlus,
  Shield,
  X
} from 'lucide-react';

interface UsuarioPerfilAssociacaoProps {
  userId?: string;
  onClose?: () => void;
}

export function UsuarioPerfilAssociacao({ userId, onClose }: UsuarioPerfilAssociacaoProps) {
  const { perfis } = usePerfis();
  const { 
    usuarios, 
    usuarioPerfis,
    loading, 
    saving,
    fetchUsuariosComPerfis,
    fetchPerfisDoUsuario,
    associarPerfil,
    desassociarPerfil
  } = useUsuarioPerfis(userId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userId || null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!userId) {
      fetchUsuariosComPerfis();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedUserId) {
      fetchPerfisDoUsuario(selectedUserId);
    }
  }, [selectedUserId]);

  const filteredUsuarios = usuarios.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTogglePerfil = async (perfilId: string) => {
    if (!selectedUserId) return;
    
    const temPerfil = usuarioPerfis.some(up => up.perfil_id === perfilId);
    if (temPerfil) {
      await desassociarPerfil(selectedUserId, perfilId);
    } else {
      await associarPerfil(selectedUserId, perfilId);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const selectedUser = usuarios.find(u => u.id === selectedUserId);

  // Se foi passado userId, mostrar apenas o seletor de perfis
  if (userId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Perfis do Usuário</h4>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {perfis.filter(p => p.ativo).map(perfil => {
            const tem = usuarioPerfis.some(up => up.perfil_id === perfil.id);
            
            return (
              <div
                key={perfil.id}
                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                  tem ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                }`}
                onClick={() => !saving && handleTogglePerfil(perfil.id)}
              >
                <Checkbox checked={tem} disabled={saving} />
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: perfil.cor || '#6b7280' }}
                />
                <span className="text-sm">{perfil.nome}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Associação Usuário-Perfis</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de Usuários */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usuários</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Perfis</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map(usuario => (
                      <TableRow 
                        key={usuario.id}
                        className={selectedUserId === usuario.id ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(usuario.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {usuario.full_name || 'Sem nome'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {usuario.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {usuario.perfis.length > 0 ? (
                              usuario.perfis.map(up => (
                                <Badge 
                                  key={up.id} 
                                  variant="secondary"
                                  className="text-[10px]"
                                  style={{ 
                                    borderColor: up.perfil?.cor || undefined,
                                    borderWidth: up.perfil?.cor ? 1 : 0
                                  }}
                                >
                                  {up.perfil?.nome || 'Desconhecido'}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Nenhum perfil</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUserId(usuario.id)}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Painel de Perfis do Usuário Selecionado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedUser ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selectedUser.full_name || selectedUser.email}</span>
                </div>
              ) : (
                'Selecione um usuário'
              )}
            </CardTitle>
            <CardDescription>
              {selectedUser 
                ? 'Marque/desmarque os perfis para este usuário'
                : 'Clique em "Editar" ao lado de um usuário'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {perfis.filter(p => p.ativo).map(perfil => {
                    const tem = usuarioPerfis.some(up => up.perfil_id === perfil.id);
                    
                    return (
                      <div
                        key={perfil.id}
                        className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          tem ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                        }`}
                        onClick={() => !saving && handleTogglePerfil(perfil.id)}
                      >
                        <Checkbox checked={tem} disabled={saving} />
                        <div 
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: perfil.cor || '#6b7280' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{perfil.nome}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {perfil.descricao || 'Sem descrição'}
                          </div>
                        </div>
                        <Badge className={NIVEL_PERFIL_CORES[perfil.nivel]} variant="secondary">
                          {NIVEL_PERFIL_LABELS[perfil.nivel]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <UserPlus className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Selecione um usuário para gerenciar seus perfis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UsuarioPerfilAssociacao;
