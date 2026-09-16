import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { resolverMetadata, type TenantMetadata } from "./tenants/metadata";

/**
 * WHITE LABEL — FASE 1 (build e metadados)
 *
 * Nenhum literal de instituição vive neste arquivo. Título da aba, manifest do
 * PWA, cor do tema e ícones vêm de `tenants/<slug>/metadata.ts`, escolhido por
 * VITE_TENANT_SLUG. Ver docs/WHITE_LABEL.md §3.
 */

const DIR_TENANTS = path.resolve(__dirname, "./tenants");
const DIR_PUBLIC = path.resolve(__dirname, "./public");

/**
 * Copia os ícones do tenant ativo para `public/` com nomes canônicos.
 *
 * Por que copiar em vez de emitir por plugin: o `index.html`, o VitePWA e o
 * workbox esperam `/favicon.png`, `/apple-touch-icon.png` e `/pwa-*.png` em
 * `public/`. Copiar antes de tudo elimina qualquer disputa de ordem entre
 * plugins e faz dev e build se comportarem igual.
 *
 * Os destinos são gerados — estão no .gitignore. O original versionado é o de
 * `tenants/<slug>/assets/`.
 */
function sincronizarIcones(meta: TenantMetadata): void {
  const origem = path.join(DIR_TENANTS, meta.slug, "assets");
  const { favicon, faviconIco, appleTouchIcon, pwa192, pwa512 } = meta.icones;

  const copias: Array<[string | undefined, string]> = [
    [favicon, "favicon.png"],
    [faviconIco, "favicon.ico"],
    [appleTouchIcon, "apple-touch-icon.png"],
    [pwa192, "pwa-192x192.png"],
    [pwa512, "pwa-512x512.png"],
  ];

  fs.mkdirSync(DIR_PUBLIC, { recursive: true });

  for (const [arquivo, destino] of copias) {
    if (!arquivo) continue;
    const de = path.join(origem, arquivo);
    if (!fs.existsSync(de)) {
      // Falha alto: um ícone faltando vira aba sem identidade, que passa
      // despercebido em produção.
      throw new Error(
        `[tenant] Ícone ausente: ${path.relative(__dirname, de)}. ` +
          `Verifique tenants/${meta.slug}/assets/ e o bloco "icones" do metadata.ts.`
      );
    }
    fs.copyFileSync(de, path.join(DIR_PUBLIC, destino));
  }
}

/** Substitui os placeholders %TENANT_*% do index.html. */
function tenantHtml(meta: TenantMetadata): Plugin {
  const valores: Record<string, string> = {
    TENANT_LANG: meta.lang,
    TENANT_APP_NAME: meta.appName,
    TENANT_APP_SHORT_NAME: meta.appShortName,
    TENANT_APP_DESCRIPTION: meta.appDescription,
    TENANT_AUTHOR: meta.author,
    TENANT_THEME_COLOR: meta.themeColor,
  };

  const escapar = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  return {
    name: "tenant-html",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        let saida = html.replace(
          /%(TENANT_\w+)%/g,
          (original, chave: string) =>
            chave in valores ? escapar(valores[chave]) : original
        );

        // `twitter:site` só existe para quem tem perfil — sem isso, a tag
        // entraria vazia no HTML de todo cliente.
        if (meta.twitterSite) {
          saida = saida.replace(
            '<meta name="twitter:card"',
            `<meta name="twitter:site" content="${escapar(meta.twitterSite)}" />\n    <meta name="twitter:card"`
          );
        }
        return saida;
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const meta = resolverMetadata(env.VITE_TENANT_SLUG);

  sincronizarIcones(meta);

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      tenantHtml(meta),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.png", "favicon.ico", "apple-touch-icon.png"],
        manifest: {
          name: meta.appName,
          short_name: meta.appShortName,
          description: meta.appDescription,
          lang: meta.lang,
          theme_color: meta.themeColor,
          background_color: meta.backgroundColor,
          display: "standalone",
          orientation: "any",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
          navigateFallbackDenylist: [/^\/~oauth/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@tenants": path.resolve(__dirname, "./tenants"),
      },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "reactflow"],
    },
  };
});
