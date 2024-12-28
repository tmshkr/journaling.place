#! /bin/bash -e

# https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/copy-data-from-an-s3-bucket-to-another-account-and-region-by-using-the-aws-cli.html

dest_account_id=
dest_bucket_name=
dest_region=
src_bucket_name=
src_region=

CREDS=$(aws sts assume-role \
    --role-arn "arn:aws:iam::$dest_account_id:role/S3MigrationRole" \
    --role-session-name AWSCLI-Session)

export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDS | jq -r '.Credentials.SessionToken')

aws s3 sync s3://$src_bucket_name s3://$dest_bucket_name --source-region $src_region --region $dest_region
