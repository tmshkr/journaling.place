#! /bin/bash -e

echo "Setting up SSH Client"
echo "$SSH_HOST_PUBLIC_KEY" >>$HOME/.ssh/known_hosts
echo "$SSH_CLIENT_PUBLIC_KEY" >>$HOME/.ssh/id_rsa.pub
echo "$SSH_CLIENT_PRIVATE_KEY" >>$HOME/.ssh/id_rsa

ssh -i $HOME/.ssh/id_rsa $SSH_USER@$SSH_HOSTNAME -p $SSH_PORT \
  docker compose -f docker-compose.test.yml down
