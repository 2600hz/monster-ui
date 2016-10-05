#!/bin/bash

docker run --rm -it \
       --net=host \
       -v "$PWD":/var/www \
       node:4.6 \
       /bin/bash -c 'npm install -g npm && npm install -g gulp && cd /var/www && npm install && gulp'
