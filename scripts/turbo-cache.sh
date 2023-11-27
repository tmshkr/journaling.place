#! /bin/bash -e

delete_turbo_cache() {
  for folder in apps/*/.turbo; do
    echo "Deleting turbo cache for $folder..."
  done
}

get_turbo_cache() {
  for folder in apps/*/.turbo; do
    echo "Getting turbo cache for $folder..."
  done
}

command=$1
case "$command" in
"delete")
  delete_turbo_cache
  ;;
"get")
  get_turbo_cache
  ;;
*)
  echo "Usage: $0 <command>"
  exit 1
  ;;
esac
