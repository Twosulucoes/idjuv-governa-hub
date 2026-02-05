 import { useState } from 'react';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
 } from '@/components/ui/command';
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from '@/components/ui/popover';
 import { Check, ChevronsUpDown, Plus, Building2, Users, Landmark } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useInstituicoesSelector } from '@/hooks/useInstituicoes';
 import { TipoInstituicaoBadge } from './TipoInstituicaoBadge';
 import type { TipoInstituicao } from '@/types/instituicoes';
 
 interface InstituicaoSelectorProps {
   value?: string;
   onChange: (id: string | undefined, instituicao?: {
     id: string;
     nome_razao_social: string;
     cnpj?: string;
     responsavel_nome?: string;
    responsavel_cpf?: string;
    responsavel_telefone?: string;
    responsavel_email?: string;
     tipo_instituicao: TipoInstituicao;
   }) => void;
   onAddNew?: () => void;
   disabled?: boolean;
   required?: boolean;
   placeholder?: string;
 }
 
 const ICONS = {
   formal: Building2,
   informal: Users,
   orgao_publico: Landmark,
 };
 
 export function InstituicaoSelector({
   value,
   onChange,
   onAddNew,
   disabled = false,
   required = false,
   placeholder = 'Selecione uma instituição...',
 }: InstituicaoSelectorProps) {
   const [open, setOpen] = useState(false);
   const { instituicoes, isLoading } = useInstituicoesSelector();
 
   const selectedInstituicao = instituicoes.find((i) => i.id === value);
 
   return (
     <div className="space-y-2">
       <div className="flex items-center justify-between">
         <Label>
           Instituição Solicitante {required && <span className="text-destructive">*</span>}
         </Label>
         {onAddNew && (
           <Button
             type="button"
             variant="ghost"
             size="sm"
             className="h-6 text-xs"
             onClick={onAddNew}
           >
             <Plus className="h-3 w-3 mr-1" />
             Cadastrar nova
           </Button>
         )}
       </div>
 
       <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
           <Button
             variant="outline"
             role="combobox"
             aria-expanded={open}
             className="w-full justify-between"
             disabled={disabled || isLoading}
           >
             {selectedInstituicao ? (
               <div className="flex items-center gap-2 truncate">
                 {(() => {
                   const Icon = ICONS[selectedInstituicao.tipo_instituicao];
                   return <Icon className="h-4 w-4 shrink-0" />;
                 })()}
                 <span className="truncate">{selectedInstituicao.nome_razao_social}</span>
                 {selectedInstituicao.cnpj && (
                   <span className="text-muted-foreground text-xs">
                     ({selectedInstituicao.cnpj})
                   </span>
                 )}
               </div>
             ) : (
               <span className="text-muted-foreground">{placeholder}</span>
             )}
             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
           </Button>
         </PopoverTrigger>
         <PopoverContent className="w-[400px] p-0" align="start">
           <Command>
             <CommandInput placeholder="Buscar instituição..." />
             <CommandList>
               <CommandEmpty>
                 <div className="py-4 text-center">
                   <p className="text-muted-foreground">Nenhuma instituição encontrada.</p>
                   {onAddNew && (
                     <Button
                       type="button"
                       variant="link"
                       size="sm"
                       onClick={() => {
                         setOpen(false);
                         onAddNew();
                       }}
                     >
                       <Plus className="h-3 w-3 mr-1" />
                       Cadastrar nova instituição
                     </Button>
                   )}
                 </div>
               </CommandEmpty>
               <CommandGroup>
                 {/* Opção para limpar seleção */}
                 {value && (
                   <CommandItem
                     onSelect={() => {
                       onChange(undefined);
                       setOpen(false);
                     }}
                     className="text-muted-foreground"
                   >
                     Limpar seleção
                   </CommandItem>
                 )}
                 {instituicoes.map((inst) => {
                   const Icon = ICONS[inst.tipo_instituicao];
                   return (
                     <CommandItem
                       key={inst.id}
                       value={`${inst.nome_razao_social} ${inst.cnpj || ''} ${inst.codigo_instituicao}`}
                       onSelect={() => {
                         onChange(inst.id, {
                           id: inst.id,
                           nome_razao_social: inst.nome_razao_social,
                           cnpj: inst.cnpj || undefined,
                           responsavel_nome: inst.responsavel_nome,
                          responsavel_cpf: inst.responsavel_cpf || undefined,
                          responsavel_telefone: inst.responsavel_telefone || undefined,
                          responsavel_email: inst.responsavel_email || undefined,
                           tipo_instituicao: inst.tipo_instituicao,
                         });
                         setOpen(false);
                       }}
                     >
                       <Check
                         className={cn(
                           'mr-2 h-4 w-4',
                           value === inst.id ? 'opacity-100' : 'opacity-0'
                         )}
                       />
                       <Icon className="mr-2 h-4 w-4 shrink-0" />
                       <div className="flex flex-col">
                         <span>{inst.nome_razao_social}</span>
                         <span className="text-xs text-muted-foreground">
                           {inst.codigo_instituicao}
                           {inst.cnpj && ` • ${inst.cnpj}`}
                         </span>
                       </div>
                     </CommandItem>
                   );
                 })}
               </CommandGroup>
             </CommandList>
           </Command>
         </PopoverContent>
       </Popover>
 
       {selectedInstituicao && (
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <TipoInstituicaoBadge tipo={selectedInstituicao.tipo_instituicao} size="sm" />
           {selectedInstituicao.responsavel_nome && (
             <span>• Resp: {selectedInstituicao.responsavel_nome}</span>
           )}
         </div>
       )}
     </div>
   );
 }