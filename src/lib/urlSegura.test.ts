import { describe, expect, it } from "vitest";
import { REGEX_URL_HTTP, urlHttpAbsoluta, urlSegura } from "@/lib/urlSegura";

describe("urlSegura", () => {
  it("aceita http e https", () => {
    expect(urlSegura("https://exemplo.gov.br/edital.pdf")).toBe("https://exemplo.gov.br/edital.pdf");
    expect(urlSegura("http://exemplo.gov.br")).toBe("http://exemplo.gov.br/");
    expect(urlSegura("  HTTPS://exemplo.gov.br/a  ")).toBe("https://exemplo.gov.br/a");
  });

  it("aceita caminho interno que começa com /", () => {
    expect(urlSegura("/x")).toBe("/x");
    expect(urlSegura("/transparencia/editais?ano=2026")).toBe("/transparencia/editais?ano=2026");
  });

  it("recusa protocolos perigosos", () => {
    expect(urlSegura("javascript:alert(1)")).toBeUndefined();
    expect(urlSegura("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(urlSegura("vbscript:msgbox(1)")).toBeUndefined();
    expect(urlSegura("file:///etc/passwd")).toBeUndefined();
  });

  it("recusa variações com espaço, maiúsculas e caracteres de controle", () => {
    expect(urlSegura(" javascript:alert(1)")).toBeUndefined();
    expect(urlSegura("JavaScript:alert(1)")).toBeUndefined();
    expect(urlSegura("JAVASCRIPT:alert(1)")).toBeUndefined();
    expect(urlSegura("java\tscript:alert(1)")).toBeUndefined();
    expect(urlSegura("java\nscript:alert(1)")).toBeUndefined();
    expect(urlSegura("java\rscript:alert(1)")).toBeUndefined();
    expect(urlSegura("https://exemplo.gov.br/\na")).toBeUndefined();
  });

  it("recusa URL de outro host sem protocolo e valores vazios", () => {
    expect(urlSegura("//x")).toBeUndefined();
    expect(urlSegura("//evil.com/a")).toBeUndefined();
    expect(urlSegura("/\\evil.com")).toBeUndefined();
    expect(urlSegura("exemplo.gov.br")).toBeUndefined();
    expect(urlSegura("")).toBeUndefined();
    expect(urlSegura("   ")).toBeUndefined();
    expect(urlSegura(null)).toBeUndefined();
    expect(urlSegura(undefined)).toBeUndefined();
  });
});

describe("urlHttpAbsoluta", () => {
  it("só aceita http(s) absoluto", () => {
    expect(urlHttpAbsoluta("https://a.b/c")).toBe("https://a.b/c");
    expect(urlHttpAbsoluta("/x")).toBeNull();
    expect(urlHttpAbsoluta("javascript:alert(1)")).toBeNull();
  });
});

describe("REGEX_URL_HTTP", () => {
  it("aceita http(s) e recusa javascript:", () => {
    expect(REGEX_URL_HTTP.test("https://a.b")).toBe(true);
    expect(REGEX_URL_HTTP.test("HTTP://a.b")).toBe(true);
    expect(REGEX_URL_HTTP.test("javascript:alert(1)")).toBe(false);
  });
});
