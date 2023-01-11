FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
COPY apps apps/
COPY packages packages/
RUN find packages \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf
RUN find apps \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf

FROM node:16-alpine
RUN apk add git
WORKDIR /app
# Copy files from the first build stage.
COPY --from=0 /app ./
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci

COPY ./ ./

RUN DISABLE_ERD=true npm run prisma:generate
RUN npm run build