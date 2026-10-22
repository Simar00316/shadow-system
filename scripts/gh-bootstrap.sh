#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1  # Git Bash on Windows would rewrite "/dev/..." titles into paths
# Creates labels, milestones and issues from docs/backlog.md. Idempotent-ish: skips existing milestones/issues by title.
set -euo pipefail
REPO=${REPO:-Simar00316/shadow-system}
for l in bug feature enhancement research design frontend backend game-system testing blocked needs-owner full-ci; do
  gh label create "$l" -R "$REPO" --force >/dev/null
done
existing_issues=$(gh issue list -R "$REPO" --state all --limit 500 --json title --jq '.[].title')
ms=""
while IFS= read -r line; do
  if [[ $line == "## "* ]]; then
    ms=${line#\#\# }
    gh api "repos/$REPO/milestones" --jq '.[].title' | grep -qxF "$ms" || gh api "repos/$REPO/milestones" -f title="$ms" >/dev/null
  elif [[ $line == "- ["* && -n $ms ]]; then
    labels=$(sed -E 's/^- \[([^]]*)\].*/\1/' <<<"$line")
    title=$(sed -E 's/^- \[[^]]*\] //' <<<"$line")
    grep -qxF "$title" <<<"$existing_issues" && continue
    gh issue create -R "$REPO" -t "$title" -b "Milestone: $ms. Spec: PRD.md." -l "$labels" -m "$ms" >/dev/null
    echo "created: $title"
  fi
done < docs/backlog.md
