#!/bin/bash -e

source .env

# Retrieve parameters from AWS SSM
aws ssm get-parameters-by-path --path "/journaling.place/$STAGE/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --output text | while read -r name value; do
  key=$(echo $name | sed "s/\/journaling.place\/$STAGE\///")
  echo "$key=$value" >>.env
done
