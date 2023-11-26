#! /bin/bash

echo "Setting up SSH Client"
mkdir -m 600 $HOME/.ssh
# ssh-keyscan -p $SSH_PORT $SSH_HOSTNAME >>$HOME/.ssh/known_hosts
# ssh-keygen -Hf $HOME/.ssh/known_hosts
echo "$SSH_CLIENT_PUBLIC_KEY" >>$HOME/.ssh/id_rsa.pub
echo "$SSH_CLIENT_PRIVATE_KEY" >>$HOME/.ssh/id_rsa
chmod 600 $HOME/.ssh/*

echo "WORKSPACE=$WORKSPACE"
echo "GITHUB_WORKSPACE=$GITHUB_WORKSPACE"
echo "REMOTE_WORKSPACE=$REMOTE_WORKSPACE"

ssh -o StrictHostKeychecking=no -i $HOME/.ssh/id_rsa -p $SSH_PORT $SSH_USER@$SSH_HOSTNAME docker compose -f /home/runner/work/journaling.place/journaling.place/docker-compose.test.yml down

ls -al /etc/ssh
ls -al $HOME/.ssh
