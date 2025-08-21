#!/bin/bash

set -eo xtrace

get_config() {
    /opt/elasticbeanstalk/bin/get-config "$@"
}

environment_name=$(get_config container | jq -r '.environment_name')
echo "EB_ENVIRONMENT_NAME=$environment_name" >>.env

get_config environment | jq -r '. | to_entries[] | "\(.key)=\(.value)"' | while read line; do
    echo $line >>.env
done

CNAME=$(aws elasticbeanstalk describe-environments --environment-names $environment_name --no-include-deleted | jq -r '.Environments[0].CNAME')
echo "CNAME=$CNAME" >>.env
if [[ "$CNAME" == *production* ]]; then
    echo "STAGE=production" >>.env
elif [[ "$CNAME" == *staging* ]]; then
    echo "STAGE=staging" >>.env
else
    echo "There was an error determining the environment stage"
    exit 1
fi

cat deploy-vars.json | jq -r '. | to_entries[] | "\(.key)=\(.value)"' | while read line; do
    echo $line >>.env
done

source .env
# Retrieve parameters from AWS SSM
repo="${GITHUB_REPOSITORY#*/}"
aws ssm get-parameters-by-path --path "/$repo/$STAGE/" \
    --recursive --with-decryption --query "Parameters[*].[Name,Value]" \
    --output text | while read -r name value; do
    key=$(echo $name | sed "s/\/$repo\/$STAGE\///")
    echo "$key=$value" >>.env
done

aws ssm get-parameter --name "/$repo/ORIGIN_CERT" \
    --with-decryption --query "Parameter.Value" --output text >./cf-cert.pem

aws ssm get-parameter --name "/$repo/ORIGIN_KEY" \
    --with-decryption --query "Parameter.Value" --output text >./cf-key.pem
