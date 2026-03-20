# ESTÁGIO 1: Build do Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Instala as dependências de forma limpa
RUN npm ci 
COPY . .
# Roda o comando de produção do Angular
RUN npm run build --configuration=production

# ESTÁGIO 2: Servidor Nginx
FROM nginx:alpine
# Copia o arquivo do Nginx que criamos no Passo 1
COPY nginx.conf /etc/nginx/conf.d/default.conf

# IMPORTANTE: Copia o build gerado. 
# Verifique se o seu projeto gera os arquivos na pasta 'dist/dashboard/browser' 
# ou apenas 'dist/dashboard'. Ajuste o caminho abaixo se necessário!
COPY --from=build /app/dist/dashboard/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]