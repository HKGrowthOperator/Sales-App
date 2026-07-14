# Next.js Produktions-Build (hk-sales-cockpit) — für Coolify/Docker
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* werden von Coolify als Build-Args/Env injiziert (Client-Bundle)
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm","run","start"]
