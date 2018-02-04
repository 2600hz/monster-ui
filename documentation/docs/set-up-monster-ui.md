# Set Up Monster UI

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

## Next steps

* [Set Up Monster Apps](): Learn how to add Monster applications to your install.
