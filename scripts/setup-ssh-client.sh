#! /bin/bash -e

echo "Setting up SSH client..."

ssh_config="
Host $SSH_HOSTNAME
  HostName $SSH_HOSTNAME
  User $SSH_USER
  Port $SSH_PORT
  IdentityFile $HOME/.ssh/id_rsa
  StrictHostKeyChecking no
"

mkdir -m 600 $HOME/.ssh
echo "$SSH_CLIENT_PUBLIC_KEY" >>$HOME/.ssh/id_rsa.pub
echo "$SSH_CLIENT_PRIVATE_KEY" >>$HOME/.ssh/id_rsa
echo "$ssh_config" >>$HOME/.ssh/config
chmod 600 $HOME/.ssh/*
