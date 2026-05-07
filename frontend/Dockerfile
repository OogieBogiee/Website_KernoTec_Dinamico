FROM node:20-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Archivo package.json y package-lock.json si existe
COPY src/package*.json ./

# Instalar dependencias de producción
RUN npm install --production

# Copiar el código fuente de la aplicación
COPY src/ ./

# Exponer el puerto del frontend
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "app.js"]