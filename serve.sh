#!/bin/bash

if [[ "$1" != 'no-update' ]]; then
    pushd src/apps
    for app in ./*/; do
        pushd "$app"
        gu="$(git config --get remote.origin.url)"
        if [[ 'git@github.com:2600hz/monster-ui.git' != "$gu" ]]; then
            echo Pulling from "$gu"
            git pull
        fi
        popd
    done
    popd
fi

docker run --rm -it \
       --net=host \
       -v "$PWD":/var/www \
       node:carbon \
       /bin/bash -c 'npm install -g npm && npm install -g gulp && cd /var/www && npm install && gulp'
