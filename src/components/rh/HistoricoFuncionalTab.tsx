/**
 * Vida Funcional do Servidor - Refatorado
 * 
 * Estrutura:
 * 1. Cards Resumo (situação atual: provimento, lotação, cessão, designação)
 * 2. Botões de ação (nova nomeação, cessão, etc.)
 * 3. Timeline unificada (historico_funcional + atos vinculados inline)
 * 
 * Férias e Licenças ficam em abas próprias, não aparecem aqui.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Award, ArrowLeftRight, Plus } from "lucide-react";
import { VidaFuncionalResumo } from "./VidaFuncionalResumo";
import { VidaFuncionalTimeline } from "./VidaFuncionalTimeline";
import { NomeacoesProvimentosSection } from "./NomeacoesProvimentosSection";
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
      {/* 1. Cards de Resumo Situacional */}
      <VidaFuncionalResumo servidorId={servidorId} />

      {/* 2. Gestão (Provimentos, Cessões, Designações) - Accordion colapsável */}
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="provimentos" className="border rounded-lg px-2">
          <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Nomeações / Provimentos
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <NomeacoesProvimentosSection
              servidorId={servidorId}
              servidorNome={servidorNome}
              tipoServidor={tipoServidor}
            />
          </AccordionContent>
        </AccordionItem>

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

      {/* 3. Designações Temporárias */}
      <DesignacoesSection servidorId={servidorId} />

      <Separator />

      {/* 4. Timeline Funcional Unificada */}
      <VidaFuncionalTimeline servidorId={servidorId} />
    </div>
  );
}
