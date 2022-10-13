#!/bin/bash -u
#
# Performs steps to clone all monster-ui application repositories accessible for a given user

if ! [ -x "$(command -v gh)" ]; then
    echo "gh is required to enumerate existing repositories." >&2
    echo "Installation instructions can be found at https://cli.github.com/" >&2
    exit 1
fi

readonly FILENAME_OF_REPOS="applications"
readonly REPO_SUFFIX="monster-ui-"
readonly MAX_LIMIT=1000
readonly REPONAME_PROP="name"

clone_repo() {
    echo "Clonning $reponame ..."

    local reponame="$1"
    gh repo clone 2600hz/"${reponame}" src/apps/"${reponame#"$REPO_SUFFIX"}" >/dev//null 2>&1

    echo "Done clonning $reponame"
}

main() {
    gh repo list 2600hz \
        --language javascript \
        --no-archived \
        --source \
        --limit $MAX_LIMIT \
        --json $REPONAME_PROP \
        --jq ".[] | select(.$REPONAME_PROP | test(\"^$REPO_SUFFIX.+\")) | .$REPONAME_PROP" \
        >$FILENAME_OF_REPOS

    while read -r reponame; do
        clone_repo "$reponame" &
    done <./$FILENAME_OF_REPOS
    wait
}

main
