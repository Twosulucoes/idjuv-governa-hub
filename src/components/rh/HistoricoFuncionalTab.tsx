/**
 * Vida Funcional do Servidor - Consolidado
 * 
 * Estrutura simplificada:
 * 1. Vínculos Funcionais (fonte única - inclui cargo, lotação, nomeação)
 * 2. Cards Resumo (situação atual derivada dos vínculos)
 * 3. Cessões (tabela própria)
 * 4. Designações Temporárias
 * 5. Timeline unificada
 */
import { Separator } from "@/components/ui/separator";
import { ArrowLeftRight } from "lucide-react";
import { VidaFuncionalResumo } from "./VidaFuncionalResumo";
import { VinculosServidorPanel } from "./VinculosServidorPanel";
import { VidaFuncionalTimeline } from "./VidaFuncionalTimeline";
import { CessoesSection } from "./CessoesSection";
import { DesignacoesSection } from "./DesignacoesSection";
import { type TipoServidor } from "@/types/servidor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HistoricoFuncionalTabProps {
  servidorId: string;
  servidorNome: string;
  tipoServidor?: TipoServidor;
}

export function HistoricoFuncionalTab({ servidorId, servidorNome, tipoServidor }: HistoricoFuncionalTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. Vínculos Funcionais (consolidado) */}
      <VinculosServidorPanel servidorId={servidorId} servidorNome={servidorNome} />

      {/* 2. Cards de Resumo Situacional */}
      <VidaFuncionalResumo servidorId={servidorId} />

      {/* 3. Cessões e Designações */}
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="cessoes" className="border rounded-lg px-2">
          <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              Cessões
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <CessoesSection
              servidorId={servidorId}
              servidorNome={servidorNome}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 4. Designações Temporárias */}
      <DesignacoesSection servidorId={servidorId} />

      <Separator />

      {/* 5. Timeline Funcional Unificada */}
      <VidaFuncionalTimeline servidorId={servidorId} />
    </div>
  );
}
