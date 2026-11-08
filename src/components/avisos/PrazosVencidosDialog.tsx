/**
 * Pop-up dos prazos dos processos de contratação (P3, migração 20261128090000): ao entrar no sistema, quem tem prazo
 * vencido, vencendo em até 3 dias ou processo parado vê a lista. Pode fechar; volta na próxima entrada (a chave usa o
 * último acesso do Supabase Auth). A lista vem de compras_meus_prazos: o responsável vê os seus; quem tem
 * compras.processos.editar vê todos. Os botões levam à ficha (registrar movimentação ou remarcar).
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMeusPrazos } from "@/hooks/useProcessoPrazos";
import { chavePopupPrazos, prazoUrgente, rotuloTipoPrazo, textoMeuPrazo, type CategoriaMeuPrazo, type MeuPrazo } from "@/lib/compras/prazos";
import { cn } from "@/lib/utils";

const SECOES: { categoria: CategoriaMeuPrazo; titulo: string; icone: typeof Clock; destaque: boolean }[] = [
  { categoria: "vencido", titulo: "Vencidos", icone: AlertTriangle, destaque: true },
  { categoria: "proximo", titulo: "Vencem em até 3 dias", icone: Clock, destaque: false },
  { categoria: "parado", titulo: "Parados", icone: PauseCircle, destaque: false },
];

const MAX_POR_SECAO = 8;

function lerMarca(chave: string): boolean {
  try {
    return window.localStorage.getItem(chave) === "1";
  } catch {
    return false;
  }
}

function gravarMarca(chave: string) {
  try {
    window.localStorage.setItem(chave, "1");
  } catch {
    // sem armazenamento: o pop-up volta na próxima tela, o que é aceitável
  }
}

function Item({ p, aoSair }: { p: MeuPrazo; aoSair: () => void }) {
  const ficha = `/compras/processos/${p.processo_id}`;
  const oque = p.categoria === "parado" ? "Sem movimentação" : `${rotuloTipoPrazo(p.tipo)}${p.descricao && p.tipo !== "proxima_acao" ? ` · ${p.descricao}` : ""}`;
  return (
    <li className="space-y-1 rounded-md border border-border p-3 text-sm">
      <p className="font-medium">{p.numero_processo}{p.objeto ? ` · ${p.objeto}` : ""}</p>
      <p>
        {oque} ·{" "}
        <span className={cn(p.categoria === "vencido" && "font-medium text-destructive")}>{textoMeuPrazo(p)}</span>
        {p.responsavel && <span className="text-muted-foreground"> · {p.responsavel}</span>}
      </p>
      {(p.pode_editar || p.pode_ver) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {p.pode_editar ? (
            <>
              <Button asChild size="sm" variant="outline">
                <Link to={`${ficha}?aba=andamento&nova=1`} onClick={aoSair}>Registrar movimentação</Link>
              </Button>
              {p.categoria !== "parado" && (
                <Button asChild size="sm" variant="ghost">
                  <Link to={`${ficha}?aba=prazos`} onClick={aoSair}>Remarcar</Link>
                </Button>
              )}
            </>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to={`${ficha}?aba=prazos`} onClick={aoSair}>Abrir processo</Link>
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function PrazosVencidosDialog() {
  const { user } = useAuth();
  const [chave, setChave] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const prazos = useMeusPrazos(!!user);

  // a chave depende do último acesso, que só a sessão do Supabase Auth tem
  useEffect(() => {
    if (!user) return;
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (vivo) setChave(chavePopupPrazos(user.id, data.session?.user.last_sign_in_at));
    });
    return () => {
      vivo = false;
    };
  }, [user]);

  const urgentes = (prazos.data ?? []).filter(prazoUrgente);

  useEffect(() => {
    if (chave && urgentes.length > 0 && !lerMarca(chave)) setAberto(true);
  }, [chave, urgentes.length]);

  const fechar = () => {
    if (chave) gravarMarca(chave);
    setAberto(false);
  };

  if (urgentes.length === 0) return null;

  return (
    <Dialog open={aberto} onOpenChange={(v) => (v ? setAberto(true) : fechar())}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prazos dos processos</DialogTitle>
          <DialogDescription>
            Processos de contratação que pedem atenção. Esta lista volta na próxima vez que você entrar no sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {SECOES.map(({ categoria, titulo, icone: Icone, destaque }) => {
            const itens = urgentes.filter((p) => p.categoria === categoria);
            if (itens.length === 0) return null;
            return (
              <section key={categoria} aria-label={titulo} className="space-y-2">
                <h3 className={cn("flex items-center gap-1 text-sm font-semibold", destaque && "text-destructive")}>
                  <Icone className="h-4 w-4" aria-hidden="true" /> {titulo} ({itens.length})
                </h3>
                <ul className="space-y-2">
                  {itens.slice(0, MAX_POR_SECAO).map((p) => <Item key={`${p.categoria}-${p.prazo_id ?? p.processo_id}`} p={p} aoSair={fechar} />)}
                </ul>
                {itens.length > MAX_POR_SECAO && (
                  <p className="text-sm text-muted-foreground">e mais {itens.length - MAX_POR_SECAO} na lista de processos.</p>
                )}
              </section>
            );
          })}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button asChild variant="outline">
            <Link to="/compras/processos" onClick={fechar}>Abrir a lista de processos</Link>
          </Button>
          <Button onClick={fechar}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
