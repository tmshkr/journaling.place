#!/bin/bash
set -e

cp -R .next/static .next/standalone/apps/web/.next/static
cp -R public .next/standalone/apps/web/public