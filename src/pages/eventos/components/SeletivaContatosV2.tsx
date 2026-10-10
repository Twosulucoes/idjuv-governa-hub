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
import { useTenant } from '@/core/tenant';
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

/**
 * Lista exibida quando a tabela de contatos está vazia.
 *
 * Os sites de eventos são da vertical de esporte (Fase 6 do White Label);
 * os contatos da instituição vêm do perfil do tenant, para que nenhum dado de
 * cliente fique fixo aqui.
 */
function contatosPadrao(
  identidade: { nomeCurto: string },
  contato?: { email?: string; telefone?: string; site?: string }
): Contato[] {
  const base: Contato[] = [{
    id: "1",
    tipo: "site_oficial",
    titulo: "Jogos da Juventude",
    subtitulo: "Site Oficial do COB",
    valor: "https://jogosdajuventude.org.br",
    icone: "trophy",
    ordem: 1
  }];

  if (contato?.site) {
    base.push({
      id: "3",
      tipo: "site_oficial",
      titulo: `Portal ${identidade.nomeCurto}`,
      subtitulo: `Site oficial do ${identidade.nomeCurto}`,
      valor: contato.site,
      icone: "globe",
      ordem: 3
    });
  }
  if (contato?.email) {
    base.push({
      id: "4",
      tipo: "coordenador",
      titulo: "Coordenação das Seleções",
      subtitulo: `${identidade.nomeCurto} - Diretoria de Esportes`,
      valor: contato.email,
      icone: "mail",
      ordem: 4
    });
  }
  if (contato?.telefone) {
    base.push({
      id: "5",
      tipo: "telefone",
      titulo: "Telefone de Contato",
      subtitulo: "Atendimento em horário de expediente",
      valor: contato.telefone,
      icone: "phone",
      ordem: 5
    });
  }
  return base;
}

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
  const { identidade, contato } = useTenant();
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
  const displayContatos =
    contatos && contatos.length > 0
      ? contatos
      : contatosPadrao(identidade, contato);

  // Separar por tipo
  const sitesOficiais = displayContatos.filter(c => c.tipo === "site_oficial");
  const contatosDiretos = displayContatos.filter(c => c.tipo !== "site_oficial");
  // Classe "dark" fixa: faixa sempre escura, com os tokens do tema escuro
  return <section className="dark py-16 px-4 bg-background text-foreground transition-colors">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full mb-4">
            <Globe className="w-4 h-4 text-foreground/80" aria-hidden="true" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/80">
              Links & Contatos
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[0.15em] uppercase text-foreground mb-3">
            INFORMAÇÕES OFICIAIS
          </h2>
          <p className="text-base tracking-[0.05em] text-muted-foreground max-w-2xl mx-auto">
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
          return <a key={site.id} href={site.valor} target="_blank" rel="noopener noreferrer" className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
            }} className="flex items-center gap-4 p-6 rounded-2xl bg-muted/60 border border-border hover:border-muted-foreground hover:bg-muted transition-all">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center group-hover:bg-muted-foreground/30 transition-colors" aria-hidden="true">
                      <Icon className="w-7 h-7 text-foreground/80 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground tracking-wide">
                        {site.titulo}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </h3>
                      {site.subtitulo && <p className="text-base text-muted-foreground">{site.subtitulo}</p>}
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
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
          return <Wrapper key={contato.id} {...wrapperProps} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
            }} className="flex items-center gap-4 p-5 rounded-xl bg-muted/40 border border-border hover:border-muted-foreground transition-all">
                    <div aria-hidden="true" className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground tracking-wide">
                        {contato.titulo}
                      </h3>
                      {contato.subtitulo && <p className="text-sm text-muted-foreground mt-0.5">{contato.subtitulo}</p>}
                      <p className="text-base text-foreground/80 mt-1 truncate group-hover:text-foreground transition-colors">
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
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">Os Jogos da Juventude são organizados pelo Comitê Olímpico do Brasil (COB).</p>
        </motion.div>
      </div>
    </section>;
}
