#! /bin/bash -e

docker compose -f $GITHUB_WORKSPACE/docker-compose.test.yml down
