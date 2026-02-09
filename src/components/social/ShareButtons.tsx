/**
 * ShareButtons - Botões para compartilhar conteúdo nas redes sociais
 */

import { useState } from "react";
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Link, 
  Check,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: "inline" | "popover";
  size?: "sm" | "md" | "lg";
}

const WHATSAPP_ICON = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export function ShareButtons({ 
  url, 
  title, 
  description = "",
  className,
  variant = "inline",
  size = "md"
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const buttonSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  const ShareButtonsContent = () => (
    <div className={cn("flex items-center gap-2", className)}>
      {/* WhatsApp */}
      <Button
        variant="outline"
        size="icon"
        className={cn(buttonSize, "text-[#25D366] hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-colors")}
        onClick={() => window.open(shareLinks.whatsapp, "_blank")}
        title="Compartilhar no WhatsApp"
      >
        <WHATSAPP_ICON />
      </Button>

      {/* Facebook */}
      <Button
        variant="outline"
        size="icon"
        className={cn(buttonSize, "text-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-colors")}
        onClick={() => window.open(shareLinks.facebook, "_blank")}
        title="Compartilhar no Facebook"
      >
        <Facebook className={iconSize} />
      </Button>

      {/* Twitter/X */}
      <Button
        variant="outline"
        size="icon"
        className={cn(buttonSize, "text-foreground hover:bg-foreground hover:text-background transition-colors")}
        onClick={() => window.open(shareLinks.twitter, "_blank")}
        title="Compartilhar no X (Twitter)"
      >
        <Twitter className={iconSize} />
      </Button>

      {/* LinkedIn */}
      <Button
        variant="outline"
        size="icon"
        className={cn(buttonSize, "text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-colors")}
        onClick={() => window.open(shareLinks.linkedin, "_blank")}
        title="Compartilhar no LinkedIn"
      >
        <Linkedin className={iconSize} />
      </Button>

      {/* Copiar Link */}
      <Button
        variant="outline"
        size="icon"
        className={cn(buttonSize, "transition-colors", copied && "text-green-500 border-green-500")}
        onClick={copyToClipboard}
        title="Copiar link"
      >
        {copied ? <Check className={iconSize} /> : <Link className={iconSize} />}
      </Button>
    </div>
  );

  if (variant === "popover") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className={buttonSize}>
            <Share2 className={iconSize} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="end">
          <p className="text-sm font-medium mb-2 text-muted-foreground">Compartilhar</p>
          <ShareButtonsContent />
        </PopoverContent>
      </Popover>
    );
  }

  return <ShareButtonsContent />;
}
