#! /bin/bash -e

echo "Setting up SSH Client"
mkdir -m 600 $HOME/.ssh
# ssh-keyscan -p $SSH_PORT $SSH_HOSTNAME >>$HOME/.ssh/known_hosts
# ssh-keygen -Hf $HOME/.ssh/known_hosts
echo "$SSH_CLIENT_PUBLIC_KEY" >>$HOME/.ssh/id_rsa.pub
echo "$SSH_CLIENT_PRIVATE_KEY" >>$HOME/.ssh/id_rsa
chmod 600 $HOME/.ssh/*

ssh -o StrictHostKeychecking=no -i $HOME/.ssh/id_rsa -p $SSH_PORT $SSH_USER@$SSH_HOSTNAME $1

cat /etc/ssh/known_hosts
