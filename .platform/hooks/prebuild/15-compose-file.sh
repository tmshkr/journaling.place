#!/bin/bash -e

source .env

if [ "$PREP" == "true" ]; then
  cp docker-compose.prep.yml docker-compose.yml
else
  cp docker-compose.run.yml docker-compose.yml
fi
