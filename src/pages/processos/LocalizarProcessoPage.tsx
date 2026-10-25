/**
 * Localizar processo (E1, spec docs/superpowers/specs/2026-10-25-localizador-processos-sei-design.md): uma busca pelo
 * nº SEI, em qualquer formato, ou por palavras, em todos os registros que guardam o número, agrupados por processo; e a
 * aba Parados. Só lê: tramitar é no SEI. A pessoa só acha o que já veria nos módulos dela (RLS de cada fonte).
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SearchX } from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/design-system";
import { CartaoProcessoSei } from "@/components/processos/localizador/CartaoProcessoSei";
import { ListaParados } from "@/components/processos/localizador/ListaParados";
import { useLocalizarProcessos } from "@/hooks/useLocalizadorSei";
import { agruparPorProcesso } from "@/lib/processos/localizador";
import { TERMO_MINIMO, termoBuscavel } from "@/lib/processos/numeroSei";

function ResultadoBusca({ termo }: { termo: string }) {
  const { data, isFetching, error, termoBuscado, digitando } = useLocalizarProcessos(termo);

  if (!termoBuscavel(termo)) {
    return (
      <EmptyState
        icone={Search}
        titulo="Digite o número ou uma palavra"
        descricao={`O número pode estar em qualquer formato (17302.000885/2026.92 ou 000885/26-92). Palavras do objeto, do assunto ou do setor também servem, a partir de ${TERMO_MINIMO} letras.`}
      />
    );
  }
  if (digitando || (isFetching && !data)) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return <EmptyState titulo="Não foi possível buscar" descricao={(error as Error).message} />;
  }

  const processos = agruparPorProcesso(data ?? []);
  if (processos.length === 0) {
    return (
      <EmptyState
        icone={SearchX}
        titulo={`Nada encontrado para "${termoBuscado}"`}
        descricao="Nada foi achado entre os módulos que você acessa. O processo pode existir no SEI sem ter sido registrado aqui."
      />
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-caption text-muted-foreground" aria-live="polite">
        {processos.length === 1 ? "1 processo encontrado" : `${processos.length} processos encontrados`}
      </p>
      {processos.map((p) => (
        <CartaoProcessoSei key={p.chave} processo={p} />
      ))}
    </div>
  );
}

export default function LocalizarProcessoPage() {
  const [params, setParams] = useSearchParams();
  const aba = params.get("aba") === "parados" ? "parados" : "buscar";
  const [termo, setTermo] = useState(params.get("q") ?? "");

  const trocarAba = (nova: string) => {
    const proximos = new URLSearchParams(params);
    if (nova === "parados") proximos.set("aba", "parados");
    else proximos.delete("aba");
    setParams(proximos, { replace: true });
  };

  return (
    <ModuleLayout module="workflow">
      <div className="space-y-4">
        <PageHeader
          migalhas={[{ rotulo: "Processos", href: "/processos" }, { rotulo: "Localizar processo" }]}
          titulo="Localizar processo"
          descricao="Tudo o que o sistema sabe de um processo do SEI, num lugar só. A tramitação continua no SEI."
        />

        <Tabs value={aba} onValueChange={trocarAba} className="max-w-5xl">
          <TabsList>
            <TabsTrigger value="buscar">Buscar</TabsTrigger>
            <TabsTrigger value="parados">Parados</TabsTrigger>
          </TabsList>

          <TabsContent value="buscar" className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                autoFocus
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Nº do processo SEI ou palavras do objeto"
                aria-label="Nº do processo SEI ou palavras do objeto"
                className="pl-9"
              />
            </div>
            <ResultadoBusca termo={termo} />
          </TabsContent>

          <TabsContent value="parados">
            <ListaParados />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
