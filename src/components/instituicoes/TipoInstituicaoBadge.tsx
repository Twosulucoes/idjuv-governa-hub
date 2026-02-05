 import { Badge } from '@/components/ui/badge';
 import { Building2, Users, Landmark } from 'lucide-react';
 import type { TipoInstituicao } from '@/types/instituicoes';
 import { TIPO_INSTITUICAO_LABELS, TIPO_INSTITUICAO_COLORS } from '@/types/instituicoes';
 
 interface TipoInstituicaoBadgeProps {
   tipo: TipoInstituicao;
   showIcon?: boolean;
   size?: 'sm' | 'default';
 }
 
 const ICONS = {
   formal: Building2,
   informal: Users,
   orgao_publico: Landmark,
 };
 
 export function TipoInstituicaoBadge({ tipo, showIcon = true, size = 'default' }: TipoInstituicaoBadgeProps) {
   const Icon = ICONS[tipo];
   const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
   
   return (
     <Badge className={`${TIPO_INSTITUICAO_COLORS[tipo]} ${size === 'sm' ? 'text-xs px-2 py-0' : ''}`}>
       {showIcon && <Icon className={`${iconSize} mr-1`} />}
       {TIPO_INSTITUICAO_LABELS[tipo]}
     </Badge>
   );
 }