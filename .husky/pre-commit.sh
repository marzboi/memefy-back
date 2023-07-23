#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

branch="$(git symbolic-ref --short -q HEAD)"

if [[ "$branch" = "main" || "$branch" = "master" ]]; then
  RED='\033[0;31m'
  echo "${RED}Can't commit because you are the master/main branch"
  NC='\033[0m'
  echo "${NC}You can't commit directly to main branch, please commit from other branch"
  exit 1
fi
