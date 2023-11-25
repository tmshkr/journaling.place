#! /bin/bash -e

BASE_URL=$(echo $NGROK_TUNNELS | jq -r '.[] | select(.name == "web") | .public_url')
mongo_url=$(echo $NGROK_TUNNELS | jq -r '.[] | select(.name == "mongo") | .public_url')

# parse tcp url
hostname=$(echo $mongo_url | cut -d'/' -f3 | cut -d':' -f1)
port=$(echo $mongo_url | cut -d':' -f3)
MONGO_URI="mongodb://$MONGO_USER:$MONGO_PASSWORD@$hostname:$port/jp-test?authSource=admin&tls=false&directConnection=true"

gh workflow run playwright-test.yaml \
  -f BASE_URL=$BASE_URL \
  -f MONGO_URI=$MONGO_URI \
  -f SSH_HOST_PUBLIC_KEY=$SSH_HOST_PUBLIC_KEY \
  --ref $GITHUB_REF_NAME

# Set Output
echo "BASE_URL=$BASE_URL" >>$GITHUB_OUTPUT
