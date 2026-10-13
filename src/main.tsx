import { createRoot } from "react-dom/client";
import "./index.css";
import { clearOldSessions } from "@/lib/supabase";
import { MODO_SITE } from "@/core/modo-app";

// Limpa tokens de projetos Supabase antigos/externos ANTES de qualquer inicialização
clearOldSessions();

// `import.meta.env.VITE_APP_MODE` é trocado em tempo de build: o ramo não usado sai do bundle
// (o build `site` não carrega o sistema interno; o padrão não carrega o AppSite).
const carregarRaiz = MODO_SITE
  ? () => import("./AppSite.tsx")
  : () => import("./App.tsx");

carregarRaiz().then(({ default: Raiz }) => {
  createRoot(document.getElementById("root")!).render(<Raiz />);
});
