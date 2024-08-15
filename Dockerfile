FROM node:22-alpine AS base
RUN apk update
RUN apk add git curl bash
RUN apk add --no-cache libc6-compat 
WORKDIR /app

FROM base AS deps

#START npm deps
COPY apps/agenda-worker/package.json apps/agenda-worker/package.json
COPY apps/trpc-server/package.json apps/trpc-server/package.json
COPY apps/web/package.json apps/web/package.json
COPY package-lock.json package-lock.json
COPY package.json package.json
COPY packages/common/package.json packages/common/package.json
COPY packages/eslint-config-custom/package.json packages/eslint-config-custom/package.json
COPY packages/mailer/package.json packages/mailer/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
#END npm deps

RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci omit=optional

FROM base AS builder

COPY --from=deps /app/ ./
COPY ./ ./
RUN npx prisma generate

ARG CDN_PREFIX

RUN npm run jest
RUN npm run build
RUN ./scripts/copy-build-output.sh

FROM base AS runner
COPY --from=builder /app/build_output/ ./
