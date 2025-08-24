#!/bin/bash

docker compose up -d
systemctl show -p PartOf eb-docker-compose-log.service
systemctl daemon-reload
systemctl reset-failed
systemctl enable eb-docker-compose-log.service
systemctl show -p PartOf eb-docker-compose-log.service
systemctl is-active eb-docker-compose-log.service
systemctl start eb-docker-compose-log.service
tail -fn 100 /var/log/eb-docker/containers/eb-current-app/eb-stdouterr.log
