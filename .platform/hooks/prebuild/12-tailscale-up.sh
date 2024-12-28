#!/bin/bash

set -eo xtrace

source .env

curl -fsSL https://tailscale.com/install.sh | sh
tailscale login --auth-key $TAILSCALE_KEY --hostname $EB_ENVIRONMENT_NAME
tailscale up
