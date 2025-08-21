#!/bin/bash

set -o xtrace
set -e

dnf update
dnf install git -y

source .env
repo="${GITHUB_REPOSITORY#*/}"

echo "Setting up git"

# Setup deploy key
aws ssm get-parameter --name "/$repo/DEPLOY_KEY" \
    --with-decryption --query "Parameter.Value" --output text >~/.ssh/id_ed25519

chmod 600 ~/.ssh/id_ed25519

ssh-keyscan -t rsa github.com >>~/.ssh/known_hosts
git config --global core.sshCommand "ssh -i ~/.ssh/id_ed25519"

app_dir=$(pwd)
temp_dir=$(mktemp -d)
echo "Creating temporary directory $temp_dir"
echo "Cloning $GITHUB_REPOSITORY at $GITHUB_SHA"
cd $temp_dir
git init
git remote add origin git@github.com:$GITHUB_REPOSITORY.git
git fetch origin $GITHUB_SHA
git checkout -b deploy_$GITHUB_SHA $GITHUB_SHA

echo "Copying files from $temp_dir to $app_dir"
cp -r $temp_dir/. $app_dir
cd $app_dir
