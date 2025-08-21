#!/bin/bash -e

source .env

if [[ -z "$CONFIG_BUCKET_NAME" ]]; then
  echo "Error: CONFIG_BUCKET_NAME is not set"
  exit 1
fi

MP_RPM=$(mktemp --suffix=.rpm)
curl https://s3.amazonaws.com/mountpoint-s3-release/latest/arm64/mount-s3.rpm > $MP_RPM
yum install -y $MP_RPM
rm $MP_RPM

MNT_PATH=/mnt/s3/$CONFIG_BUCKET_NAME
echo "s3://$CONFIG_BUCKET_NAME/ ${MNT_PATH} mount-s3 _netdev,nosuid,nodev,rw,allow-other,nofail" >> /etc/fstab
mkdir -p $MNT_PATH

systemctl daemon-reload
mount -a
