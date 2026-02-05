 /**
  * Filtros comuns para relatórios de Unidades Locais
  */
 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { ChevronDown, Filter, X } from 'lucide-react';
 import { MUNICIPIOS_RORAIMA, TIPO_UNIDADE_LABELS, STATUS_UNIDADE_LABELS } from '@/types/unidadesLocais';
 
 export interface ReportFiltersState {
   municipio: string;
   tipo: string;
   status: string;
   periodo?: {
     inicio?: string;
     fim?: string;
   };
 }
 
 interface ReportFiltersProps {
   filters: ReportFiltersState;
   onChange: (filters: ReportFiltersState) => void;
   showPeriodo?: boolean;
   className?: string;
 }
 
 export function ReportFilters({
   filters,
   onChange,
   showPeriodo = false,
   className,
 }: ReportFiltersProps) {
   const [isOpen, setIsOpen] = useState(true);
 
   const hasActiveFilters = 
     filters.municipio !== 'all' ||
     filters.tipo !== 'all' ||
     filters.status !== 'all' ||
     filters.periodo?.inicio ||
     filters.periodo?.fim;
 
   const clearFilters = () => {
     onChange({
       municipio: 'all',
       tipo: 'all',
       status: 'all',
       periodo: { inicio: '', fim: '' },
     });
   };
 
   return (
     <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
       <div className="flex items-center justify-between mb-2">
         <CollapsibleTrigger asChild>
           <Button variant="ghost" size="sm" className="gap-2">
             <Filter className="h-4 w-4" />
             Filtros
             <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
           </Button>
         </CollapsibleTrigger>
         {hasActiveFilters && (
           <Button variant="ghost" size="sm" onClick={clearFilters}>
             <X className="h-4 w-4 mr-1" />
             Limpar
           </Button>
         )}
       </div>
 
       <CollapsibleContent>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
           {/* Município */}
           <div className="space-y-1">
             <Label className="text-xs">Município</Label>
             <Select
               value={filters.municipio}
               onValueChange={(value) => onChange({ ...filters, municipio: value })}
             >
               <SelectTrigger className="h-9">
                 <SelectValue placeholder="Todos" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os municípios</SelectItem>
                 {MUNICIPIOS_RORAIMA.map((mun) => (
                   <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Tipo */}
           <div className="space-y-1">
             <Label className="text-xs">Tipo de Unidade</Label>
             <Select
               value={filters.tipo}
               onValueChange={(value) => onChange({ ...filters, tipo: value })}
             >
               <SelectTrigger className="h-9">
                 <SelectValue placeholder="Todos" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os tipos</SelectItem>
                 {Object.entries(TIPO_UNIDADE_LABELS).map(([value, label]) => (
                   <SelectItem key={value} value={value}>{label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Status */}
           <div className="space-y-1">
             <Label className="text-xs">Status</Label>
             <Select
               value={filters.status}
               onValueChange={(value) => onChange({ ...filters, status: value })}
             >
               <SelectTrigger className="h-9">
                 <SelectValue placeholder="Todos" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os status</SelectItem>
                 {Object.entries(STATUS_UNIDADE_LABELS).map(([value, label]) => (
                   <SelectItem key={value} value={value}>{label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Período (opcional) */}
           {showPeriodo && (
             <div className="space-y-1">
               <Label className="text-xs">Período</Label>
               <div className="flex gap-2">
                 <input
                   type="date"
                   className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                   value={filters.periodo?.inicio || ''}
                   onChange={(e) => 
                     onChange({ 
                       ...filters, 
                       periodo: { ...filters.periodo, inicio: e.target.value } 
                     })
                   }
                 />
                 <input
                   type="date"
                   className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                   value={filters.periodo?.fim || ''}
                   onChange={(e) => 
                     onChange({ 
                       ...filters, 
                       periodo: { ...filters.periodo, fim: e.target.value } 
                     })
                   }
                 />
               </div>
             </div>
           )}
         </div>
       </CollapsibleContent>
     </Collapsible>
   );
 }