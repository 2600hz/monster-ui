title: Using Postman as a CRUD

# Using Postman as a CRUD

* [Install Postman](#install-postman)
* [Import our collection](#import-our-collection)
* [Configure your environment](#configure-your-environment)
* [Generate a token](#generate-a-token)

### Install Postman

Postman is available as native apps (with support for Mac OS 10.10+, Linux and Windows 7+), as well as through a Google Chrome app. Head over to their [website](https://www.getpostman.com/apps), select your preferred version and install it.

### Import our collection

You need to import our `2600Hz Kazoo APIs (OSS)` Postman collection to your local install of Postman.

1. First, copy this [collection link][collection] by right-clicking on it and select `Copy link`.

1. Open Postman and click on the `Import` button at the top left.

1. In the popup, click on the `Import From Link` tab and paste in the collection link.

1. Click the orange `Import` button and you will see the collection appear in the sidebar, on the left.

### Configure your environment

The last thing to do before you are able to make requests is to define `Global Variables` to automate the authentication process.

1. First, copy this [environment link][environment] by right-clicking on it and select `Copy link`.

1. In Postman, click the `Import` button at the top left, paste in the environment link in the `Import From Link` tab, and click `Import`.

1. In the dropdown at the top right, select your new `2600Hz Kazoo APIs (OSS)`environment.

1. Click on the eye icon next to the dropdown and select `Edit` for your newly added environment.

1. Define the first four variables as follow:
    - `base_url`: server URL where Kazoo is running (no trailing slash)
    - `username`: username to login to your account
    - `password`: password to login to your account
    - `account_name`: name of the account to login to

1. Once those variables are defined, just click the `Update` button at the bottom of the popup and close the subsequent popup.

### Generate a token

Now that you have imported the collection and set up your environment variables, you need to generate an authentication token. For you convenience, you will only need to generate this token once per session as it will be stored as an environment variable.

1. Click on the collection in the sidebar, then on the `user_auth` folder and select the `user_auth.create` endpoint to load it in the request builder.

1. To run the collection, you just have to click the `Send` button.
    1. If the request does not go through, it might be because your server is using a `Self-Signed SSL Certificate`. To fix this, turn off the `SSL certificate verification` toggle in Settings > General.

1. You can now play with the list of endpoints in the collection! If your token expires, you just have to run the `use_auth.create` endpoint again to generate a new one.


[collection]: https://github.com/2600hz/monster-ui/blob/master/docs/postman/2600hz_kazoo_apis_oss.postman_collection.json
[environment]: https://github.com/2600hz/monster-ui/blob/master/docs/postman/2600hz_kazoo_apis_oss.postman_environment.json
