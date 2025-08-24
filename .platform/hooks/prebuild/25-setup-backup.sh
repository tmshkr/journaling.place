#!/bin/bash

set -eox pipefail

# Setup backup cron job.
if [[ -f /etc/cron.d/backup ]]; then
    echo "Backup cron job already exists, skipping creation."
else
    echo "Creating backup cron job..."
    echo "0 5 * * * root cd $APP_DIR && ./scripts/backup.sh" | tee /etc/cron.d/backup
    chmod 644 /etc/cron.d/backup
    systemctl restart cron
    systemctl daemon-reload
    echo "Backup cron job created."
fi
