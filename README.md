# C/SIDE git

This is a VS Code extension, that will help Dynamics NAV consultatns that develop modifications in C/SIDE development environment to keep source control simple. 

## Features

Currently this extension provides fallowing commands:
- **Create new project** - Allows you to create new project file in specified location. This command only creates a configuration file template and does not initialize the environment.
- **Initialize remote with local dev** - Initializes a git repository based on the local development environment contents. Creates a bare git repo in the *remoteRepository* location, clones the repo to *localSourcesDirectory*, exports all objects from develoment environment to *localSourcesDirectory* and commits the changes locally. 
- **Initialize environment** - Initializes local development environment using objects stored in *remoteRepository*. First it clones the *remoteRepository* to *localSourcesDirectory* and then imports and compiles the objects in local development environment. 
- **Update local repository** - Updates the local repository with objects from local development environemnt that are marked as Modified. It exports the objects to *localSourcesDirectory*.
- **Update local development environment** - Updates the local development environment using the files stored in *localSourcesDirectory*. It imports and compiles all the files stored in *localSourcesDirectory*.
- **Update remote repository** - Pushes changes committed locally to the remote repository.
- **Update local repository with remote** - Pulls the changes from remote repository to the local repository stored in *localSourcesDirectory*.

Misc:
- Create terminal - Creates cside-git terminal. You can recreate the cside-git terminal if it had to be closed for some reason.
- Load NAV modules - If the environment type is set to Local you can load nav commandlets to cside-git terminal manually.


#### Sample scenarios
In order to create a new project and initialize the remote repository with the contents of the local development environment database you should run the fallowing commands:
*Prerequisites* - *You should have a NAV database with the objects that your modifications will be based on in your preferred development environment (local or container)*
1. Create new project
2. Initialize remote with local dev
3. Update remote repository

In order to setup local development environment so that you can work on a project you should do the fallowing:
*Prerequisites* - *You should have a remote repository populated with objects that modifications will be based on*
1. Create new project
2. Initialize environment

If you have your project created and initialized, you should use the *Update...* commands.

## Requirements

The extension currenly works only on Windows and depends on local Dynamics NAV installation.

<!-- ## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something -->

## Known Issues

No issues are known...

## Release Notes

### 1.0.1
Add container hosted development environment support.

<!-- ### 1.0.0

Initial release of ... -->

