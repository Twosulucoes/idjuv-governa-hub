 /**
  * Card para seleção de relatório na Central de Relatórios
  */
 import { cn } from '@/lib/utils';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { FileText, Download, Eye, Loader2 } from 'lucide-react';
 import type { LucideIcon } from 'lucide-react';
 
 export interface ReportCardProps {
   id: string;
   titulo: string;
   descricao: string;
   icon?: LucideIcon;
   badge?: string;
   badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
   disabled?: boolean;
   loading?: boolean;
   onGenerate?: () => void;
   onPreview?: () => void;
   className?: string;
 }
 
 export function ReportCard({
   id,
   titulo,
   descricao,
   icon: Icon = FileText,
   badge,
   badgeVariant = 'secondary',
   disabled = false,
   loading = false,
   onGenerate,
   onPreview,
   className,
 }: ReportCardProps) {
   return (
     <div
       className={cn(
         'group relative flex flex-col rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md',
         disabled && 'opacity-60 pointer-events-none',
         className
       )}
     >
       {/* Header */}
       <div className="flex items-start gap-3 mb-3">
         <div className="flex-shrink-0 p-2 rounded-md bg-primary/10 text-primary">
           <Icon className="h-5 w-5" />
         </div>
         <div className="flex-1 min-w-0">
           <h3 className="font-semibold text-sm leading-tight line-clamp-2">
             {titulo}
           </h3>
           {badge && (
             <Badge variant={badgeVariant} className="mt-1 text-xs">
               {badge}
             </Badge>
           )}
         </div>
       </div>
 
       {/* Descrição */}
       <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
         {descricao}
       </p>
 
       {/* Ações */}
       <div className="flex gap-2 mt-auto">
         {onPreview && (
           <Button
             variant="outline"
             size="sm"
             className="flex-1"
             onClick={onPreview}
             disabled={loading}
           >
             <Eye className="h-4 w-4 mr-1" />
             Prévia
           </Button>
         )}
         {onGenerate && (
           <Button
             variant="default"
             size="sm"
             className="flex-1"
             onClick={onGenerate}
             disabled={loading}
           >
             {loading ? (
               <Loader2 className="h-4 w-4 mr-1 animate-spin" />
             ) : (
               <Download className="h-4 w-4 mr-1" />
             )}
             Gerar PDF
           </Button>
         )}
       </div>
     </div>
   );
 }