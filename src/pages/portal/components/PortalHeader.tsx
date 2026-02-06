/**
 * PortalHeader - Header transparente do portal público
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import { cn } from "@/lib/utils";

export function PortalHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Início", href: "/" },
    { label: "Programas", href: "#programas" },
    { label: "Notícias", href: "/noticias" },
    { label: "Transparência", href: "/transparencia" },
    { label: "Contato", href: "/contato" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled 
            ? "bg-background/95 backdrop-blur-lg shadow-lg border-b border-border" 
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <LogoIdjuv 
                variant={isScrolled ? "auto" : "dark"} 
                className="h-10 md:h-12" 
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                    isScrolled
                      ? "text-foreground hover:bg-muted"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                asChild
                variant={isScrolled ? "default" : "secondary"}
                size="sm"
                className="rounded-full"
              >
                <Link to="/auth">
                  <Lock className="w-4 h-4 mr-2" />
                  Área Restrita
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-colors",
                isScrolled
                  ? "text-foreground hover:bg-muted"
                  : "text-white hover:bg-white/10"
              )}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 z-40 lg:hidden"
          >
            <div className="bg-background/95 backdrop-blur-lg border-b border-border shadow-xl">
              <nav className="container mx-auto px-4 py-6">
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                  <div className="pt-4 border-t border-border mt-2">
                    <Button asChild className="w-full rounded-full">
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        <Lock className="w-4 h-4 mr-2" />
                        Área Restrita
                      </Link>
                    </Button>
                  </div>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
