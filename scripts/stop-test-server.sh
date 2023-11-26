#! /bin/bash -e

source scripts/setup-ssh-client.sh

echo "Stopping test server..."

ssh -F $HOME/.ssh/config $SSH_HOSTNAME docker compose -f /home/runner/work/journaling.place/journaling.place/docker-compose.test.yml down
