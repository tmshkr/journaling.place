#!/bin/bash

set -eo pipefail

before=$(echo $GH_EVENT | jq -r '.before')
after=$(echo $GH_EVENT | jq -r '.after')
ref_name="${GITHUB_REF_NAME//\//_}"

if [[ "$before" == "null" || "$after" == "null" ]]; then
    if images=$(aws ecr describe-images --repository-name "${GITHUB_REPOSITORY#*/}" --image-ids imageTag=$ref_name 2>&1); then
        tags=$(echo $images | jq -r '.imageDetails[0].imageTags[]')

        for tag in $tags; do
            if [[ $tag == "$ref_name-"* ]]; then
                before="${tag#"$ref_name-"}"
                after=$GITHUB_SHA
                break
            fi
        done
    else
        if [[ "$images" == *"ImageNotFoundException"* ]]; then
            echo "No images found with tag $ref_name."
            exit 0
        else
            echo "There was an error while trying to describe images."
            echo $images
            exit 1
        fi
    fi
fi

changes=$(gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    /repos/$GITHUB_REPOSITORY/compare/$before...$after)
changed_files=$(echo $changes | jq -r '.files[].filename')

if [[ -z "$changed_files" ]]; then
    echo "No files have changed between $before and $after."
    echo "Attempting to tag the existing image with the new tag."
    CURRENT_TAG=$before NEW_TAG=$after scripts/tag-image.js
else
    echo "Files that have changed between $before and $after:"
    for file in $changed_files; do
        echo "$file"
    done
fi
