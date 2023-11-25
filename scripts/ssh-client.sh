#! /bin/bash -e

echo "Setting up SSH Client"
mkdir -m 700 $HOME/.ssh
echo "$SSH_HOST_PUBLIC_KEY" >>$HOME/.ssh/known_hosts
echo "$SSH_CLIENT_PUBLIC_KEY" >>$HOME/.ssh/id_rsa.pub
echo "$SSH_CLIENT_PRIVATE_KEY" >>$HOME/.ssh/id_rsa

ssh -i $HOME/.ssh/id_rsa -p $SSH_PORT $SSH_USER@$SSH_HOSTNAME $1
