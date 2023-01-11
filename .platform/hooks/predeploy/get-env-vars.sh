#!/bin/bash
set -e

# get environment
ENVIRONMENT=$(cat ENVIRONMENT)

# get staging or production environment variables
CONFIG_S3_BUCKET=$(/opt/elasticbeanstalk/bin/get-config environment -k CONFIG_S3_BUCKET)
aws s3 cp s3://$CONFIG_S3_BUCKET/$ENVIRONMENT.env .env