#!/bin/bash
set -e
source .env

if [ ! $IP_ADDRESS ]; then
  IP_ADDRESS=$(curl -s https://checkip.amazonaws.com)
fi

if [ ! $METHOD ]; then
  METHOD="POST"
fi

echo "IP Address: $IP_ADDRESS"
echo "Method: $METHOD"

curl --user "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" --digest \
	   --header "Content-Type: application/json" \
     --header "Accept: application/vnd.atlas.2023-02-01+json" \
     --include \
     --request $METHOD "https://cloud.mongodb.com/api/atlas/v2/groups/$ATLAS_GROUP_ID/accessList" \
     --data "[{ \"ipAddress\": \"$IP_ADDRESS\" }]"