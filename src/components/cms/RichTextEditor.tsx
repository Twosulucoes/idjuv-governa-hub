/**
 * RICH TEXT EDITOR - CMS
 * Editor de texto formatado com preview em tempo real
 */

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  Code,
  Minus,
  Type
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onInsertImage?: () => void;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite o conteúdo aqui...",
  onInsertImage,
  className,
  minHeight = "300px"
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const insertTag = useCallback((tagStart: string, tagEnd: string = tagStart) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newText = `${beforeText}${tagStart}${selectedText}${tagEnd}${afterText}`;
    onChange(newText);

    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + tagStart.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const insertBlockTag = useCallback((tagStart: string, tagEnd: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const selectedText = value.substring(textarea.selectionStart, textarea.selectionEnd);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(textarea.selectionEnd);

    // Adiciona quebra de linha se não estiver no início
    const prefix = beforeText.length > 0 && !beforeText.endsWith("\n") ? "\n" : "";
    const suffix = afterText.length > 0 && !afterText.startsWith("\n") ? "\n" : "";

    const newText = `${beforeText}${prefix}${tagStart}${selectedText}${tagEnd}${suffix}${afterText}`;
    onChange(newText);
  }, [value, onChange]);

  const handleInsertLink = () => {
    if (linkUrl) {
      const textarea = textareaRef.current;
      const text = linkText || linkUrl;
      const markdown = `[${text}](${linkUrl})`;
      
      if (textarea) {
        const start = textarea.selectionStart;
        const beforeText = value.substring(0, start);
        const afterText = value.substring(textarea.selectionEnd);
        onChange(`${beforeText}${markdown}${afterText}`);
      } else {
        onChange(value + markdown);
      }
      
      setLinkUrl("");
      setLinkText("");
      setLinkPopoverOpen(false);
    }
  };

  // Converter markdown para HTML para preview
  const convertToHtml = (markdown: string): string => {
    let html = markdown
      // Headings
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Underline
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">$1</blockquote>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr class="my-6 border-border" />')
      // Unordered list
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Ordered list
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n/g, '<br />');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li.*<\/li>)(<br \/>)?(<li)/g, '$1$3');
    html = html.replace(/(<li[^>]*>.*?<\/li>)/g, '<ul class="list-disc my-2">$1</ul>');

    return html;
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Formatação de texto */}
          <Toggle
            size="sm"
            onPressedChange={() => insertTag("**")}
            title="Negrito (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => insertTag("*")}
            title="Itálico (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => insertTag("<u>", "</u>")}
            title="Sublinhado"
          >
            <Underline className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <Toggle
            size="sm"
            onPressedChange={() => insertBlockTag("# ")}
            title="Título 1"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => insertBlockTag("## ")}
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => insertBlockTag("### ")}
            title="Título 3"
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Listas */}
          <Toggle
            size="sm"
            onPressedChange={() => insertBlockTag("- ")}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => insertBlockTag("1. ")}
            title="Lista Numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => insertBlockTag("> ")}
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Link */}
          <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <Toggle size="sm" title="Inserir Link">
                <Link className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto do link (opcional)</Label>
                  <Input
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Clique aqui"
                  />
                </div>
                <Button size="sm" onClick={handleInsertLink} className="w-full">
                  Inserir Link
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Imagem */}
          {onInsertImage && (
            <Toggle size="sm" onPressedChange={onInsertImage} title="Inserir Imagem">
              <Image className="h-4 w-4" />
            </Toggle>
          )}

          <Toggle
            size="sm"
            onPressedChange={() => insertTag("`")}
            title="Código"
          >
            <Code className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            onPressedChange={() => insertBlockTag("---")}
            title="Linha Horizontal"
          >
            <Minus className="h-4 w-4" />
          </Toggle>

          <div className="flex-1" />

          {/* Preview Toggle */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs gap-1 h-7 px-2">
                <Type className="h-3 w-3" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs gap-1 h-7 px-2">
                <Eye className="h-3 w-3" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ minHeight }}>
        {activeTab === "edit" ? (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ minHeight }}
          />
        ) : (
          <div
            className="p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: convertToHtml(value) }}
          />
        )}
      </div>
    </div>
  );
}
