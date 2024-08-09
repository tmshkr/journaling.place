#!/bin/bash

set -e

before=$(echo $GH_EVENT | jq -r '.before')
after=$(echo $GH_EVENT | jq -r '.after')

if [[ "$ANY_CHANGED" == "false" ]]; then
    echo "No files have changed between $before and $after."
    echo "Attempting to tag the existing image with the new tag."
    CURRENT_TAG=$before NEW_TAG=$after scripts/tag-image.js
else
    echo "Files that have changed between $before and $after:"
    for file in ${ALL_CHANGED_FILES}; do
        echo "$file"
    done
fi
