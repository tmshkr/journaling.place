#!/bin/bash
set -e

curl --user "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" --digest \
      --header "Content-Type: application/json" \
      --header "Accept: application/vnd.atlas.2023-02-01+json" \
      --include \
      --request POST "https://cloud.mongodb.com/api/atlas/v2/groups/$ATLAS_GROUP_ID/accessList" \
      --data "[{ \"ipAddress\": \"$IP_ADDRESS\" }]"