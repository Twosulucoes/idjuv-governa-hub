/**
 * PortalFooter - Footer exclusivo do portal público
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Twitter,
  ExternalLink,
  Heart
} from "lucide-react";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import logoGoverno from "@/assets/logo-governo-roraima.jpg";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";

export function PortalFooter() {
  const { nomeOficial, nomeCurto } = useDadosOficiais();

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: Twitter, href: "#", label: "Twitter" },
  ];

  const quickLinks = [
    { label: "Sobre o IDJUV", href: "/sobre" },
    { label: "Programas", href: "#programas" },
    { label: "Notícias", href: "/noticias" },
    { label: "Transparência", href: "/transparencia" },
    { label: "Contato", href: "/contato" },
  ];

  const institutionalLinks = [
    { label: "Governança", href: "/governanca" },
    { label: "Legislação", href: "/governanca/lei-criacao" },
    { label: "Canal de Denúncias", href: "/integridade/denuncias" },
    { label: "Ouvidoria", href: "/ouvidoria" },
    { label: "Acessibilidade", href: "/acessibilidade" },
  ];

  return (
    <footer className="relative overflow-hidden">
      {/* Top Wave */}
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-20 fill-background">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
        </svg>
      </div>

      {/* Faixa Brasil - cores nacionais intencionais */}
      {/* eslint-disable-next-line -- cores da bandeira do Brasil */}
      <div className="h-1.5 faixa-brasil" />

      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <LogoIdjuv variant="dark" className="h-14" />
              </div>
              <p className="text-primary-foreground/70 text-sm mb-6 leading-relaxed">
                {nomeOficial}. Promovendo o desenvolvimento esportivo e social da juventude roraimense.
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-primary-foreground" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="font-semibold text-lg mb-6">Links Rápidos</h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Institutional */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-semibold text-lg mb-6">Institucional</h4>
              <ul className="space-y-3">
                {institutionalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Government */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold text-lg mb-6">Governo de Roraima</h4>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <img 
                  src={logoGoverno} 
                  alt="Governo de Roraima" 
                  className="h-12 w-auto mx-auto"
                />
              </div>
              <p className="text-primary-foreground/70 text-sm text-center">
                Autarquia vinculada à Secretaria de Estado do Trabalho e Bem-Estar Social
              </p>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-primary-foreground/60 text-sm text-center md:text-left">
                © {new Date().getFullYear()} {nomeCurto}. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
                <span>Desenvolvido com</span>
                <Heart className="w-4 h-4 text-destructive fill-destructive" />
                <span>por Two Soluções</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Faixa Brasil Bottom - cores nacionais intencionais */}
      {/* eslint-disable-next-line -- cores da bandeira do Brasil */}
      <div className="h-1.5 faixa-brasil" />
    </footer>
  );
}
