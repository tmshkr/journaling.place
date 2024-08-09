#!/bin/bash -e
echo $GH_EVENT
if [[$GITHUB_EVENT_NAME == "pull_request"]]; then
    echo "TODO: Implement logic for pull requests."
    exit 0
else
    commits=$(git rev-list -n 2 HEAD)
    read -r curr prev <<<$commits
fi

if [ "$ANY_CHANGED" == "false" ]; then
    echo "No files have changed between $prev and $curr."
    echo "Attempting to tag the existing image with the new tag."
    CURRENT_TAG=$prev NEW_TAG=$curr scripts/tag-image.js
fi
