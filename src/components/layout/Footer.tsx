import * as React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";
import { SystemCredits } from "./SystemCredits";

import { useTenant } from '@/core/tenant';
import { LogoEntidadeSuperior } from '@/components/ui/Logo';

// Marca vem do perfil do tenant, não de '@/assets' (White Label — Fase 1).

export const Footer = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const { 
      nomeOficial, 
      nomeCurto, 
      vinculacao, 
      enderecoCompleto,
      emailInstitucional 
    } = useDadosOficiais();
    const {
      entidadeSuperior,
      identidade: { sigla },
    } = useTenant();

    return (
      <footer ref={ref} className="border-t border-border" {...props}>
        {/* Faixa decorativa superior */}
        <div className="faixa-brasil" />
        
        <div className="bg-primary dark:bg-card">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
              {/* Institucional */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-5">
                  {/* Logo do órgão — versão para fundos escuros */}
                  <Logo 
                    variant="dark"
                    className="logo-footer"
                  />
                </div>
                <p className="text-sm text-primary-foreground/80 dark:text-muted-foreground leading-relaxed mb-4">
                  {nomeOficial}. Autarquia vinculada 
                  à {vinculacao}.
                </p>
{entidadeSuperior && (
                  <div className="flex items-center gap-3 pt-2">
                    {/* Entidade superior precisa de container branco */}
                    <div className="logo-container-gov">
                      <LogoEntidadeSuperior variant="light" className="logo-gov w-auto" />
                    </div>
                    <span className="text-xs text-primary-foreground/60 dark:text-muted-foreground">
                      {entidadeSuperior.nome}
                    </span>
                  </div>
                )}
              </div>

              {/* Links Rápidos */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground dark:text-foreground mb-4">
                  Links Rápidos
                </h4>
                <ul className="space-y-2.5">
                  {[
                    { label: "Editais", href: "/editais" },
                    { label: "Base Legal", href: "/base-legal" },
                    { label: "Links Úteis", href: "/links-uteis" },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link 
                        to={link.href} 
                        className="text-sm text-primary-foreground/70 dark:text-muted-foreground hover:text-primary-foreground dark:hover:text-foreground transition-colors inline-flex items-center gap-1.5 group"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contato */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground dark:text-foreground mb-4">
                  Contato
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-primary-foreground/70 dark:text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-foreground/50 dark:text-muted-foreground" />
                    <span>{enderecoCompleto}</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-primary-foreground/70 dark:text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0 text-primary-foreground/50 dark:text-muted-foreground" />
                    <span>(95) 0000-0000</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-primary-foreground/70 dark:text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0 text-primary-foreground/50 dark:text-muted-foreground" />
                    <span>{emailInstitucional}</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-primary-foreground/70 dark:text-muted-foreground">
                    <Clock className="w-4 h-4 flex-shrink-0 text-primary-foreground/50 dark:text-muted-foreground" />
                    <span>Seg a Sex, 8h às 14h</span>
                  </li>
                </ul>
              </div>

              {/* Acesso */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground dark:text-foreground mb-4">
                  Área Restrita
                </h4>
                <p className="text-sm text-primary-foreground/70 dark:text-muted-foreground mb-4">
                  Acesso exclusivo para servidores do {sigla} com login institucional.
                </p>
                <Link
                  to="/acesso"
                  className="inline-flex items-center px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/90 transition-colors shadow-sm"
                >
                  Acessar Sistema
                </Link>
              </div>
            </div>

            {/* Barra inferior */}
            <div className="mt-10 pt-6 border-t border-primary-foreground/10 dark:border-border flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-primary-foreground/60 dark:text-muted-foreground text-center md:text-left">
                © {new Date().getFullYear()} {nomeCurto} - {nomeOficial}
              </p>
{entidadeSuperior && (
                <p className="text-xs text-primary-foreground/60 dark:text-muted-foreground">
                  {entidadeSuperior.nome}
                </p>
              )}
            </div>

            {/* Créditos técnicos */}
            <SystemCredits variant="dark" className="mt-4" />
          </div>
        </div>
        
        {/* Faixa decorativa inferior */}
        <div className="faixa-brasil" />
      </footer>
    );
  }
);

Footer.displayName = "Footer";