# Set Up Monster Apps

Learn how to add Monster apps to your install of Monster UI.

> **Note:**
>
> To follow this guide, you will need access to the database running on your Kazoo server; if you need the installation steps for Kazoo, head over to [the documentation](https://docs.2600hz.com/sysadmin/doc/intro/read_me_first/).
>
> You will also need an install of [Monster UI](https://github.com/2600hz/monster-ui) to add the Monster apps to. If you have not already, follow [this guide]() to learn how to properly install the UI framework.

### Install

To install Monster apps, head over to your Monster UI install, where you can see the list of applications installed in the `src/apps/` folder. When doing a fresh install of Monster UI, that folder will already contain the following built-in apps required for the UI to run properly:

* `apploader`
* `appstore`
* `auth`
* `common`
* `core`
* `myaccount`

When using `git`, you have two options to install Monster apps. Either as a sub-repository, or as a submodule.

#### As a sub-repository

`src/apps/`

```shell
git clone https://github.com/2600hz/monster-ui-<app_name>.git <app_name>
```

#### As a submodule

`src/apps/`

```shell
git submodule add -f https://github.com/2600hz/monster-ui-<app_name>.git <app_name>
```

### Publish

In order for your Kazoo install to know the list of apps that

In order for Monster apps to be returned by the Kazoo API, you need to publish it to the database. Assuming you have installed your apps at `path/to/monster-ui/src/apps/`, you can run this `sup` command on the server:

```shell
sup crossbar_maintenance init_apps 'path/to/monster-ui/src/apps/' 'http://your.api.server:8000/v2'
```

This will load the apps, and let you know which apps it could not automatically load into the master account, including icons if present.

> **Note:**
>
> If you have issues, or some apps fail to load, head over to [the dedicated documentation]() for other options on how to publish apps to the database.

### Build

#### For production

To build for a production environment:

```shell
gulp build-app --app=<app_name>
```

The packaged version of the Monster app will be located in the `dist/apps/<app_name>/` folder.

#### For development

Use the `gulp` command to build for a development environment and launch a web server:

```shell
gulp
```

Access your development environment at `http://localhost:3000/`.

> **Note:**
>
> For more information on how to use the `gulp` command, head over to the [dedicated documentation](docs/gulpCommand.md).
