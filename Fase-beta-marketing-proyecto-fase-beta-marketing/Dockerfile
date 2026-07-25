# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir para producción
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine
# Copiar configuración custom de nginx para routing SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos generados en el paso de build
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto (Cloud Run suele escuchar en 8080 o lo que diga PORT)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
