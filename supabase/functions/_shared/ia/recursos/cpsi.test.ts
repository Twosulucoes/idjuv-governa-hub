import { assert, assertEquals, assertStringIncludes, assertThrows } from "jsr:@std/assert@1";
import { ErroRecurso, LIMITE_CAMPO, LIMITE_TOTAL, prepararCpsi, SYSTEM_PROMPT } from "./cpsi.ts";

function preparar(body: unknown) {
  const r = prepararCpsi(body);
  if ("erro" in r) throw new Error(`esperava pedido, veio erro: ${r.erro}`);
  return r;
}

Deno.test("cpsi: recusa ação ou documento desconhecido e corpo nulo", () => {
  assertEquals(prepararCpsi(null), { erro: "Pedido inválido" });
  assertEquals(prepararCpsi({ action: "apagar", documentType: "dfd" }), { erro: "Pedido inválido" });
  assertEquals(prepararCpsi({ action: "review", documentType: "xyz" }), { erro: "Pedido inválido" });
});

Deno.test("cpsi: recusa formData que não é objeto, com mais de 60 entradas ou valor não-texto", () => {
  assertEquals(prepararCpsi({ action: "review", documentType: "tr", formData: [] }), { erro: "Pedido inválido" });
  const muitas: Record<string, string> = {};
  for (let i = 0; i < 61; i++) muitas[`c${i}`] = "x";
  assertEquals(prepararCpsi({ action: "review", documentType: "tr", formData: muitas }), { erro: "Pedido inválido" });
  assertEquals(prepararCpsi({ action: "review", documentType: "tr", formData: { a: 1 } }), { erro: "Pedido inválido" });
});

Deno.test("cpsi: limites de tamanho por campo e total", () => {
  const grande = prepararCpsi({ action: "fill_all", documentType: "dfd", context: "a".repeat(LIMITE_CAMPO + 1) });
  assertEquals(grande, { erro: `Cada campo pode ter no máximo ${LIMITE_CAMPO} caracteres.` });

  const formData: Record<string, string> = {};
  for (let i = 0; i < 7; i++) formData[`c${i}`] = "a".repeat(LIMITE_CAMPO - 10);
  const total = prepararCpsi({ action: "review", documentType: "etp", formData });
  assertEquals(total, { erro: `O documento passa de ${LIMITE_TOTAL} caracteres; revise por partes.` });
});

Deno.test("cpsi: fill_all monta o prompt com os campos e trata o JSON (inclusive em bloco markdown)", () => {
  const r = preparar({ action: "fill_all", documentType: "dfd", context: "Sistema X" });
  assertEquals(r.stream, false);
  assertEquals(r.pedido.sistema, SYSTEM_PROMPT);
  assertEquals(r.pedido.maxTokens, 16384);
  assertStringIncludes(r.pedido.prompt, '"Sistema X"');
  assertStringIncludes(r.pedido.prompt, '- "areaRequisitante": Área Requisitante — Setor que demanda a contratação');
  assertStringIncludes(r.pedido.prompt, "Documento de Formalização de Demanda (DFD)");

  assertEquals(r.tratar('{"cargo":"Diretor"}'), { fields: { cargo: "Diretor" } });
  assertEquals(r.tratar('```json\n{"cargo":"Diretor"}\n```'), { fields: { cargo: "Diretor" } });
});

Deno.test("cpsi: JSON inválido no fill_all vira ErroRecurso 422 sem o texto do modelo", () => {
  const r = preparar({ action: "fill_all", documentType: "tr" });
  const e = assertThrows(() => r.tratar("isto não é json SEGREDO"), ErroRecurso);
  assertEquals(e.status, 422);
  assert(!e.message.includes("SEGREDO"));
});

Deno.test("cpsi: fill_field devolve { content } e usa o contexto preenchido", () => {
  const r = preparar({
    action: "fill_field",
    documentType: "etp",
    fieldName: "riscos",
    fieldLabel: "Riscos Identificados",
    currentValue: "",
    formData: { objeto: "Plataforma", vazio: "  " },
  });
  assertEquals(r.stream, false);
  assertStringIncludes(r.pedido.prompt, 'Gere o conteúdo para o campo "Riscos Identificados" (riscos).');
  assertStringIncludes(r.pedido.prompt, "objeto: Plataforma");
  assert(!r.pedido.prompt.includes("vazio:"));
  assertStringIncludes(r.pedido.prompt, "Gere um texto inicial adequado.");
  assertEquals(r.tratar("texto"), { content: "texto" });
});

Deno.test("cpsi: review é stream", () => {
  const r = preparar({ action: "review", documentType: "tr", formData: { objeto: "X" } });
  assertEquals(r.stream, true);
  assertStringIncludes(r.pedido.prompt, "**objeto**: X");
  assertStringIncludes(r.pedido.prompt, "Termo de Referência (TR)");
});
