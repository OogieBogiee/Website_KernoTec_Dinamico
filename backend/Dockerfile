# ============================================
# KernoTec CMS - Strapi Dockerfile FINAL
# ============================================

FROM node:20-alpine

# 1. Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    git

# 2. Configurar directorio de trabajo
WORKDIR /srv/app

# 3. Copiar solo archivos de dependencias para aprovechar el cache
COPY --chown=node:node package*.json ./

# 4. Configuración para evitar errores de red y certificados
RUN npm config set strict-ssl false

# 5. Instalar dependencias (esto crea los binarios necesarios)
RUN npm install

# 6. Copiar el resto del código fuente
COPY --chown=node:node . .

# 7. Variables de entorno para construcción y ejecución
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

# 8. Construir el panel de administración de Strapi
RUN npx strapi build

# 9. Exponer el puerto
EXPOSE 1337

# 10. Comando de inicio usando npx para garantizar que encuentre el ejecutable
CMD ["npx", "strapi", "start"]