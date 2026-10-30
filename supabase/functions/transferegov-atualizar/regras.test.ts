import { describe, expect, it } from "vitest";
import { lerConfigGithub, podeDisparar } from "./regras.ts";

describe("lerConfigGithub", () => {
  const env = (valores: Record<string, string>) => (nome: string) => valores[nome];

  it("lê token e repositório e completa workflow e branch", () => {
    expect(lerConfigGithub(env({ GITHUB_DISPATCH_TOKEN: "t", GITHUB_REPO: "org/projeto" }))).toEqual({
      token: "t", repo: "org/projeto", workflow: "transferegov.yml", ref: "main",
    });
  });

  it("sem token ou com repositório fora do formato dono/nome, o botão fica desligado", () => {
    expect(lerConfigGithub(env({ GITHUB_REPO: "org/projeto" }))).toBeNull();
    expect(lerConfigGithub(env({ GITHUB_DISPATCH_TOKEN: "t", GITHUB_REPO: "projeto" }))).toBeNull();
    expect(lerConfigGithub(env({ GITHUB_DISPATCH_TOKEN: "t", GITHUB_REPO: "org/projeto/../x" }))).toBeNull();
  });
});

describe("podeDisparar", () => {
  const agora = new Date("2026-10-30T12:00:00Z");

  it("sem rodada anterior ou com a última há mais de 5 minutos, pode", () => {
    expect(podeDisparar(null, agora)).toEqual({ pode: true });
    expect(podeDisparar({ status: "completed", created_at: "2026-10-30T11:50:00Z" }, agora)).toEqual({ pode: true });
  });

  it("rodada em andamento: 409", () => {
    expect(podeDisparar({ status: "in_progress", created_at: "2026-10-30T11:00:00Z" }, agora)).toMatchObject({ pode: false, status: 409 });
    expect(podeDisparar({ status: "queued", created_at: "2026-10-30T11:59:00Z" }, agora)).toMatchObject({ pode: false, status: 409 });
  });

  it("terminou há menos de 5 minutos: 429 com quanto falta", () => {
    expect(podeDisparar({ status: "completed", created_at: "2026-10-30T11:58:00Z" }, agora)).toEqual({
      pode: false, status: 429, motivo: "A última atualização foi há pouco. Tente de novo em 3 minutos.",
    });
    expect(podeDisparar({ status: "completed", created_at: "2026-10-30T11:55:30Z" }, agora)).toMatchObject({
      motivo: "A última atualização foi há pouco. Tente de novo em 1 minuto.",
    });
  });
});
