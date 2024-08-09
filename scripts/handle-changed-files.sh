#!/bin/bash

set -eo pipefail
echo "GITHUB_EVENT_NAME=$GITHUB_EVENT_NAME"
ref_name="${GITHUB_REF_NAME//\//_}"

if images=$(aws ecr describe-images --repository-name "${GITHUB_REPOSITORY#*/}" --image-ids imageTag=$ref_name 2>&1); then
    tags=$(echo $images | jq -r '.imageDetails[0].imageTags[]')

    for tag in $tags; do
        if [[ $tag == "$ref_name-"* ]]; then
            before="${tag#"$ref_name-"}"
            break
        fi
    done
else
    if [[ "$images" == *"ImageNotFoundException"* ]]; then
        echo "No images found with tag $ref_name."
    else
        echo "There was an error while trying to describe images."
        echo $images
        exit 1
    fi
fi

if [[ -z "$before" ]]; then
    echo "No previous commit to compare."
    exit 0
fi

echo "Comparing $before with $GITHUB_SHA."
changes=$(gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    /repos/$GITHUB_REPOSITORY/compare/$before...$GITHUB_SHA)
changed_files=$(echo $changes | jq -r '.files[].filename')

if [[ -z "$changed_files" ]]; then
    echo "No files have changed."
    echo "Attempting to tag the existing image with the new tag."
    CURRENT_TAG=$before NEW_TAG=$GITHUB_SHA scripts/tag-image.js
else
    echo "Files that have changed:"
    for file in $changed_files; do
        echo "$file"
    done
fi
