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
    cp -R .turbo cache
  else
    docker run --rm -e IS_DOCKER=true -v ./cache:/app/cache app sh /app/scripts/turbo-cache.sh export
  fi
  ;;
"restore")
  if [ -d cache/.turbo ]; then
    echo "Restoring .turbo"
    rm -rf .turbo
    mv cache/.turbo .
  else
    echo "No .turbo cache found"
  fi

  ;;
*)
  echo "Usage: $0 <command>"
  exit 1
  ;;
esac
