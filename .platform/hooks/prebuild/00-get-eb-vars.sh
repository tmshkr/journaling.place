#!/bin/bash -e

/opt/elasticbeanstalk/bin/get-config environment | jq -r '. | to_entries[] | "\(.key)=\(.value)"' | while read line; do
  echo $line >>.env
done

source .env

echo "NEXTAUTH_URL=https://$DOMAIN_NAME" >>.env
