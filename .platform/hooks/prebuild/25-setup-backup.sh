#!/bin/bash

set -eox pipefail

# Setup backup cron job.
if [[ -f /etc/cron.d/backup ]]; then
    echo "Backup cron job already exists, skipping creation."
else
    echo "Creating backup cron job..."
    echo "0 6 * * * root cd /var/app/current && ./scripts/backup.sh" >/etc/cron.d/backup
    chmod 644 /etc/cron.d/backup
    echo "Backup cron job created."
fi
