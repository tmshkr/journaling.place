#!/bin/bash
set -e

pg_dump -d "$DATABASE_URL" > ./pg-backup/dump.sql