#! /bin/bash -e

echo "Stopping test server..."

ssh -F $HOME/.ssh/config $SSH_HOSTNAME docker compose -f /home/runner/work/journaling.place/journaling.place/docker-compose.test.yml down

ls -la $HOME/.ssh
cat $HOME/.ssh/config
cat $HOME/.ssh/known_hosts
