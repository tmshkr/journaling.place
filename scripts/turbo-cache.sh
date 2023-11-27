#! /bin/bash -e

command=$1
case "$command" in
"delete")
  echo "Deleting turbo caches from host machine..."
  echo "Deleting .turbo"
  rm -rf .turbo
  echo "Deleting node_modules/.cache"
  rm -rf node_modules/.cache
  for folder in apps/*/.turbo; do
    echo "Deleting turbo cache for $folder..."
    rm -rf $folder
  done
  ;;
"export")
  if [ "$IS_DOCKER" == true ]; then
    echo "Exporting .turbo"
    cp -vR .turbo export
  else
    docker run --rm -e IS_DOCKER=true -v ./export:/app/export app sh /app/scripts/turbo-cache.sh export
    echo "Deleting existing .turbo directory"
    rm -rvf .turbo
    echo "Copying exported .turbo directory to $(pwd)"
    cp -vR export/.turbo .
  fi
  ;;

*)
  echo "Usage: $0 <command>"
  exit 1
  ;;
esac
