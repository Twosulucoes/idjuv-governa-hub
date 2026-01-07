import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminSearch } from "./AdminSearch";

export interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AdminHeader onOpenSearch={() => setSearchOpen(true)} />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {(title || description) && (
              <div className="mb-6">
                {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
            )}
            {children}
          </main>
        </SidebarInset>
      </div>
      <AdminSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
