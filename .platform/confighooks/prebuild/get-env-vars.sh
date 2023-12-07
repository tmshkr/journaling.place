#!/bin/bash
set -e

ENVIRONMENT=$(cat env.json | jq -r '.ENVIRONMENT')
IS_PRODUCTION=$(/opt/elasticbeanstalk/bin/get-config environment -k IS_PRODUCTION)

# Retrieve parameters from AWS SSM
aws ssm get-parameters-by-path --path "/journaling.place/$ENVIRONMENT/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --output text | while read -r name value; do
  key=$(echo $name | sed "s/\/journaling.place\/$ENVIRONMENT\///")
  echo "$key=$value" >>.env
done

if [ "$IS_PRODUCTION" != "true" ]; then
  # get pre-production vars from ssm
  aws ssm get-parameters \
    --names "/journaling.place/staging/NEXTAUTH_URL" "/journaling.place/staging/SERVER_NAME" \
    --with-decryption --query "Parameters[*].[Name,Value]" \
    --output text | while read -r name value; do
    key=$(echo $name | sed "s/\/journaling.place\/staging\///")
    echo "$key=$value" >>.env
  done
fi

echo "APP_VERSION=$(cat env.json | jq -r '.APP_VERSION')" >>.env
echo "ENVIRONMENT=$(cat env.json | jq -r '.ENVIRONMENT')" >>.env
echo "TAG=$(cat env.json | jq -r '.TAG')" >>.env
