#!/bin/bash -e

source .env

if [[ "$IS_PRODUCTION" == "true" ]]; then
  echo "Skipping ngrok setup for production environment"
  pkill ngrok || true
  exit 0
fi

if ! command -v "ngrok" >/dev/null 2>&1; then
  echo "Installing ngrok..."
  wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
  sudo tar xvzf ngrok-v3-stable-linux-amd64.tgz -C /usr/local/bin
  rm ngrok-v3-stable-linux-amd64.tgz
fi

NGROK_AUTHTOKEN=$(aws ssm get-parameter --name "/journaling.place/NGROK_AUTHTOKEN" --with-decryption --query "Parameter.Value")

ngrok http 80 --authtoken $NGROK_AUTHTOKEN --log "ngrok.log" >/dev/null &

NGROK_URL=$(curl -s --retry-all-errors --retry 10 http://localhost:4040/api/tunnels/command_line | jq -r '.public_url')

echo "NEXTAUTH_URL=$NGROK_URL" >>.env

aws ssm put-parameter --name "/journaling.place/NGROK_URL" --value "$NGROK_URL" --type "SecureString" --overwrite
