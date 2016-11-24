# Monster UI

*One Paragraph of project description goes here*

* [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installing](#installing)
    - [Configure](#configure)
    - [Build It](#build-it)
* [Deployment](#deployment)
* [Build System](#build-system)
    - [Synopsis](#synopsis)
    - [Description](#description)
    - [Options](#options)
* [Contributing](#contributing)
* [Versioning](#versioning)
* [Author](#author)
* [License](#license)

## Getting Started

*These instructions will get you a copy of the project up and running on your local machine for development purposes. See [Deployment](#deployment) for notes on how to realize the following steps with a Docker container*

### Prerequisites

* [node](https://nodejs.org/en/download/) v4.5.0 or superior
* [npm](https://docs.npmjs.com/getting-started/installing-node) v3.10.6 or superior
* [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) v3.9.1 or superior

### Installing

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

### Build It

*Simply demo how to get the UI up and running in a dev environment by running the `gulp` command and link to the Build section for more info*

*For nore info on how the `gulp` command works, head to the [Build System](#build-system) section*

## Deployment

*Add notes about how to deploy this using Docker*

## Build System

### Synopsis

*Show command signature with available options*

### Description

*Explain what task runner we user*

### Options

*List the different options available when building the project*

### Examples

*Show one example per command/option*

## Contributing

1. [Fork it!](https://github.com/2600hz/monster-ui/fork)
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Versioning

*What versioning process do we follow*

## Authors

List of [2600Hz employees](https://github.com/orgs/2600hz/people) actively working on this project:

* [**Jean-Roch Maitre**](https://github.com/JRMaitre)
* [**Joris Tirado**](https://github.com/azefiel)

See also the list of [contributors](https://github.com/2600hz/monster-ui/graphs/contributors) who participated in this project.

## License

This project is licensed under the Mozilla Public License - see the [LICENSE.md](LICENSE.md) file for details.
