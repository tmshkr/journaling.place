#! /bin/bash -e

echo "Stopping test server..."

ssh -o StrictHostKeychecking=no -i $HOME/.ssh/id_rsa -p $SSH_PORT $SSH_USER@$SSH_HOSTNAME docker compose -f /home/runner/work/journaling.place/journaling.place/docker-compose.test.yml down
