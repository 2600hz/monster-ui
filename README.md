# [Monster UI](https://docs.2600hz.com/ui/) &middot; [![GitHub license](https://img.shields.io/badge/license-MPL%201.1-blue.svg)](LICENSE) [![CircleCI branch](https://img.shields.io/circleci/project/github/2600hz/monster-ui/master.svg)](https://circleci.com/gh/2600hz/monster-ui)

The JavaScript framework to leverage the power of [Kazoo](https://2600hz.org/).

## Getting Started

*These instructions will get you a copy of the project up and running on your local machine for development purposes. See the [Using Docker](#using-docker) section for notes on how to automate the following steps by running a script within a Docker container*

### Prerequisites

* [node](https://nodejs.org/en/download/) >= 12 & [npm](https://docs.npmjs.com/getting-started/installing-node)
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) >= 4.0.0

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

## Running the tests

### Selenium IDE tests

A [Selenium IDE][selenium-ide] test project may be included within each app directory, under a folder named `tests`.

To run the test cases contained in these project, you have two options: run it via the Selenium IDE browser extension, or via the command line runner.

#### Run tests via the Selenium IDE

For this option the Selenium IDE extension should be [installed][selenium-ide_install] in a supported web browser.

Upon launching the IDE you will be presented with a dialog where you can choose the option **Open an existing project**, to search and open the test project file in your computer.

Then you can [play the tests cases back in the IDE][selenium-ide_play] by selecting the test or suite you'd like to play and clicking the play button in the menu bar above the test editor. This will play the tests in a browser window.

#### Run tests via the command line runner

For this option you need to install the [Selenium IDE command-line runner][selenium-ide_cli], and the driver for the browser of your choice.

Once everything is installed, the tests can be run by calling `selenium-side-runner` from the command-line followed by the path to the project file.

```sh
$ selenium-side-runner path/to/testProject.side
```

## Documentation

You can find all the documentation related to Monster UI on the [dedicated website](https://docs.2600hz.com/ui/).

The documentation is stored on this repository (`/docs`) which allows you to easily improve it or add new pages when making PRs against the core of Monster UI.

## Contributing

1. [Fork it!](https://github.com/2600hz/monster-ui/fork)
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

This project is licensed under the Mozilla Public License - see the [LICENSE](LICENSE) file for details.

[selenium-ide]: https://www.seleniumhq.org/selenium-ide/
[selenium-ide_cli]: https://www.seleniumhq.org/selenium-ide/docs/en/introduction/command-line-runner/
[selenium-ide_install]: https://www.seleniumhq.org/selenium-ide/docs/en/introduction/getting-started/#installation
[selenium-ide_play]: https://www.seleniumhq.org/selenium-ide/docs/en/introduction/getting-started/#in-browser

