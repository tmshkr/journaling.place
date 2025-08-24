#!/bin/bash

set -eox pipefail

metadata_vars=(
    "DEPLOY_KEY"
    "GITHUB_REPOSITORY"
    "GITHUB_SHA"
    "GITHUB_ACTOR"
)

for var in "${metadata_vars[@]}"; do
    eval "$var=$(curl -s -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/attributes/$var)"
    if [[ -z "$(eval echo \$$var)" ]]; then
        echo "$var not found in metadata."
        exit 1
    fi
done

# Setup GitHub deploy key.
if [[ -f /etc/ssh/deploy_key ]]; then
    echo "Deploy key already exists, skipping creation."
else
    echo "Creating deploy key..."
    mkdir -p /etc/ssh
    echo "${DEPLOY_KEY}" | base64 -d >/etc/ssh/deploy_key
    chmod 600 /etc/ssh/deploy_key
fi

mkdir -p /srv/${GITHUB_REPOSITORY}
cd /srv/${GITHUB_REPOSITORY}

# Clone the GitHub repository.
echo "Cloning repository..."
export GIT_SSH_COMMAND="ssh -i /etc/ssh/deploy_key -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
git init
git config core.sshCommand "ssh -i /etc/ssh/deploy_key"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"
git config user.name "${GITHUB_ACTOR}"
echo "Cloning ${GITHUB_REPOSITORY} at ${GITHUB_SHA}"
git remote add origin git@github.com:${GITHUB_REPOSITORY}.git || true
git fetch origin ${GITHUB_SHA}
git checkout -b deploy_${GITHUB_SHA} ${GITHUB_SHA}

./scripts/terraform/startup.sh
