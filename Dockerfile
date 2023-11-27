FROM node:21-alpine as base
RUN apk add git
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base as deps
COPY package*.json ./
COPY apps apps/
COPY packages packages/
RUN find packages \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf
RUN find apps \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci omit=optional

FROM base as builder
COPY --from=deps /app/node_modules ./node_modules
COPY ./ ./
COPY ./.turbo ./.turbo
RUN ls -al .turbo || true
RUN sed -i '/generator erd/,/}/d' ./prisma/schema.prisma
RUN npx prisma generate

ARG CDN_PREFIX

RUN npm run jest
RUN npm run build
RUN sh scripts/prune-modules.sh

FROM base as runner
COPY --from=builder /app ./