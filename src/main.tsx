import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { clearOldSessions } from "@/lib/supabase";

// Limpa tokens de projetos Supabase antigos/externos ANTES de qualquer inicialização
clearOldSessions();

createRoot(document.getElementById("root")!).render(<App />);

