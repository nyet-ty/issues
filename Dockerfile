FROM node:16-slim

RUN apt-get update
RUN apt-get install -y openssl

ENV HOME /app

WORKDIR ${HOME}

ENV DATABASE_URL=postgresql://prisma:hilly-sand-pit@0.0.0.0:5432/prisma?schema=prisma-pg-test

ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=ololo
ENV GITHUB_CLIENT_ID=Iv1.31291a6f627c9972
ENV GITHUB_CLIENT_SECRET=afb2db38e2199529d0c5139befa66a6cfba09caf

ENV ADMIN_EMAIL=admin@taskany.org
ENV ADMIN_PASSWORD=admin

COPY package*.json ./
COPY .npmrc ./

RUN npm ci

COPY . .

RUN npx prisma migrate dev --preview-feature
RUN npx prisma db seed

CMD ["npm", "run", "dev"]
