/**
 * PortalPreviewPage - Portal público completo do IDJuv
 */

import { PortalHeader } from "./portal/components/PortalHeader";
import { PortalHero } from "./portal/components/PortalHero";
import { PortalStats } from "./portal/components/PortalStats";
import { PortalDiretoria } from "./portal/components/PortalDiretoria";
import { PortalInfrastructure } from "./portal/components/PortalInfrastructure";
import { PortalPrograms } from "./portal/components/PortalPrograms";
import { PortalEsports } from "./portal/components/PortalEsports";
import { PortalNews } from "./portal/components/PortalNews";
import { PortalContact } from "./portal/components/PortalContact";
import { PortalFooter } from "./portal/components/PortalFooter";
import { InstagramFeed } from "@/components/social/InstagramFeed";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PortalPreviewPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <PortalHeader />

      {/* Hero Section */}
      <PortalHero />

      {/* Stats Section */}
      <PortalStats />

      {/* Diretoria Section - Nova seção com dados do BD */}
      <PortalDiretoria />

      {/* Programs Section */}
      <PortalPrograms />

      {/* Infrastructure Section - Nova seção */}
      <PortalInfrastructure />

      {/* E-Sports Section - Nova seção */}
      <PortalEsports />

      {/* News Section */}
      <PortalNews />

      {/* Instagram Feed */}
      <InstagramFeed username="idjuv_rr" />

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
