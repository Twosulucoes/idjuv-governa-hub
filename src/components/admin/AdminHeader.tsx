import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Bell, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getBreadcrumbForPath } from "@/config/adminMenu";
import { UserMenu } from "@/components/auth/UserMenu";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { useEffect } from "react";

interface AdminHeaderProps {
  onOpenSearch: () => void;
}

export function AdminHeader({ onOpenSearch }: AdminHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const breadcrumbs = getBreadcrumbForPath(location.pathname);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/admin");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile menu trigger */}
      <SidebarTrigger className="md:hidden">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="h-8 w-8"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Breadcrumbs */}
      <div className="flex-1 overflow-hidden">
        <AdminBreadcrumbs items={breadcrumbs} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 text-muted-foreground"
          onClick={onOpenSearch}
        >
          <Search className="h-4 w-4" />
          <span>Buscar...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Mobile search */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSearch}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
