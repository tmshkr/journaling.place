#!/bin/bash -e

# echo $GITHUB_EVENT_NAME

commits=$(git rev-list -n 2 HEAD)
read -r curr prev <<<$commits

changed_files=$(git diff --name-only $prev $curr)
if [ -z "$changed_files" ]; then
    echo "No files have changed between $prev and $curr."
    echo "Attempting to tag the existing image with the new tag."
    CURRENT_TAG=$prev NEW_TAG=$curr scripts/tag-image.js
else
    echo "Changed files between $prev and $curr:"
    for file in $changed_files; do
        echo "$file"
    done
fi
