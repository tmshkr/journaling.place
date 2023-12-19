#!/bin/bash -e

aws cloudformation deploy \
  --stack-name beanstalk-iam \
  --template-file beanstalk-iam.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides SubjectClaimFilters="repo:tmshkr/journaling.place:*"

aws cloudformation deploy \
  --stack-name s3-buckets \
  --template-file s3-buckets.yml
