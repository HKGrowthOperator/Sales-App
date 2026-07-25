# Next.js Produktions-Build (hk-sales-cockpit) — für Coolify/Docker
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* werden von Coolify als Build-Args/Env injiziert (Client-Bundle)
#
# Speicherdeckel für den Build: Ohne Limit lässt V8 den Heap wachsen, bis der
# Kernel den Prozess abschießt — der Build bricht dann kommentarlos nach
# "Creating an optimized production build" mit Exit 255 ab. Mit Deckel räumt
# der Garbage Collector rechtzeitig auf, statt gegen die Wand zu laufen.
# Gemessen: der Build braucht knapp über 1,5 GB (1536 kippt, 2048 läuft).
# 2048 ist der kleinste Wert, der durchgeht — der Host braucht also
# mindestens ~2,5 GB freien Speicher bzw. Swap.
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm","run","start"]
