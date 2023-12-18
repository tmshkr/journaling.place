#!/bin/bash -e

echo "Enabling EBS encryption by default in all regions"
for region in $(aws ec2 describe-regions --region us-east-1 --query "Regions[*].[RegionName]" --output text); do
  default=$(aws ec2 enable-ebs-encryption-by-default --region $region --query "{Encryption_By_Default:EbsEncryptionByDefault}" --output text)
  kms_key=$(aws ec2 get-ebs-default-kms-key-id --region $region | jq '.KmsKeyId')
  echo "$region  --- $default  --- $kms_key"
done
