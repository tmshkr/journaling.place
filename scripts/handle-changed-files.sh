#!/bin/bash

set -eo pipefail

find-before-sha() {
    echo "Finding build_sha of image tagged with $1."
    if images=$(aws ecr describe-images --repository-name "${GITHUB_REPOSITORY#*/}" --image-ids imageTag=$1 2>&1); then
        tags=$(echo $images | jq -r '.imageDetails[0].imageTags[]')

        for tag in $tags; do
            if [[ $tag == "build_sha."* ]]; then
                before="${tag#"build_sha."}"
                break
            fi
        done
    else
        if [[ "$images" == *"ImageNotFoundException"* ]]; then
            echo "No images found with tag $1."
        else
            echo "There was an error while trying to describe images."
            echo $images
            exit 1
        fi
    fi
}

compare-shas() {
    if [[ -z "$1" || -z "$2" ]]; then
        echo "No SHAs provided."
        exit 1
    fi

    if [[ "$1" == "$2" ]]; then
        echo "The SHAs are the same."
        exit 0
    fi

    echo "Comparing $1 with $2."
    changes=$(gh api \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        /repos/$GITHUB_REPOSITORY/compare/$1...$2)
    changed_files=$(echo $changes | jq -r '.files[].filename')

    if [[ -z "$changed_files" ]]; then
        echo "No files have changed."
        echo "Attempting to tag the existing image with the new tag."
        CURRENT_TAG=$1 NEW_TAG=$2 scripts/tag-image.js
    else
        echo "Files that have changed:"
        for file in $changed_files; do
            echo "$file"
        done
    fi
}

echo "GITHUB_EVENT_NAME=$GITHUB_EVENT_NAME"

after=$GITHUB_SHA
find-before-sha "${GITHUB_REF_NAME//\//_}"

if [[ -z "$before" ]]; then
    find-before-sha "latest"
fi

if [[ -z "$before" ]]; then
    echo "No previous commit to compare."
    exit 0
fi

compare-shas $before $after
