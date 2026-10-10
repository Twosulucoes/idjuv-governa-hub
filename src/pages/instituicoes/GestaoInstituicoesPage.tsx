import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Search, Building2, Users, Landmark, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState, KpiCard, PageHeader } from '@/components/design-system';
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
     error,
     refetch,
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
       <PageHeader
         titulo="Gestão de instituições"
         descricao="Cadastre e gerencie instituições que podem solicitar uso de espaços públicos"
         acoes={
           <Button onClick={() => setShowForm(true)}>
             <Plus className="h-4 w-4" aria-hidden="true" />
             Nova instituição
           </Button>
         }
       />
 
       {/* Indicadores */}
       <section aria-labelledby="instituicoes-indicadores">
         <h2 id="instituicoes-indicadores" className="sr-only">Indicadores</h2>
         <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
           {[
             { rotulo: 'Total', valor: stats.total, icone: undefined },
             { rotulo: 'Formais', valor: stats.formais, icone: Building2 },
             { rotulo: 'Informais', valor: stats.informais, icone: Users },
             { rotulo: 'Órgãos públicos', valor: stats.orgaos, icone: Landmark },
           ].map((ind) => (
             <li key={ind.rotulo}>
               <KpiCard rotulo={ind.rotulo} valor={ind.valor} icone={ind.icone} carregando={isLoading} className="h-full" />
             </li>
           ))}
         </ul>
       </section>
 
       {/* Filtros */}
       <Card>
         <CardContent className="pt-6">
           <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
               <Input
                 type="search"
                 aria-label="Buscar instituições"
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
               <SelectTrigger className="w-full md:w-[200px]" aria-label="Tipo">
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
               <SelectTrigger className="w-full md:w-[180px]" aria-label="Situação">
                 <SelectValue placeholder="Situação" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="todos">Todas as situações</SelectItem>
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
         <div className="flex items-center justify-center py-12" role="status">
           <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
           <span className="sr-only">Carregando instituições…</span>
         </div>
       ) : error ? (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" aria-hidden="true" />
           <AlertDescription className="flex flex-wrap items-center gap-2">
             Não foi possível carregar as instituições.
             <Button variant="outline" size="sm" onClick={() => refetch()}>
               Tentar novamente
             </Button>
           </AlertDescription>
         </Alert>
       ) : instituicoes.length === 0 ? (
         <Card>
           <CardContent className="p-0">
             <EmptyState
               icone={Building2}
               titulo="Nenhuma instituição encontrada"
               descricao={
                 busca || tipoFilter !== 'todos' || statusFilter !== 'todos'
                   ? 'Tente ajustar os filtros de busca.'
                   : 'Cadastre a primeira instituição pelo botão "Nova instituição".'
               }
             />
           </CardContent>
         </Card>
       ) : (
         <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {instituicoes.map((inst) => (
             <li key={inst.id}>
               <InstituicaoCard
                 instituicao={inst}
                 onEdit={() => handleEdit(inst.id)}
                 onDelete={() => setDeleteId(inst.id)}
               />
             </li>
           ))}
         </ul>
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
               {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
               Desativar
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
      </div>
    </ModuleLayout>
  );
}