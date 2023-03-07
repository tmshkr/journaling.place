#!/bin/bash
set -e

ts=$(date +"%Y-%m-%dT%H:%M:%S%z")

aws s3 cp s3://journaling.place-cfg/production.env .env
docker compose up
zip $ts.zip dump.sql
aws s3 cp $ts.zip s3://jp-backups
rm dump.sql
rm $ts.zip