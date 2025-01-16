#!/bin/bash

if [ ! -d $MONSTER_ROOT ]; then
    echo Cloning kazoo into $MONSTER_ROOT
    git clone https://github.com/2600hz/monster-ui $MONSTER_ROOT
fi

if [ -z $BASE_BRANCH ]; then
    BASE_BRANCH="origin/master"
fi

if [[ $BASE_BRANCH != "origin/master" ]]; then
    CORE_IDENTITY=`curl https://api.github.com/repos/2600hz/monster-ui/git/refs/tags | grep "refs" | sed 's|[^0-9\.]||g' | sort --version-sort | grep "${BASE_BRANCH#origin/}" | tail -1`
else
    CORE_IDENTITY='master'
fi

cd $MONSTER_ROOT

if [ ! -d ${APP_PATH} ]; then
    cp -R ${APP_DIR} ${MONSTER_ROOT}/${APP_PATH}
    if [ ! -z ${CIRCLE_REPOSITORY_URL} ]; then
        echo adding submodule to ${MONSTER_ROOT}
        git submodule add -f ${CIRCLE_REPOSITORY_URL} ${APP_PATH}
    elif [ ! -z ${APP_VCS_URL} ]; then
        echo adding submodule from ${APP_VCS_URL} to ${MONSTER_ROOT}
        git submodule add -f ${APP_VCS_URL} ${APP_PATH}
    else
        echo no CI repo url and no APP_VCS_URL defined unable to make submodule in${MONSTER_ROOT}
        die
    fi
fi

echo resetting monster-ui-core to $CORE_IDENTITY
git fetch --prune
git checkout $CORE_IDENTITY

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
