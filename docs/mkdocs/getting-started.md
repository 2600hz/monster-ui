# Getting Started

The JavaScript framework to leverage the power of [Kazoo](https://2600hz.org/).


*These instructions will get you a copy of the project up and running on your local machine for development purposes. See the [Using Docker](#using-docker) section for notes on how to automate the following steps by running a script within a Docker container*

### Prerequisites

* [node](https://nodejs.org/en/download/) >= 4.5.0
* [npm](https://docs.npmjs.com/getting-started/installing-node) >= 3.10.6
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) >= 3.9.1

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

*For more info on how the `gulp` command works, head to the [dedicated](/docs/gulpCommand.md) documentation*

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

## Contributing

1. [Fork it!](https://github.com/2600hz/monster-ui/fork)
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Authors

[2600Hz employees](https://github.com/orgs/2600hz/people) actively working on this project:

* [**Joris Tirado**](https://github.com/azefiel)

See also the list of [contributors](https://github.com/2600hz/monster-ui/graphs/contributors) who participate in this project.

## License

This project is licensed under the Mozilla Public License - see the [LICENSE](LICENSE) file for details.
