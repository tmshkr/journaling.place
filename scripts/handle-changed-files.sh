#!/bin/bash -e

echo $GH_EVENT
echo "Any changed: $ANY_CHANGED"
for file in ${ALL_CHANGED_FILES}; do
    echo "$file was changed"
done
