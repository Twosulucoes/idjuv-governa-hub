import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { clearOldSessions } from "@/lib/supabase";

// Limpa tokens de projetos Supabase antigos/externos ANTES de qualquer inicialização
clearOldSessions();

// P12: a regra de cache da API saiu do service worker; apaga o cache antigo (respostas com dado pessoal)
// que ficou nos aparelhos que já tinham o PWA instalado.
if ("caches" in window) {
  void caches.delete("supabase-cache").catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<App />);

