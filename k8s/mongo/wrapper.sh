#!/bin/bash

set -e

required_vars=(
	"MONGO_INITDB_ROOT_USERNAME"
	"MONGO_INITDB_ROOT_PASSWORD"
	"MONGO_KEYFILE"
)
for var in "${required_vars[@]}"; do
	if [ -z "${!var}" ]; then
		echo "Error: Environment variable '$var' is not set."
		exit 1
	fi
done

# Create the keyfile with appropriate permissions
echo "Creating MongoDB keyfile..."
mkdir -p /tmp
echo "${MONGO_KEYFILE}" >/tmp/keyfile
chmod 400 /tmp/keyfile
chown mongodb:mongodb /tmp/keyfile
echo "MongoDB keyfile created."

echo "Starting MongoDB..."

exec /usr/local/bin/docker-entrypoint.sh "$@"
