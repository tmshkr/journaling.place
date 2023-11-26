#! /bin/bash -e

echo "Setting up SSH client..."
mkdir -m 600 $HOME/.ssh
echo "$SSH_CLIENT_PUBLIC_KEY" >>$HOME/.ssh/id_rsa.pub
echo "$SSH_CLIENT_PRIVATE_KEY" >>$HOME/.ssh/id_rsa
chmod 600 $HOME/.ssh/*
