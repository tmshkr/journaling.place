#!/bin/bash

set -e

if [[ "$GITHUB_EVENT_NAME" == "pull_request" ]]; then
    base_sha=$(echo $GH_EVENT | jq -r '.pull_request.base.head.sha')
    head_sha=$(echo $GH_EVENT | jq -r '.pull_request.head.sha')
else
    commits=$(git rev-list -n 2 HEAD)
    read -r head_sha base_sha <<<$commits
fi

if [ "$ANY_CHANGED" == "false" ]; then
    echo "No files have changed between $base_sha and $head_sha."
    echo "Attempting to tag the existing image with the new tag."
    CURRENT_TAG=$base_sha NEW_TAG=$head_sha scripts/tag-image.js
fi
