#!/bin/bash -e

alias get-config="/opt/elasticbeanstalk/bin/get-config"

environment_name=$(get-config container | jq -r '.environment_name')
echo "EB_ENVIRONMENT_NAME=$environment_name" >>.env

get-config environment | jq -r '. | to_entries[] | "\(.key)=\(.value)"' | while read line; do
  echo $line >>.env
done

CNAME=$(aws elasticbeanstalk describe-environments --environment-names $environment_name --no-include-deleted | jq -r '.Environments[0].CNAME')

if [ "$CNAME" == *production* ]; then
  echo "STAGE=production" >>.env
elif [ "$CNAME" == *staging* ]; then
  echo "STAGE=staging" >>.env
else
  echo "There was an error determining the environment stage"
  exit 1
fi
