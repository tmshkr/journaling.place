#!/bin/bash
set -e

/opt/elasticbeanstalk/bin/get-config environment | jq -r '. | to_entries[] | "\(.key)=\(.value)"' | while read line; do
  echo $line >>.env
done

source .env

# Retrieve parameters from AWS SSM
aws ssm get-parameters-by-path --path "/journaling.place/$ENVIRONMENT/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --output text | while read -r name value; do
  key=$(echo $name | sed "s/\/journaling.place\/$ENVIRONMENT\///")
  echo "$key=$value" >>.env
done

if [[ "$ENVIRONMENT" == "main" && "$IS_PRODUCTION" != "true" ]]; then
  printf "\n# pre-production vars from ssm\n\n" >>.env
  aws ssm get-parameters \
    --names "/journaling.place/staging/NEXTAUTH_URL" "/journaling.place/staging/SERVER_NAME" \
    --with-decryption --query "Parameters[*].[Name,Value]" \
    --output text | while read -r name value; do
    key=$(echo $name | sed "s/\/journaling.place\/staging\///")
    echo "$key=$value" >>.env
  done
fi
