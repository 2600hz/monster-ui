# Monster UI

*These instructions will get you a copy of the project up and running on your local machine for development purposes. See the [Using Docker](#using-docker) section for notes on how to automate the following steps by running a script within a Docker container.*

* [Getting Started](#getting-started)
	- [Prerequisites](#prerequisites)
	- [Install](#install)
	- [Configure](#configure)
	- [Build](#build)
* [Using Docker](#using-docker)
* [Contributing](#contributing)
* [Authors](#authors)
* [License](#license)

## Getting Started

Learn how to set up Monster UI and hook it up to a Kazoo server.

> **Note:**
>
> To follow this guide, you will need a Kazoo server up and running; if you need the installation steps for Kazoo, head over to [the documentation](https://docs.2600hz.com/sysadmin/doc/intro/read_me_first/).

### Prerequisites

|  | minimum version required |
| :---: | :---: |
| [node](https://nodejs.org/en/download/) | 4.5.0 |
| [npm](https://docs.npmjs.com/getting-started/installing-node) | 3.10.6 |
| [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) | 3.9.1 |

### Install

Clone the official [Monster UI](https://github.com/2600hz/monster-ui) repository:

```shell
git clone https://github.com/2600hz/monster-ui.git
```

Go to the project's folder:

```shell
cd monster-ui
```

Install dependencies:

```shell
npm install
```

### Configure

In order for Monster UI to load the data from your server, we need to hook up your Kazoo server with it. To do so, open the `config.js` file and set the API URL as the value of the `default` property:

`src/js/config.js`

```javascript
{
  api: {
    // The default API URL defines what API is used to log in to your back-end
    default: 'http://my.server.url/' // could be formatted like http://api.server.net:8000/v2/
  }
}
```

> **Note:**
>
> Do not forget to add a trailing slash to the API URL or else none of the requests will go through.

### Build

#### For production

To build for a production environment:

```shell
gulp build-prod
```

The packaged version of Monster UI will be located in the `dist` folder.

#### For development

Use the `gulp` command to build for a development environment and launch a web server:

```shell
gulp
```

Access your development environment at `http://localhost:3000/`.

> **Note:**
>
> For more information on how to use the `gulp` command, head to the [dedicated documentation](docs/gulpCommand.md).

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

* [**Jean-Roch Maitre**](https://github.com/JRMaitre)
* [**Joris Tirado**](https://github.com/azefiel)

See also the list of [contributors](https://github.com/2600hz/monster-ui/graphs/contributors) who participate in this project.

## License

This project is licensed under the Mozilla Public License - see the [LICENSE](LICENSE) file for details.
