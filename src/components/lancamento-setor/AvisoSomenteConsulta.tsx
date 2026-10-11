/**
 * Aviso de "somente consulta" no topo das telas de um módulo (fase 1: RH, pelo ModuleLayout — um ponto central, não
 * tela por tela). Lê o fundamento de setor do login no módulo (RPC meus_fundamentos_lancamento) e só aparece quando o
 * módulo está em "exigir" e o login não tem fundamento (`bloqueado`). Em "registrar" nada é recusado e nada aparece.
 *
 * O texto cita só o que o banco libera mesmo sem fundamento de setor (fundamento_linha): autoatendimento — pedidos de
 * abono, ajuste e justificativa de ponto, requerimento de documentos e a assinatura da própria frequência — e a
 * validação da chefia na frequência. Férias e licenças não têm autoatendimento nem chefia no banco: não as cite.
 * É aviso, não controle: quem recusa a gravação é o banco (RHS01).
 */

import { Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFundamentosLancamento } from "@/hooks/useLancamentoPorSetor";
import { moduloTemRegraNoBanco } from "@/lib/lancamentoSetorRegras";
import { getModuleByCode, type Modulo } from "@/shared/config/modules.config";

interface AvisoSomenteConsultaProps {
  modulo: Modulo;
  className?: string;
}

export function AvisoSomenteConsulta({ modulo, className }: AvisoSomenteConsultaProps) {
  const ativo = moduloTemRegraNoBanco(modulo);
  const { doModulo } = useFundamentosLancamento(ativo);
  if (!ativo) return null;

  // Só no modo exigir (bloqueado = exigir e sem fundamento de setor); em registrar nada é recusado e nada aparece
  const f = doModulo(modulo);
  if (!f?.bloqueado) return null;

  const setor = getModuleByCode(modulo)?.nome ?? modulo;
  const semServidor = f.via === "negado_sem_servidor";
  const motivo = semServidor
    ? "Seu login não tem servidor vinculado."
    : `Você não está lotado nem designado no setor de ${setor}.`;

  return (
    <Alert role="status" className={`mb-4 border-warning/40 bg-warning/10 ${className ?? ""}`}>
      <Lock className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Somente consulta em {setor}</AlertTitle>
      <AlertDescription>
        <p>
          {motivo} Os lançamentos do setor de {setor} (incluir, alterar ou excluir registros) são recusados pelo banco.
        </p>
        {!semServidor && (
          <p className="mt-1">
            Continuam liberados: os seus pedidos de abono, de ajuste e de justificativa de ponto e de documentos, a
            assinatura da sua frequência e, se você valida a frequência de uma equipe, a validação da chefia.
          </p>
        )}
        <p className="mt-1 text-muted-foreground">
          {semServidor
            ? "Peça ao administrador para vincular seu login ao seu cadastro de servidor."
            : "Se você deveria lançar aqui, peça ao RH a lotação ou a designação (aprovada, com ato) no setor."}
        </p>
      </AlertDescription>
    </Alert>
  );
}
