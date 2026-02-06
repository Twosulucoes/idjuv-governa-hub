/**
 * PortalPreviewPage - Portal público completo do IDJuv
 */

import { PortalHeader } from "./portal/components/PortalHeader";
import { PortalHero } from "./portal/components/PortalHero";
import { PortalStats } from "./portal/components/PortalStats";
import { PortalPrograms } from "./portal/components/PortalPrograms";
import { PortalNews } from "./portal/components/PortalNews";
import { PortalContact } from "./portal/components/PortalContact";
import { PortalFooter } from "./portal/components/PortalFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PortalPreviewPage() {
  return (
    <div className="min-h-screen">
      {/* Banner de teste */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-destructive/90 backdrop-blur-sm py-2 px-4 text-center border-b border-destructive/50">
        <Badge variant="outline" className="bg-white/10 text-white border-white/20 animate-pulse">
          🔒 AMBIENTE DE TESTES - NÃO PÚBLICO
        </Badge>
      </div>

      {/* Header */}
      <div className="pt-10">
        <PortalHeader />
      </div>

      {/* Hero Section */}
      <PortalHero />

      {/* Stats Section */}
      <PortalStats />

      {/* Programs Section */}
      <PortalPrograms />

      {/* News Section */}
      <PortalNews />

      {/* Contact Section */}
      <PortalContact />

      {/* Footer */}
      <PortalFooter />

      {/* Floating Admin Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button asChild size="lg" className="rounded-full shadow-2xl">
          <Link to="/auth">
            Voltar para Área Administrativa
          </Link>
        </Button>
      </div>
    </div>
  );
}
