# backend/Dockerfile
FROM node:18

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

COPY prisma ./prisma
COPY prisma/schema.prisma ./prisma/schema.prisma

# Exposer le port
EXPOSE 3001

# Commande de démarrage
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]
