import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Building2, Users, Landmark, Loader2 } from 'lucide-react';
import { useInstituicoes } from '@/hooks/useInstituicoes';
import { InstituicaoCard } from '@/components/instituicoes/InstituicaoCard';
import { InstituicaoFormDialog } from '@/components/instituicoes/InstituicaoFormDialog';
import type { TipoInstituicao, StatusInstituicao, Instituicao } from '@/types/instituicoes';
import { TIPO_INSTITUICAO_LABELS, STATUS_INSTITUICAO_LABELS } from '@/types/instituicoes';
import { ModuleLayout } from '@/components/layout';
 
 export default function GestaoInstituicoesPage() {
   const [showForm, setShowForm] = useState(false);
   const [editingInstituicao, setEditingInstituicao] = useState<Instituicao | null>(null);
   const [deleteId, setDeleteId] = useState<string | null>(null);
   
   // Filtros
   const [busca, setBusca] = useState('');
   const [tipoFilter, setTipoFilter] = useState<TipoInstituicao | 'todos'>('todos');
   const [statusFilter, setStatusFilter] = useState<StatusInstituicao | 'todos'>('todos');
 
   const {
     instituicoes,
     isLoading,
     deleteInstituicao,
     isDeleting,
     getInstituicao,
   } = useInstituicoes({
     busca: busca || undefined,
     tipo: tipoFilter === 'todos' ? undefined : tipoFilter,
     status: statusFilter === 'todos' ? undefined : statusFilter,
   });
 
   const handleEdit = async (id: string) => {
     const inst = await getInstituicao(id);
     if (inst) {
       setEditingInstituicao(inst);
       setShowForm(true);
     }
   };
 
   const handleDelete = async () => {
     if (deleteId) {
       await deleteInstituicao(deleteId);
       setDeleteId(null);
     }
   };
 
   const handleCloseForm = () => {
     setShowForm(false);
     setEditingInstituicao(null);
   };
 
   // Estatísticas
   const stats = {
     total: instituicoes.length,
     formais: instituicoes.filter((i) => i.tipo_instituicao === 'formal').length,
     informais: instituicoes.filter((i) => i.tipo_instituicao === 'informal').length,
     orgaos: instituicoes.filter((i) => i.tipo_instituicao === 'orgao_publico').length,
   };
 
  return (
    <ModuleLayout module="organizacoes">
      <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
         <div>
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <Building2 className="h-6 w-6" />
             Gestão de Instituições
           </h1>
           <p className="text-muted-foreground">
             Cadastre e gerencie instituições que podem solicitar uso de espaços públicos
           </p>
         </div>
         <Button onClick={() => setShowForm(true)}>
           <Plus className="mr-2 h-4 w-4" />
           Nova Instituição
         </Button>
       </div>
 
       {/* Cards de Estatísticas */}
       <div className="grid gap-4 md:grid-cols-4">
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.total}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               <Building2 className="h-4 w-4" />
               Formais
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.formais}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               <Users className="h-4 w-4" />
               Informais
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.informais}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               <Landmark className="h-4 w-4" />
               Órgãos Públicos
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.orgaos}</div>
           </CardContent>
         </Card>
       </div>
 
       {/* Filtros */}
       <Card>
         <CardContent className="pt-6">
           <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 value={busca}
                 onChange={(e) => setBusca(e.target.value)}
                 placeholder="Buscar por nome, CNPJ ou código..."
                 className="pl-10"
               />
             </div>
             <Select
               value={tipoFilter}
               onValueChange={(v) => setTipoFilter(v as TipoInstituicao | 'todos')}
             >
               <SelectTrigger className="w-full md:w-[200px]">
                 <SelectValue placeholder="Tipo" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="todos">Todos os tipos</SelectItem>
                 {Object.entries(TIPO_INSTITUICAO_LABELS).map(([key, label]) => (
                   <SelectItem key={key} value={key}>
                     {label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             <Select
               value={statusFilter}
               onValueChange={(v) => setStatusFilter(v as StatusInstituicao | 'todos')}
             >
               <SelectTrigger className="w-full md:w-[180px]">
                 <SelectValue placeholder="Status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="todos">Todos os status</SelectItem>
                 {Object.entries(STATUS_INSTITUICAO_LABELS).map(([key, label]) => (
                   <SelectItem key={key} value={key}>
                     {label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </CardContent>
       </Card>
 
       {/* Lista de Instituições */}
       {isLoading ? (
         <div className="flex items-center justify-center py-12">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       ) : instituicoes.length === 0 ? (
         <Card>
           <CardContent className="py-12 text-center">
             <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
             <h3 className="text-lg font-semibold">Nenhuma instituição encontrada</h3>
             <p className="text-muted-foreground mt-1">
               {busca || tipoFilter !== 'todos' || statusFilter !== 'todos'
                 ? 'Tente ajustar os filtros de busca'
                 : 'Cadastre a primeira instituição clicando no botão acima'}
             </p>
           </CardContent>
         </Card>
       ) : (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {instituicoes.map((inst) => (
             <InstituicaoCard
               key={inst.id}
               instituicao={inst}
               onEdit={() => handleEdit(inst.id)}
               onDelete={() => setDeleteId(inst.id)}
             />
           ))}
         </div>
       )}
 
       {/* Dialog de Formulário */}
       <InstituicaoFormDialog
         open={showForm}
         onOpenChange={handleCloseForm}
         instituicao={editingInstituicao}
       />
 
       {/* Dialog de Confirmação de Exclusão */}
       <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Desativar instituição?</AlertDialogTitle>
             <AlertDialogDescription>
               A instituição será desativada e não aparecerá mais nas listagens.
               Esta ação pode ser revertida posteriormente.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
               {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Desativar
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
      </div>
    </ModuleLayout>
  );
}