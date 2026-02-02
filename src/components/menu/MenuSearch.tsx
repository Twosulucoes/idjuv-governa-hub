/**
 * MENU SEARCH COMPONENT
 * 
 * Campo de busca para encontrar itens do menu existentes
 * Filtra por nome do item e palavras parciais
 * Respeita RBAC - mostra apenas itens permitidos
 * 
 * @version 1.0.0
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenu, type MenuItemFiltered } from "@/contexts/MenuContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuSearchProps {
  onNavigate?: () => void;
  className?: string;
  placeholder?: string;
  variant?: "desktop" | "mobile";
}

interface SearchResult {
  item: MenuItemFiltered;
  sectionLabel: string;
  parentLabel?: string;
}

export function MenuSearch({ 
  onNavigate, 
  className, 
  placeholder = "Buscar no menu...",
  variant = "desktop" 
}: MenuSearchProps) {
  const navigate = useNavigate();
  const { sections, dashboard } = useMenu();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Coletar todos os itens pesquisáveis (com rotas)
  const allItems = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];

    // Dashboard sempre pesquisável
    if (dashboard.route) {
      results.push({
        item: dashboard,
        sectionLabel: "Início"
      });
    }

    // Coletar de todas as seções
    const collectItems = (
      items: MenuItemFiltered[],
      sectionLabel: string,
      parentLabel?: string
    ) => {
      for (const item of items) {
        if (item.route) {
          results.push({
            item,
            sectionLabel,
            parentLabel
          });
        }
        if (item.children && item.children.length > 0) {
          collectItems(item.children, sectionLabel, item.label);
        }
      }
    };

    for (const section of sections) {
      collectItems(section.items, section.label);
    }

    return results;
  }, [sections, dashboard]);

  // Filtrar resultados baseado na query
  const filteredResults = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    
    return allItems.filter((result) => {
      const searchText = [
        result.item.label,
        result.item.labelShort,
        result.sectionLabel,
        result.parentLabel
      ].filter(Boolean).join(" ").toLowerCase();

      // Todas as palavras da busca devem corresponder
      return searchTerms.every(term => searchText.includes(term));
    }).slice(0, 10); // Limitar a 10 resultados
  }, [query, allItems]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Abrir resultados quando há query
  useEffect(() => {
    setIsOpen(query.trim().length > 0);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.item.route) {
      navigate(result.item.route);
      setQuery("");
      setIsOpen(false);
      onNavigate?.();
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pl-9 pr-8",
            variant === "mobile" && "h-12 text-base"
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Resultados */}
      {isOpen && filteredResults.length > 0 && (
        <div className={cn(
          "absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg",
          variant === "mobile" && "mt-2"
        )}>
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {filteredResults.map((result, index) => {
                const Icon = result.item.icon;
                return (
                  <button
                    key={`${result.item.id}-${index}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors",
                      "hover:bg-accent focus:bg-accent focus:outline-none",
                      variant === "mobile" && "py-3"
                    )}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {result.item.label}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.parentLabel 
                          ? `${result.sectionLabel} → ${result.parentLabel}`
                          : result.sectionLabel
                        }
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Sem resultados */}
      {isOpen && query.trim() && filteredResults.length === 0 && (
        <div className={cn(
          "absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4",
          variant === "mobile" && "mt-2"
        )}>
          <p className="text-sm text-muted-foreground text-center">
            Nenhum item encontrado para "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
