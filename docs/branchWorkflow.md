# Branch Workflow

In order for of our builds to run and packages to be published automatically, we follow a custom workflow when it comes to feature branch management. To better understand that workflow, let's run through an example.

## Create a Pull Request of `master`
All feature branches are based of `master` as it is the "base" branch for all repositories against which pull requests are made.

### Start with `master`
First and foremost, make sure your current branch is `master` and it is up-to-date.

```shell
~/monster-ui (master)$ git checkout master
~/monster-ui (master)$ git fetch origin
```

### Create your feature branch
You can then create your feature branch named after the issue ticket you are working on and checkout to it.

```shell
~/monster-ui (master)$ git checkout -b <TICKET-#>
```

### Commit your changes
Apply changes related to the feature you are working on.

```shell
~/monster-ui (<TICKET-#>)$ git add -p
~/monster-ui (<TICKET-#>)$ git status
~/monster-ui (<TICKET-#>)$ git commit
```
### Push your feature branch
Pushing your branch to the remote server serves as a backup and it can be pulled down by teammates in order to test the changes if needed:

```shell
~/monster-ui (<TICKET-#>)$ git push origin <TICKET-#>
```

### Create a pull request
Once your branch is on the remote server, you can create a pull request with `<TICKET-#>` as the head branch and `master` as the base branch.

The naming convention regarding pull request out of `master` is as follows:
```
<TICKET-#>: <Pull request title>
```

Don't forget to add reviewers to your pull request as at least one review is required before you can merge it.

## Create a Pull Request of `<latest>`
Now you need to create a branch based out of `<latest>` and cherry-pick the changes contained in `<TICKET-#>` into it.

At the time of writing, the `<latest>` branch is `5.0`.

### Start with `<latest>`
```shell
~/monster-ui (<TICKET-#>)$ git checkout -b <latest> origin/<latest>
~/monster-ui (<latest>)$ git pull
```

### Create your feature branch
```shell
~/monster-ui (<latest>)$ git checkout -b <TICKET-#>-<latest> <latest>
```

Notice how `<latest>` is appended to the branch name.

### Cherry-pick your changes
Log the commits in the `<TICKET-#>` branch and take note of the first and last SHA-1 hashes for the commits related to the work on that branch. Those references will be used to cherry-pick your changes into the `<TICKET-#>-<latest>` branch.

```shell
~/monster-ui (<TICKET-#>-<latest>)$ git cherry-pick <first-sha-1>^..<last-sha-1>
```

### Push your mirror feature branch
```shell
~/monster-ui (<TICKET-#>-<latest>)$ git push origin HEAD
```

### Create a pull request
Once your branch is on the remote server, you can create a pull request with `<TICKET-#>-<latest>` as the head branch and `<latest>` as the base branch.

The naming convention regarding pull request out of `<latest>` is as follows:
```
[<latest>] <TICKET-#>: <Pull request title>
```

You should add the same reviewers you added to this pull request than for the `<TICKET-#>` one.
