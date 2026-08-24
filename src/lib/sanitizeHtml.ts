import DOMPurify from "dompurify";

/**
 * Sanitiza HTML de conteúdo editorial (notícias, CMS) antes de renderizar via
 * `dangerouslySetInnerHTML`. Usar sempre que o HTML vier do banco/editor —
 * nunca renderizar direto, mesmo que o conteúdo já tenha passado por
 * conversão de markdown.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s",
      "h1", "h2", "h3", "h4",
      "ul", "ol", "li",
      "a", "img", "figure", "figcaption",
      "blockquote", "code", "pre", "span", "div",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel", "title"],
    ALLOW_DATA_ATTR: false,
  });
}
