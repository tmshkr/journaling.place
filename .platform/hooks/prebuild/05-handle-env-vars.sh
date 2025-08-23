#!/bin/bash

set -eo xtrace

get_config() {
    /opt/elasticbeanstalk/bin/get-config "$@"
}

environment_name=$(get_config container | jq -r '.environment_name')
echo "EB_ENVIRONMENT_NAME=\"$environment_name\"" >.env

get_config environment | jq -r '. | to_entries[] | "\(.key)=\"\(.value)\""' | while read line; do
    echo $line >>.env
done

eb_env=$(aws elasticbeanstalk describe-environments --environment-names $environment_name --no-include-deleted)
CNAME=$(echo $eb_env | jq -r '.Environments[0].CNAME')
VERSION_LABEL=$(echo $eb_env | jq -r '.Environments[0].VersionLabel')

echo "CNAME=\"$CNAME\"" >>.env
echo "VERSION_LABEL=\"$VERSION_LABEL\"" >>.env

if [[ "$CNAME" == *production* ]]; then
    echo "STAGE=\"production\"" >>.env
elif [[ "$CNAME" == *staging* ]]; then
    echo "STAGE=\"staging\"" >>.env
else
    echo "There was an error determining the environment stage"
    exit 1
fi

source .env
# Retrieve parameters from AWS SSM
repo="${GITHUB_REPOSITORY#*/}"
aws ssm get-parameters-by-path --path "/$repo/$STAGE/" \
    --recursive --with-decryption --query "Parameters[*].[Name,Value]" \
    --output text | while read -r name value; do
    key=$(echo $name | sed "s/\/$repo\/$STAGE\///")
    echo "$key=\"$value\"" >>.env
done
