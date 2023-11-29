#!/bin/bash
set -e

if [ -z "$ENVIRONMENT" ]; then
  ENVIRONMENT=staging
fi

# Retrieve parameters from AWS SSM
aws ssm get-parameters-by-path --path "/journaling.place/$ENVIRONMENT/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --output text | while read -r name value; do
  echo "$(echo $name | sed "s/\/journaling.place\/$ENVIRONMENT\///")=$value" >>.env
  echo "::add-mask::$value"
done

cat .env
