#!/bin/bash
set -e

source .env

# Retrieve parameters from AWS SSM
aws ssm get-parameters-by-path --path "/journaling.place/$ENVIRONMENT/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --output text | while read -r name value; do
  key=$(echo $name | sed "s/\/journaling.place\/$ENVIRONMENT\///")
  if cat .env | grep -q "$key"; then
    sed -i "s/$key=.*/$key=$value/" .env
  else
    echo "$key=$value" >>.env
  fi
done
