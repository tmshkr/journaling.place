#!/bin/bash
set -eox pipefail

source .env

# From destination host, pull and pipe:
mongodump \
    --uri=$OLD_MONGO --authenticationDatabase admin \
    --archive --gzip |
    mongorestore \
        --uri=$NEW_MONGO --authenticationDatabase admin \
        --archive --gzip --stopOnError
