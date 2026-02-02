import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, Star, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getAllSearchableItems } from "@/config/navigation.config";
import { Badge } from "@/components/ui/badge";

const RECENT_PAGES_KEY = "admin-recent-pages";
const MAX_RECENT = 5;

interface AdminSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSearch({ open, onOpenChange }: AdminSearchProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [recentPages, setRecentPages] = useState<string[]>([]);

  const allItems = useMemo(() => getAllSearchableItems(), []);

  // Load recent pages
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_PAGES_KEY);
    if (saved) {
      setRecentPages(JSON.parse(saved));
    }
  }, []);

  // Add to recent pages
  const addToRecent = (href: string) => {
    const newRecent = [href, ...recentPages.filter((p) => p !== href)].slice(
      0,
      MAX_RECENT
    );
    setRecentPages(newRecent);
    localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(newRecent));
  };

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return [];

    const searchLower = search.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(searchLower) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(searchLower)) ||
        item.section.toLowerCase().includes(searchLower)
    );
  }, [search, allItems]);

  // Get recent items
  const recentItems = useMemo(() => {
    return recentPages
      .map((href) => allItems.find((item) => item.href === href))
      .filter(Boolean);
  }, [recentPages, allItems]);

  // Get favorites
  const favoriteIds = useMemo(() => {
    const saved = localStorage.getItem("admin-favorites");
    return saved ? JSON.parse(saved) : [];
  }, []);

  const favoriteItems = useMemo(() => {
    return allItems.filter((item) => favoriteIds.includes(item.id));
  }, [allItems, favoriteIds]);

  const handleSelect = (href: string) => {
    addToRecent(href);
    navigate(href);
    onOpenChange(false);
    setSearch("");
  };

  // Group filtered items by section
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.section]) {
        groups[item.section] = [];
      }
      groups[item.section].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar páginas..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
            <p>Nenhum resultado encontrado.</p>
            <p className="text-muted-foreground">
              Tente buscar por outra palavra-chave.
            </p>
          </div>
        </CommandEmpty>

        {/* Search Results */}
        {search.trim() ? (
          Object.entries(groupedItems).map(([section, items]) => (
            <CommandGroup key={section} heading={section}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        ) : (
          <>
            {/* Recent Pages */}
            {recentItems.length > 0 && (
              <CommandGroup heading="Acessos Recentes">
                {recentItems.map((item) => (
                  <CommandItem
                    key={`recent-${item!.id}`}
                    value={item!.href}
                    onSelect={() => handleSelect(item!.href)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item!.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item!.section}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {recentItems.length > 0 && favoriteItems.length > 0 && (
              <CommandSeparator />
            )}

            {/* Favorites */}
            {favoriteItems.length > 0 && (
              <CommandGroup heading="Favoritos">
                {favoriteItems.map((item) => (
                  <CommandItem
                    key={`fav-${item.id}`}
                    value={item.href}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.section}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {recentItems.length === 0 && favoriteItems.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                <p>Digite para buscar páginas</p>
                <p className="text-xs mt-1">
                  Use <kbd className="px-1 py-0.5 rounded bg-muted">Ctrl+K</kbd>{" "}
                  para abrir a busca
                </p>
              </div>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
