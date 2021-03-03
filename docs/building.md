title: Build Commands

# Build Commands

Monster UI's build system is powered by `gulp`. It provides build management commands for applications as well as for the framework as a whole.

- [`lint`](#lintdev)
- [`build-dev`](#build-dev)
- [`serve-dev`](#serve-dev)
- [`build-app`](#build-app)
- [`build-prod`](#build-prod)
- [`serve-prod`](#serve-prod)

## `lint`

Runs `eslint` for framework (including every app), or for a specific app by specifying the `--app` option.

##### Synopsis

```shell
gulp lint [options]
```

##### Options

```shell
--app name        Pick app to lint by name
```

##### Examples

```shell
gulp lint
gulp lint --app voip
```

## `build-dev`

Moves all files under `/dist` and runs the following tasks:

- compile SCSS into CSS
- generate build config for the framework and each app

##### Synopsis

```shell
gulp build-dev [options]
```

##### Options

```shell
--pro name        Pick apps by name to build in pro version
--require file    Specify a polyfill config
```

##### Examples

```shell
gulp build-dev
gulp build-dev --pro operator
gulp build-dev --pro operator,callqueues
```

## `serve-dev`

Runs the `build-dev` command and serves `/dist` at `http://localhost:3000/`.

##### Synopsis

```shell
gulp [serve-dev] [options]
```

##### Options

```shell
--pro name        Pick apps by name to build in pro version
--require file    Specify a polyfill config
```

##### Examples

```shell
gulp
gulp --pro operator
gulp --pro operator,callqueues
gulp serve-dev
gulp serve-dev --pro operator
gulp serve-dev --pro operator,callqueues
```

## `build-app`

Runs a production build for a specific app, including the following tasks:

- compile SCSS into CSS
- compile templates into JS
- resolve modules dependencies
- minify JS/CSS
- generate build config

The output of the build is located at `/dist/apps/<name>`.

##### Synopsis

```shell
gulp build-app [options]
```

##### Options

```shell
--app name        Pick app to build by name
--pro             Build app with pro version by name
--require file    Specify a polyfill config
```

##### Examples

```shell
gulp build-app --app voip
gulp build-app --app voip --pro
```

## `build-prod`

Runs a production build for the framework, including the following tasks:

- compile SCSS into CSS
- compile templates into JS
- resolve modules dependencies
- minify JS/CSS
- generate build config

The output of the build is located at `/dist`.

##### Synopsis

```shell
gulp build-prod [options]
```

##### Options

```shell
--require file    Specify a polyfill config
```

##### Examples

```shell
gulp build-prod
```

## `serve-prod`

Runs the `build-prod` command and serves `/dist`  at `http://localhost:3000/`

##### Synopsis

```shell
gulp serve-prod [options]
```

##### Options

```shell
--require file    Specify a polyfill config
```

##### Examples

```shell
gulp serve-prod
```
