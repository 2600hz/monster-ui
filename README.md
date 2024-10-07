# [Monster UI](https://docs.2600hz.com/ui/) &middot; [![GitHub license](https://img.shields.io/badge/license-MPL%201.1-blue.svg)](LICENSE) [![CircleCI branch](https://img.shields.io/circleci/project/github/2600hz/monster-ui/master.svg)](https://circleci.com/gh/2600hz/monster-ui)

The JavaScript framework to leverage the power of [Kazoo](https://2600hz.org/).

Forked from https://github.com/2600hz/monster-ui.git and maintained by the community.

## Getting Started

*These instructions will get you a copy of the project up and running on your local machine for development purposes. See the [Using Docker](#using-docker) section for notes on how to automate the following steps by running a script within a Docker container*

### Prerequisites

* [node](https://nodejs.org/en/download/) >= 6.9.0
* [npm](https://docs.npmjs.com/getting-started/installing-node) >= 3.10.6
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) >= 4.0.0

### Install

Clone the kazoo-classic `monster-ui` repository:

```
git clone https://github.com/kazoo-classic/monster-ui.git monster-ui
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

In order for the UI to load the data from your server, we need to specify which API to use. To do so, open the `config.js` file located in `src/js/` folder and add the URL of your server as the value of the `default` property.

```javascript
define({
    api: {
    	'default': 'http://my.kazoo.server/'
    }
  }
});
```

*For a full list and comprehensive descriptions of all the configurable options, head over to the [dedicated documentation](https://docs.2600hz.com/ui/docs/configuration/)*.

### Build

Use the `gulp` command to build and launch the web server

```
gulp
```

Access your development environment at `http://localhost:3000/`

*For more info on how the `gulp` command works, head over to the [dedicated documentation](/docs/gulpCommand.md)*.

## Using Docker

If you are using Docker containers, we made it easy for you to set up a development environment. You will just need to clone the `monster-ui` repository and add your API URL to the `config.js` file as explained in the [Install](#install) and [Configure](#configure) sections. After that, execute our custom `serve.sh` script (made by [**Pierre Fenoll**](https://github.com/fenollp)) in your Docker container:

```shell
./serve.sh
```

This script will install `npm` and `gulp`, as well as the `npm` dependencies and finally run the `gulp` command. You will be able to access the development environment at `http://localhost:3000/`.

It also starts by pulling your apps installed in `src/apps` before starting the server. To disable this behavior use the `no-update` flag:

```shell
./serve.sh no-update
```

## Using Docker to Build Only

If you have docker installed, you can build monster-ui so it can then be copied to an nginx/httpd/other server or service of your choice.

```shell
./docker-build.sh
```

You can optionall add extra community written apps with
```shell
./docker-build.sh allapps
```
It will output to monster-ui-build/dist/

Note that this requires all monster apps to be present in kazoo-classic, and all stored as the master branch, which it currently does not, though we will work on this soon. You can instead change the $GITHUBREPO to your own desired repository.

## Documentation

You can find all the documentation related to Monster UI on the [dedicated website](https://docs.2600hz.com/monsterui/).

The documentation is stored on this repository (`/docs`) which allows you to easily improve it or add new pages when making PRs against the core of Monster UI.

## Contributing

1. [Fork it! (2600hz)](https://github.com/2600hz/monster-ui/fork) or [Fork it! (kazoo-classic)](https://github.com/kazoo-classic/monster-ui/fork)
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## License

This project is licensed under the Mozilla Public License - see the [LICENSE](LICENSE) file for details.
