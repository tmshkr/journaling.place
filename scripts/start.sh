#!/bin/bash
set -e

export DISABLE_ERD=true
npx prisma db push
npx prisma db seed

if [[ -e .env ]]; then
  echo "Loading environment variables from .env"
  env $(grep -v '^#' .env | xargs) turbo run start --parallel
else
  turbo run start --parallel
fi