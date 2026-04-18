FROM node:20-alpine
WORKDIR /app

# Dépendances
COPY package.json ./
RUN npm install --production

# Code serveur
COPY server.js ./

# Frontend
COPY public/ ./public/

# Dossier base de données
RUN mkdir -p /data

ENV DB_PATH=/data
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
