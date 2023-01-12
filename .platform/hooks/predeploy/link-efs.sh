#!/bin/bash
set -e

# get environment
ENVIRONMENT=$(cat ENVIRONMENT)

ln -sf /efs/$ENVIRONMENT ./efs