#!/bin/bash

set -e

required_vars=(
	"MONGO_URI"
	"S3_BACKUP_BUCKET"
	"STAGE"
)
for var in "${required_vars[@]}"; do
	if [ -z "${!var}" ]; then
		echo "Error: Environment variable '$var' is not set."
		exit 1
	fi
done

echo "Backing up MongoDB..."
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME=backup-$DATE.tar.gz
S3_KEY="s3://$S3_BACKUP_BUCKET/$STAGE/$FILENAME"

mkdir -p /backup
cd /backup
mongodump --uri "$MONGO_URI" --gzip --archive="$FILENAME"
echo "Mongo dump saved to $FILENAME"
ls -alh

aws s3 cp $FILENAME $S3_KEY
echo "$FILENAME uploaded to $S3_KEY"

echo "Job finished: $(date)"
