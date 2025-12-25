#!/bin/bash -e

source .env

required_vars=(
	MONGO_INITDB_ROOT_USERNAME
	MONGO_INITDB_ROOT_PASSWORD
	MONGO_KEYFILE
)

for var in "${required_vars[@]}"; do
	if [ -z "${!var}" ]; then
		echo "Error: Environment variable '$var' is not set."
		exit 1
	fi
	export $var
done

filename=$1
if [ -z "$filename" ]; then
	echo "Usage: $0 <filename>"
	exit 1
fi

if [ ! -f "$filename" ]; then
	echo "Error: File '$filename' does not exist."
	exit 1
fi

envsubst <"$filename" | kubectl apply -f -
