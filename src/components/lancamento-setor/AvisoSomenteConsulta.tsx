/**
 * Aviso de "somente consulta" no topo das telas de um módulo (fase 1: RH, pelo ModuleLayout — um ponto central, não
 * tela por tela). Lê o fundamento do login no módulo (RPC meus_fundamentos_lancamento):
 *   - modo exigir e sem fundamento de setor (`bloqueado`): aviso claro de que os lançamentos do setor ficam só para
 *     consulta;
 *   - modo registrar e sem fundamento de setor: nota discreta de que os lançamentos do setor seriam recusados quando a
 *     regra for exigida;
 * O texto fala só de "lançamentos do setor": autoatendimento (o que é do próprio servidor) e decisões da chefia não
 * aparecem na RPC e continuam valendo.
 *   - com fundamento, modo desligado, módulo sem a regra no banco ou RPC indisponível: nada.
 * É aviso, não controle: quem recusa a gravação é o banco (RHS01).
 */

import { Info, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFundamentosLancamento } from "@/hooks/useLancamentoPorSetor";
import { moduloTemRegraNoBanco, semFundamento } from "@/lib/lancamentoSetorRegras";
import { getModuleByCode, type Modulo } from "@/shared/config/modules.config";

interface AvisoSomenteConsultaProps {
  modulo: Modulo;
  className?: string;
}

export function AvisoSomenteConsulta({ modulo, className }: AvisoSomenteConsultaProps) {
  const ativo = moduloTemRegraNoBanco(modulo);
  const { doModulo } = useFundamentosLancamento(ativo);
  if (!ativo) return null;

  const f = doModulo(modulo);
  if (!f || f.modo === "desligado" || !semFundamento(f)) return null;
  const bloqueado = f.bloqueado;

  const setor = getModuleByCode(modulo)?.nome ?? modulo;
  const semServidor = f.via === "negado_sem_servidor";
  const motivo = semServidor
    ? "Seu login não tem servidor vinculado."
    : `Você não está lotado, designado nem em comissão vigente no setor de ${setor}.`;

  if (bloqueado) {
    return (
      <Alert role="status" className={`mb-4 border-warning/40 bg-warning/10 ${className ?? ""}`}>
        <Lock className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Somente consulta em {setor}</AlertTitle>
        <AlertDescription>
          <p>
            {motivo} Os lançamentos do setor de {setor} (incluir, alterar, excluir registros do setor) são recusados
            pelo banco. O que é seu (pedir férias, frequência, requerimentos) e as decisões de chefia continuam
            liberados.
          </p>
          <p className="mt-1 text-muted-foreground">
            {semServidor
              ? "Peça ao administrador para vincular seu login ao seu cadastro de servidor."
              : "Se você deveria lançar aqui, peça ao RH a lotação, a designação (com ato) ou a inclusão na comissão."}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <p
      role="note"
      className={`mb-4 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-caption text-muted-foreground ${className ?? ""}`}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {motivo} Hoje nada é bloqueado, mas os lançamentos do setor de {setor} feitos por você seriam recusados quando a
        regra de setor passar a ser exigida. O que é seu e as decisões de chefia não mudam.
      </span>
    </p>
  );
}
