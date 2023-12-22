#!/bin/bash -e

source .env

# Retrieve parameters from AWS SSM
aws ssm get-parameters-by-path --path "/journaling.place/$ENVIRONMENT/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --output text | while read -r name value; do
  key=$(echo $name | sed "s/\/journaling.place\/$ENVIRONMENT\///")
  echo "$key=$value" >>.env
done

if [ "$IS_PRODUCTION" != "true" ]; then
  echo "NEXTAUTH_URL=https://staging.journaling.place" >>.env
fi
