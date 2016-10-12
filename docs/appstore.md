## Adding your application to the App Store
The Monster-UI Framework has been built to allow developers to code their own apps and to allow them to reach their users via the Monster-UI.

There are 2 ways to add your applications inside the database. 

### Automatic way with a Kazoo Command
Assuming you've installed your Monster applications to `/path/to/monster-ui/apps`, you can run the following SUP command on the server:

    sup crossbar_maintenance init_apps '/path/to/monster-ui/apps' 'http://your.api.server:8000/v2'

This will load the apps (and let you know which apps it couldn't automatically load) into the master account (including icons, if present). For any apps that failed to be loaded automatically, you can follow the manual instructions below.

If you want to install a single Monster application:

    sup crossbar_maintenance init_app '/path/to/monster-ui/apps/{APP}' 'http://your.api.server:8000/v2'

### Manual way by adding a document to the database
In order to add your application manually, you have to add a document in the Master Account database. So first, go in your master account database. At the top-right of the page, there is a dropdown listing the different views of this database, click and select the apps_store, crossbar_listing view in the dropdown. This will list all the current apps of your app store. In a fresh install, this should be empty! If not, make sure you didn't create that document already... :)

Now click on "New Document", and we'll create that document.

(If you're adding an app that already exists, like accounts, voip, numbers, you can get all the metadata needed to create these files in their own `metadata` folder)


	{
   	   "name": "appName",
   	   "api_url": "http://yourServer/apiUrl",
   	   "i18n": {
       	   "en-US": {
           	   "label": "Friendly App Name",
           	   "description": "Description that will be displayed in the App Store.",
           	   "extended_description": "More things to write about the app",
           	   "features": [
               	   "Great thing #1 about your app",
               	   "Great thing #2 about your app"
           	   ]
       	   }
   	   },
   	   "tags": [
       	   "reseller",
       	   "carrier"
   	   ],
   	   "author": "The Overlord",
   	   "version": "1.0",
   	   "license": "-",
   	   "price": 0,
   	   "icon": "nameOfIcon.png",
   	   "screenshots": [
  			"nameOfImage1.png",
  			"nameOfImage2.png"
   	   ],
	   "pvt_type": "app"
	}

So let's go through those different attributes:
* `name`: define the name of your app in there. It needs to match the name of the folder of your app,
* `api_url`: define the URL of the Kazoo API to request,
* `source_url`: this defines where the Monster-UI framework will try to get the sources of your app. For now this needs to be hosted on the same server as the Monster-UI,
* `i18n`: In this, you can define the descriptions and features of your app in different languages, to try to reach as many users as possible. The language displayed in the app store will depend on the active setting of the user himself,
* `tags`: There is currently 3 different tags in the Monster-UI: `reseller, carrier, developer`. You can define all of them if you want your app to be listed in all those sections,
* `author`: Well.. that would be your name,
* `version`: This is only a label but can help you keep track of the different versions of your application,
* `license`: You can specify the license here,
* `price`: This is only a text for now, we plan to be able to charge for certain applications, but it hasn't been implemented yet, so you should leave this value to 0,
* `icon`: This is the name of an image for the Icon of your app, we'll be able to upload this image once this document is created via Futon,
* `screenshots`: This is an array of image names that will be shown in the slideshow of your app page.

So if you copy and paste the block of JSON above, and create a document with it, you should then be able to see the new app in the App Store, and should get a popup like this one when you click on the App in the App Store:

![Image showing details of app](http://i.imgur.com/4DZxZRR.png)

Now the last thing to do would be to actually upload the different images and icon you want to use. If you go in Couch, in the document you just created, you should have the option to Upload an attachment

![Image showing upload attachment link](http://i.imgur.com/ZKGPoMu.png)

Now you only need to upload your images, make sure that the names match whatever you typed in the app document. Once it's done, it will magically appear in the Monster-UI app store.

Congratulations, you just added an application to the app store! Please let us know if you have any issue with the process, or if you feel like this documentation could be better in any way!
