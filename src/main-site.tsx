import { createRoot } from "react-dom/client";
import AppSite from "./AppSite.tsx";
import "./index.css";
import { clearOldSessions } from "@/lib/supabase";

// Entrada do build `site` (o vite.config troca /src/main.tsx por este arquivo no index.html).
// O `main.tsx` do sistema fica exatamente como era: não carrega nada do site e vice-versa.

// Limpa tokens de projetos Supabase antigos/externos ANTES de qualquer inicialização
clearOldSessions();

createRoot(document.getElementById("root")!).render(<AppSite />);
