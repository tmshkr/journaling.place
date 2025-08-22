#!/bin/bash -e

source .env

if [[ -z "$CONFIG_BUCKET_NAME" ]]; then
  echo "Error: CONFIG_BUCKET_NAME is not set"
  exit 1
fi

if [ ! command -v mount-s3 &> /dev/null ]; then
  MP_RPM=$(mktemp --suffix=.rpm)
  curl https://s3.amazonaws.com/mountpoint-s3-release/latest/arm64/mount-s3.rpm > $MP_RPM
  yum install -y $MP_RPM
  rm $MP_RPM
fi

MNT_PATH=/mnt/s3/$CONFIG_BUCKET_NAME
echo "MNT_PATH=$MNT_PATH" >> .env

if ! grep -q "s3://$CONFIG_BUCKET_NAME/" /etc/fstab; then
  echo "s3://$CONFIG_BUCKET_NAME/ ${MNT_PATH} mount-s3 _netdev,nosuid,nodev,rw,allow-other,nofail" >> /etc/fstab
  mkdir -p $MNT_PATH
  systemctl daemon-reload
  mount -a
fi


