#!/bin/bash

set -eo pipefail

find_build_sha() {

    if images=$(aws ecr describe-images --repository-name "${GITHUB_REPOSITORY#*/}" --image-ids imageTag=$1 2>&1); then
        tags=$(echo $images | jq -r '.imageDetails[0].imageTags[]')

        for tag in $tags; do
            if [[ $tag == "build_sha."* ]]; then
                echo "${tag#"build_sha."}"
                return 0
            fi
        done
    else
        if [[ "$images" != *"ImageNotFoundException"* ]]; then
            echo "There was an error while trying to find the image."
            echo $images
            return 1
        fi
    fi
}

compare_shas() {
    if [[ -z "$1" || -z "$2" ]]; then
        echo "Both SHAs must be provided."
        return 1
    fi

    if [[ "$1" == "$2" ]]; then
        echo "The SHAs are the same."
        return 0
    fi

    echo "Checking https://github.com/$GITHUB_REPOSITORY/compare/$1...$2"
    changes=$(gh api \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        /repos/$GITHUB_REPOSITORY/compare/$1...$2)
    changed_files=$(echo $changes | jq -r '.files[].filename')

    if [[ -z "$changed_files" ]]; then
        echo "No files have changed."
        echo "Attempting to tag the existing image with the new tag."
        CURRENT_TAG=$1 NEW_TAGS="$2,$branch_name.$2" scripts/tag-image.js
        exit 0
    else
        echo "Files that have changed:"
        for file in $changed_files; do
            echo "$file"
        done
    fi
}

echo "GITHUB_EVENT_NAME=$GITHUB_EVENT_NAME"

branch_name="${GITHUB_REF_NAME//\//_}"
branch_sha=$(find_build_sha $branch_name)
latest_sha=$(find_build_sha "latest")

if [[ -z "$latest_sha" ]]; then
    echo "No image tagged with [latest] found."
else
    echo "Comparing [latest] with GITHUB_SHA."
    compare_shas $latest_sha $GITHUB_SHA
    if [[ "$branch_sha" == "$latest_sha" ]]; then
        echo "[latest] and [$branch_name] are even."
        exit 0
    fi
fi

if [[ -z "$branch_name" ]]; then
    echo "No image tagged with [$branch_name] found."
else
    echo "Comparing [$branch_name] with GITHUB_SHA."
    compare_shas $branch_sha $GITHUB_SHA
fi
