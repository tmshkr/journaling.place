#!/bin/bash
set -e

echo "Logging into Docker..."
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 983436253905.dkr.ecr.us-west-2.amazonaws.com