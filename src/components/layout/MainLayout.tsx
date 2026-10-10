import { Header } from "./Header";
import { Footer } from "./Footer";
import { SkipLink } from "@/components/design-system";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <Header />
      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      <Footer />
    </div>
  );
}
