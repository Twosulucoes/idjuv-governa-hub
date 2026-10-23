# Imagem do front (SPA do Vite) publicada pelo Coolify. Um único Dockerfile para os dois apps:
#   sistema (app.idjuv.online)  MODO=sistema → npm run build      → dist/
#   site    (idjuv.online)      MODO=site    → npm run build:site → dist-site/ (sem o sistema interno)
# As variáveis VITE_* (valores públicos; a chave é a anon) entram como build args, cadastradas no app do
# Coolify como "Build Variable". Ver docs/DESENVOLVIMENTO.md (Deploy do front).

FROM node:20-alpine AS build
WORKDIR /app
ARG MODO=sistema
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_TENANT_SLUG
ARG VITE_APP_URL
ARG VITE_SITE_URL
# `npm ci` falha: o package-lock.json está fora de sincronia (ver AGENTS.md).
COPY package.json ./
RUN npm install --no-package-lock --no-audit --no-fund
COPY . .
RUN test -n "$VITE_SUPABASE_URL" || { echo "VITE_SUPABASE_URL não configurada no Coolify"; exit 1; }; \
    if [ "$MODO" = "site" ]; then \
      npm run build:site && node scripts/check-bundle-site.mjs dist-site && mv dist-site /saida; \
    else \
      npm run build && mv dist /saida; \
    fi

FROM nginx:1.27-alpine
COPY deploy/coolify/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/cabecalhos-seguranca.conf /etc/nginx/cabecalhos-seguranca.conf
# o connect-src da CSP segue o banco do build (produção, ambiente de teste ou outra instalação)
ARG VITE_SUPABASE_URL
RUN host="$(echo "$VITE_SUPABASE_URL" | sed -E 's#^https?://##; s#/.*$##')" && \
    test -n "$host" && sed -i "s#bd\.idjuv\.online#${host}#g" /etc/nginx/cabecalhos-seguranca.conf
COPY --from=build /saida /usr/share/nginx/html
EXPOSE 80
