Required Softwares:

- Node >= 4.5.0 (from their website)
- NPM >= 3.10.6 (npm install -g npm)
- GULP >= 3.9.1 (npm install -g gulp)

After cloning a fresh repo, you'll want to run

- npm install

which will initialize all the node dependencies for gulp

Once that's done, you can just run

- gulp

which will build the website, build the css files from scss files and serve it to a webbrowser.


Alternatively, try this Docker one liner:

```shell
docker run --rm \
  -p 8444:3000 -p 8443:3001 \
  -v "$PWD":/var/www \
  node:4.6 \
  /bin/bash -c 'npm install -g npm && npm install -g gulp && cd /var/www && npm install && gulp'
```



If you install all the separate apps via GIT as submodules in the /monster-ui/src/apps folder and then run `gulp build-prod`, all the apps code (JS/HTML/CSS) will be concatenated together and minified

Reach us at #2600hz for Feedback


Build Pro version


    gulp build-prod --pro=test1,test2,test3


Build Pro version app level


    gulp build-prod


with core only, then add the app repo to /apps and


    gulp-build-app --app=test1 --pro

