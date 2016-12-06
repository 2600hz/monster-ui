# Monster UI

*One Paragraph of project description goes here*

* [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Install](#install)
    - [Configure](#configure)
    - [Build](#build)
* [Using Docker](#using-docker)
* [Gulp Command](#gulp-command)
    - [Synopsis](#synopsis)
    - [Description](#description)
    - [Commands](#commands)
    - [Options](#options)
* [Contributing](#contributing)
* [Authors](#authors)
* [License](#license)

## Getting Started

*These instructions will get you a copy of the project up and running on your local machine for development purposes. See the [Using Docker](#using-docker) section for notes on how to automate the following steps by running a script within a Docker container*

### Prerequisites

* [node](https://nodejs.org/en/download/) v4.5.0 or higher
* [npm](https://docs.npmjs.com/getting-started/installing-node) v3.10.6 or higher
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) v3.9.1 or higher

### Install

Clone the official `monster-ui` repository:

```
git clone https://github.com/2600hz/monster-ui.git monster-ui
```

Go to the project's folder:

```
cd monster-ui
```

Install dependencies:

```
npm install
```

### Configure

In order for the UI to load the data from your server, we need to specify which API to use. For that, open the `config.js` file located in the `src/js/` folder and add the URL of your server as the value of the `default` property.

```javascript
define(function(require) {

  return {
    api: {
      // The default API URL defines what API is used to log in to your back-end
      default: 'http://my.server.url/' // could be formatted like http://api.server.net:8000/v2/

      ...
    },

    ...
  };
});
```

### Build

Use the `gulp` command to build and launch the web server

```
gulp
```

Access your development environment at `http://localhost:3000/`

*For more info on how the `gulp` command works, head to the [Gulp Command](#gulp-command) section*

## Using Docker

If you are using Docker containers, we made it easy for you to set up a development environment. You will just need to clone the `monster-ui` repository and add your API URL to the `config.js` file as explained in the [Install](#install) and [Configure](#configure) sections. After that, execute our custom `serve.sh` script (made by [**Pierre Fenoll**](https://github.com/fenollp)) in your Docker container:

```shell
./serve.sh
```

This script will install `npm` and `gulp`, as well as the `npm` dependencies and finally run the `gulp` command. You will be able to access the development environment at `http://localhost:3000/`.

## Gulp Command

### Synopsis

```
gulp            [--pro=<name>]
gulp build-dev  [--pro=<name>]
gulp build-prod [--pro=<name>]
```

### Description

*Explain what task runner we use*

### Commands

* `gulp`

  Launch a Web server, CSS changes are immediate, automatically reloads the page on save ([browsersync](https://www.npmjs.com/package/browser-sync) + [livereload](https://www.npmjs.com/package/gulp-livereload))

* `gulp build-dev`

  same as no options except that you need to launch your own Web server to serve the files

* `gulp build-pro`

  bundles files together

### Options

* `--pro=<name>`

  Some applications might have a pro version. If that is the case and you want to build it with the 'pro' assets, you need to set the `pro` option and specify the name of the application.

## Contributing

1. [Fork it!](https://github.com/2600hz/monster-ui/fork)
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Authors

[2600Hz employees](https://github.com/orgs/2600hz/people) actively working on this project:

* [**Jean-Roch Maitre**](https://github.com/JRMaitre)
* [**Joris Tirado**](https://github.com/azefiel)

See also the list of [contributors](https://github.com/2600hz/monster-ui/graphs/contributors) who participate in this project.

## License

This project is licensed under the Mozilla Public License - see the [LICENSE](LICENSE) file for details.
