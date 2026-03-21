# Usa o Node 24 (que você mencionou antes) para compilar o Angular
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci 
COPY . .
RUN npm run build --configuration=production

# Pega o resultado e coloca num servidor web super leve (Nginx)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/dashboard/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]