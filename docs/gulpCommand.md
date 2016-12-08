# Gulp Command

`gulp` - Build Monster UI

* [Synopsis](#synopsis)
* [Description](#description)
* [Commands](#comamnds)
* [Options](#Options)

## Synopsis

```
gulp            [--pro=<name>]
gulp build-dev  [--pro=<name>]
gulp build-prod [--pro=<name>]
```

## Description

Start running tasks to build the project for a development or production environment, the output of which is located in the `/dist` folder.

## Commands

* `gulp`

    Compile SCSS to CSS, launch Web server ([browsersync](https://www.npmjs.com/package/browser-sync)) and serve project at `http://localhost:3000/`, include a CSS watcher that make changes immediate in the browser ([livereload](https://www.npmjs.com/package/gulp-livereload))
    UI reloads automatically on file save.

* `gulp build-dev`

  Only compile SCSS to CSS.

* `gulp build-pro`

  Compile SCSS to CSS, merge all templates in a single `templates.js` file, run require, minify `main.js` and `templates.js` and minify CSS files.

## Options

* `--pro=<name>`

  Some applications might have a pro version. If that is the case and you want to build it with the 'pro' assets, you need to set the `pro` option and specify the name of the application.
