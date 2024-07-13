# Linting your JS Code

In order to keep our codebase maintainable and consistent, we decided to use a Linter to enforce some rules and show warnings or errors to developers to let them know what code style is expected in our applications. As of today, its use is optional, but we intend to make it mandatory in the future for any commits going into the framework. As we just recently implemented it, there are still a lot of linting errors thrown, so until we go through all of them, we will not make it a requirement.

We decided to use [ESLint](http://eslint.org/) as our main linter to enforce coding guidelines and allow the code base to use more consistent code styling.

All the main rules are set in our [eslintrc][eslintrc] config file. If you want a better understanding of what each line means, we recommend you to checkout the [ESLint][eslint] documentation.

### How to see my errors?

It is convenient to see errors as you code, without the need to compile anything. Some code editors have modules allowing you to see errors as you type.

##### SublimeText 3
In order to see linting errors for monster in SublimeText 3, you'll have to install the SublimeLinter Package and the SublimeLinter-contrib-eslint packages.

Make sure to follow the specific instructions for each package as some node dependencies might be needed (for example, the eslint package is required to allow the sublimelinter-contrib-eslint to work properly).

Once those packages are installed properly, restart Sublime, and then you should be able to see errors as soon as you open a file from Monster.

This is what it looks like in the code:
![Image showing error in Sublime](http://i.imgur.com/0cfAmLK.png)

And to see the detailled error, you just need to go on that line, and sublime will show you the verbose log at the bottom of the editor:
![Image showing the details of the Linting error](http://i.imgur.com/dktSgRT.png)

For more information about Sublime Packages, check out: https://packagecontrol.io/docs/usage.

If you use another code editor and have a way to see linting errors in it, please let us know how to configure it so we can add it to this documentation (rr even better, submit a pull-request to that document)!

### Gulp Linting Task
If for some reason you don't want to edit the code to see the errors, you can run the `gulp lint` task we created.

This will show you all the linting errors in the project.

If you wanted to see errors of your application only or a specific part of the project, you could go into the [task config file][gulpconfig] and change the `pathToLint` variable to only look at your apps.

For example you could replace `var pathToLint = [paths.src + '/**/*.js', '!'+ paths.src + '/js/vendor/**/*.js', '!'+ paths.src + '/js/lib/kazoo/dependencies/**/*.js'];` by `var pathToLint = [paths.src + '/apps/debug/submodules/presence/**/*.js'];` to see all errors into the presence submodule of the debug application.

The expected output will be something like:
![Image showing the details of the gulp lint task](http://i.imgur.com/0nFtAF9.png)

[eslintrc]: ../src/.eslintrc.yml
[eslint]: http://eslint.org/
[gulpconfig]: ../gulp/tasks/javascript.js
