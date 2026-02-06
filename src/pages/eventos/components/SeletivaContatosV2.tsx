/**
 * Seção de Contatos e Links Oficiais V2 - Seletivas Estudantis
 * Informações de contato do coordenador e links dos Jogos da Juventude
 */

import { motion } from "framer-motion";
import { Globe, Mail, Phone, ExternalLink, GraduationCap, Trophy, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";
interface Contato {
  id: string;
  tipo: string;
  titulo: string;
  subtitulo: string | null;
  valor: string;
  icone: string | null;
  ordem: number;
}
const iconMap: Record<string, LucideIcon> = {
  globe: Globe,
  mail: Mail,
  phone: Phone,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  users: Users,
  "map-pin": MapPin
};

// Dados padrão caso não haja no banco
const contatosPadrao: Contato[] = [{
  id: "1",
  tipo: "site_oficial",
  titulo: "Jogos da Juventude",
  subtitulo: "Site Oficial do COB",
  valor: "https://jogosdajuventude.org.br",
  icone: "trophy",
  ordem: 1
}, {
  id: "2",
  tipo: "site_oficial",
  titulo: "Jogos Escolares",
  subtitulo: "Site Oficial do JERS",
  valor: "https://www.jogosescolaresrr.com.br",
  icone: "graduation-cap",
  ordem: 2
}, {
  id: "3",
  tipo: "site_oficial",
  titulo: "Portal IDJuv",
  subtitulo: "Site Oficial do IDJuv",
  valor: "https://idjuv.online",
  icone: "globe",
  ordem: 3
}, {
  id: "4",
  tipo: "coordenador",
  titulo: "Coordenação das Seleções",
  subtitulo: "IDJuv - Diretoria de Esportes",
  valor: "idjuv.diesp@gmail.com",
  icone: "mail",
  ordem: 4
}, {
  id: "5",
  tipo: "telefone",
  titulo: "Telefone de Contato",
  subtitulo: "Atendimento das 8h às 14h",
  valor: "(95) 3621-XXXX",
  icone: "phone",
  ordem: 5
}];
function getIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Globe;
  return iconMap[iconName] || Globe;
}
function isLink(valor: string): boolean {
  return valor.startsWith("http://") || valor.startsWith("https://");
}
function isEmail(valor: string): boolean {
  return valor.includes("@") && !valor.startsWith("http");
}
function isPhone(valor: string): boolean {
  return valor.startsWith("(") || valor.startsWith("+");
}
export function SeletivaContatosV2() {
  const {
    data: contatos
  } = useQuery({
    queryKey: ["contatos-eventos-esportivos"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("contatos_eventos_esportivos").select("*").eq("ativo", true).eq("evento", "seletivas_2026").order("ordem", {
        ascending: true
      });
      if (error) throw error;
      return data as Contato[];
    }
  });
  const displayContatos = contatos && contatos.length > 0 ? contatos : contatosPadrao;

  // Separar por tipo
  const sitesOficiais = displayContatos.filter(c => c.tipo === "site_oficial");
  const contatosDiretos = displayContatos.filter(c => c.tipo !== "site_oficial");
  return <section className="py-16 px-4 bg-zinc-900 dark:bg-zinc-950 transition-colors">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 dark:bg-zinc-800 rounded-full mb-4">
            <Globe className="w-4 h-4 text-zinc-300" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-300">
              Links & Contatos
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[0.15em] uppercase text-white mb-3">
            INFORMAÇÕES OFICIAIS
          </h2>
          <p className="text-base tracking-[0.05em] text-zinc-400 max-w-2xl mx-auto">
            Acesse os sites oficiais das competições e entre em contato com a coordenação
          </p>
        </motion.div>

        {/* Sites Oficiais */}
        {sitesOficiais.length > 0 && <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="grid md:grid-cols-2 gap-4 mb-8">
            {sitesOficiais.map((site, index) => {
          const Icon = getIcon(site.icone);
          return <a key={site.id} href={site.valor} target="_blank" rel="noopener noreferrer" className="group">
                  <motion.div initial={{
              opacity: 0,
              x: index === 0 ? -20 : 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="flex items-center gap-4 p-6 rounded-2xl bg-zinc-800/50 dark:bg-zinc-800/80 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all">
                    <div className="w-14 h-14 rounded-xl bg-zinc-700 flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                      <Icon className="w-7 h-7 text-zinc-300 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white tracking-wide">
                        {site.titulo}
                      </h3>
                      {site.subtitulo && <p className="text-sm text-zinc-400">{site.subtitulo}</p>}
                    </div>
                    <ExternalLink className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                  </motion.div>
                </a>;
        })}
          </motion.div>}

        {/* Contatos Diretos */}
        {contatosDiretos.length > 0 && <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="grid md:grid-cols-2 gap-4">
            {contatosDiretos.map((contato, index) => {
          const Icon = getIcon(contato.icone);
          let href = contato.valor;
          if (isEmail(contato.valor)) {
            href = `mailto:${contato.valor}`;
          } else if (isPhone(contato.valor)) {
            href = `tel:${contato.valor.replace(/\D/g, "")}`;
          }
          const Wrapper = isLink(contato.valor) || isEmail(contato.valor) || isPhone(contato.valor) ? "a" : "div";
          const wrapperProps = Wrapper === "a" ? {
            href,
            target: isLink(contato.valor) ? "_blank" : undefined,
            rel: isLink(contato.valor) ? "noopener noreferrer" : undefined
          } : {};
          return <Wrapper key={contato.id} {...wrapperProps} className="group">
                  <motion.div initial={{
              opacity: 0,
              y: 10
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.2 + index * 0.1
            }} className="flex items-center gap-4 p-5 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {contato.titulo}
                      </h4>
                      {contato.subtitulo && <p className="text-xs text-zinc-500 mt-0.5">{contato.subtitulo}</p>}
                      <p className="text-sm text-zinc-300 mt-1 truncate group-hover:text-white transition-colors">
                        {contato.valor}
                      </p>
                    </div>
                  </motion.div>
                </Wrapper>;
        })}
          </motion.div>}

        {/* Nota de rodapé */}
        <motion.div initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} viewport={{
        once: true
      }} className="mt-12 text-center">
          <p className="text-xs text-zinc-500 max-w-xl mx-auto">Os Jogos da Juventude são organizados pelo Comitê Olímpico do Brasil (COB).</p>
        </motion.div>
      </div>
    </section>;
}
