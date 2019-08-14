#!/bin/bash

if [ ! -d $MONSTER_ROOT ]; then
    echo Cloning kazoo into $MONSTER_ROOT
    git clone https://github.com/2600hz/monster-ui $MONSTER_ROOT
fi

if [ -z $BASE_BRANCH ]; then
    BASE_BRANCH="origin/master"
fi

cd $MONSTER_ROOT

if [ ! -d ${APP_PATH} ]; then
	ln -s ${APP_DIR} ${MONSTER_ROOT}/${APP_PATH} 
fi

echo resetting kazoo to $BASE_BRANCH
git fetch --prune
git rebase $BASE_BRANCH

if [ ! -d $APP_PATH ]; then
    echo adding submodule to $MONSTER_ROOT
    git submodule add -f ${CIRCLE_REPOSITORY_URL} ${APP_PATH}
fi

cd $APP_PATH

echo checking out our commit $CIRCLE_BRANCH
git fetch --prune
git checkout -B $CIRCLE_BRANCH
git reset --hard $CIRCLE_SHA1

cd $MONSTER_ROOT

# wanted when committing
echo setup git config
git config user.email 'circleci@dev.null'
git config user.name 'CircleCI'

echo committing monster changes to avoid false positives later
git add .gitmodules $APP_PATH
git commit -m "add submodule"
