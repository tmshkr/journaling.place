#!/bin/bash
set -e

# get environment
ENVIRONMENT=$(cat ENVIRONMENT)
SHA=$(cat SHA)

# Retrieve parameters from AWS SSM
aws ssm get-parameters-by-path --path "/journaling.place/$ENVIRONMENT/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --output text | while read -r name value; do
  echo "$(echo $name | sed "s/\/journaling.place\/$ENVIRONMENT\///")=$value" >> .env
done


echo "ENVIRONMENT=$ENVIRONMENT" >> .env
echo "SHA=$SHA" >> .env
echo "NEXT_PUBLIC_VERSION=$ENVIRONMENT-$SHA" >> .env