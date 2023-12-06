#!/bin/bash
set -e

ENVIRONMENT=$(/opt/elasticbeanstalk/bin/get-config environment -k ENVIRONMENT)

echo "ENVIRONMENT=$ENVIRONMENT" >>.env

# Retrieve parameters from AWS SSM
aws ssm get-parameters-by-path --path "/journaling.place/$ENVIRONMENT/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --output text | while read -r name value; do
  echo "$(echo $name | sed "s/\/journaling.place\/$ENVIRONMENT\///")=$value" >>.env
done
