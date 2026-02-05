 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Building2, Users, Landmark, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
 import { TipoInstituicaoBadge } from './TipoInstituicaoBadge';
 import type { InstituicaoResumo } from '@/types/instituicoes';
 import { STATUS_INSTITUICAO_LABELS, STATUS_INSTITUICAO_COLORS } from '@/types/instituicoes';
 
 interface InstituicaoCardProps {
   instituicao: InstituicaoResumo;
   onEdit?: () => void;
   onDelete?: () => void;
   onClick?: () => void;
 }
 
 const ICONS = {
   formal: Building2,
   informal: Users,
   orgao_publico: Landmark,
 };
 
 export function InstituicaoCard({ instituicao, onEdit, onDelete, onClick }: InstituicaoCardProps) {
   const Icon = ICONS[instituicao.tipo_instituicao];
 
   return (
     <Card 
       className={`hover:border-primary/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
       onClick={onClick}
     >
       <CardHeader className="pb-3">
         <div className="flex items-start justify-between gap-2">
           <div className="flex items-start gap-3">
             <div className="p-2 rounded-lg bg-muted">
               <Icon className="h-5 w-5 text-muted-foreground" />
             </div>
             <div className="space-y-1">
               <CardTitle className="text-base leading-tight">
                 {instituicao.nome_razao_social}
               </CardTitle>
               <div className="flex items-center gap-2 flex-wrap">
                 <span className="text-xs text-muted-foreground font-mono">
                   {instituicao.codigo_instituicao}
                 </span>
                 {instituicao.cnpj && (
                   <span className="text-xs text-muted-foreground">
                     • CNPJ: {instituicao.cnpj}
                   </span>
                 )}
               </div>
             </div>
           </div>
           <div className="flex items-center gap-1">
             {onEdit && (
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-8 w-8"
                 onClick={(e) => {
                   e.stopPropagation();
                   onEdit();
                 }}
               >
                 <Edit className="h-4 w-4" />
               </Button>
             )}
             {onDelete && (
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-8 w-8 text-destructive hover:text-destructive"
                 onClick={(e) => {
                   e.stopPropagation();
                   onDelete();
                 }}
               >
                 <Trash2 className="h-4 w-4" />
               </Button>
             )}
           </div>
         </div>
       </CardHeader>
       <CardContent className="space-y-3">
         <div className="flex items-center gap-2 flex-wrap">
           <TipoInstituicaoBadge tipo={instituicao.tipo_instituicao} size="sm" />
           <Badge className={STATUS_INSTITUICAO_COLORS[instituicao.status]}>
             {STATUS_INSTITUICAO_LABELS[instituicao.status]}
           </Badge>
         </div>
 
         <div className="space-y-1.5 text-sm text-muted-foreground">
           {instituicao.responsavel_nome && (
             <p className="flex items-center gap-2">
               <Users className="h-3.5 w-3.5" />
               <span>Resp: {instituicao.responsavel_nome}</span>
               {instituicao.responsavel_cargo && (
                 <span className="text-xs">({instituicao.responsavel_cargo})</span>
               )}
             </p>
           )}
           {(instituicao.endereco_cidade || instituicao.endereco_uf) && (
             <p className="flex items-center gap-2">
               <MapPin className="h-3.5 w-3.5" />
               <span>
                 {[instituicao.endereco_cidade, instituicao.endereco_uf].filter(Boolean).join(' - ')}
               </span>
             </p>
           )}
           {instituicao.telefone && (
             <p className="flex items-center gap-2">
               <Phone className="h-3.5 w-3.5" />
               <span>{instituicao.telefone}</span>
             </p>
           )}
           {instituicao.email && (
             <p className="flex items-center gap-2">
               <Mail className="h-3.5 w-3.5" />
               <span className="truncate">{instituicao.email}</span>
             </p>
           )}
         </div>
 
         {/* Estatísticas */}
         <div className="flex items-center gap-4 pt-2 border-t text-sm">
           <div>
             <span className="font-semibold">{instituicao.total_solicitacoes}</span>
             <span className="text-muted-foreground ml-1">solicitações</span>
           </div>
           <div>
             <span className="font-semibold text-success">{instituicao.solicitacoes_aprovadas}</span>
             <span className="text-muted-foreground ml-1">aprovadas</span>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }