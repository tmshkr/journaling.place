#!/bin/bash -e

get_config() {
    /opt/elasticbeanstalk/bin/get-config "$@"
}

environment_name=$(get_config container | jq -r '.environment_name')
echo "EB_ENVIRONMENT_NAME=$environment_name" >.env

get_config environment | jq -r '. | to_entries[] | "\(.key)=\(.value)"' | while read line; do
    echo $line >>.env
done

echo "STAGE=production" >>.env

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

docker compose stop
docker compose up -d
systemctl show -p PartOf eb-docker-compose-log.service
systemctl daemon-reload
systemctl reset-failed
systemctl enable eb-docker-compose-log.service
systemctl show -p PartOf eb-docker-compose-log.service
systemctl is-active eb-docker-compose-log.service
systemctl start eb-docker-compose-log.service
