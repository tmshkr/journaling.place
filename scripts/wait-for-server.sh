#!/bin/bash
set -e

while ! curl --output /dev/null --silent --head --fail $1 -k; do
  printf '.'
  sleep 5
done