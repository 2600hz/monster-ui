## Monster-UI
Welcome to the Monster-UI, the web interface built by 2600hz to play with [Kazoo](http://github.com/2600hz/kazoo). The project was released on October 6th 2014 and will get a lot of attention in the upcoming months.

#### Installing Monster-UI
Just git clone the repo and once it's done, update the `js/config.js` file to use the right API URLs.

#### Adding applications to Monster-UI
The only other thing needed for Monster-UI to work is to add the other applications. 

Currently we moved all the App Store applications in their own github repo. Forking this monster-ui project will just give you access to the main framework, with no apps included. 

In order to add the application files to your project, find the different repos under [our github](http://github.com/2600hz) that begin with monster-ui-***, and copy those folders in the `/apps/` folder of the monster-ui repo. For example, to add the Accounts Manager once you installed monster-ui:

```
  # go in the monster-ui repo
  cd /var/html/www/monster-ui
  # go in the apps folder
  cd apps
  # copy the code of the monster-ui-accounts project and rename it accounts
  git clone https://github.com/2600hz/monster-ui-accounts.git accounts
```

Note: the name of the folder is important, it needs to match the `name` field of the app document that we'll talk about later.

Now that you have all the files of the Accounts Manager in the Monster-UI, you need to add the app to the App Store. To do that, check the appstore.md help file of the `docs` folder.

If you followed the docs normally, you should now be able to go in the App Store and enable the accounts app, which will load the Accounts Manager. 

#### Need more help?
Check the `docs` folder which includes a lot of files that are here to help developers understanding our Monster-UI framework. Those docs are a work in progress, so please send us pull-requests with updates to the documentation that you think would make it better.

You can also contact us via the [dev mailing list](https://groups.google.com/forum/?fromgroups#!forum/2600hz-dev) or on IRC at #2600hz on FreeNode. 


