#!/bin/bash -e

if [[ -z "$PROFILE_1" || -z "$PROFILE_2" ]]; then
  echo "PROFILE_1 and PROFILE_2 must be set"
  exit 1
fi

echo "Copying SSM parameters..."

aws ssm get-parameters-by-path --path "/journaling.place/" --recursive --with-decryption --query "Parameters[*].[Name,Value]" --profile $PROFILE_1 --output text | while read -r name value; do
  echo "Copying $name"
  aws ssm put-parameter --name "$name" --value "$value" \
    --type "SecureString" --overwrite --profile $PROFILE_2
done
