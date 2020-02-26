# [x-terminal](https://atom.io/packages/x-terminal)

This is a fork of [atom-xterm](https://github.com/amejia1/atom-xterm/)

## Updates

1. Updated dependencies
   - xterm v4 introduced new plugins
   - faster performance with webgl
2. Themes
   - Easily change terminal colors in settings
3. Font Family
   - Change font family in settings
4. PlatformIO IDE API
   - Works with packages that consume the `platformioIDETerminal` service

![X-Terminal demo](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-demo.gif)

## Built in Terminal for Atom Feature Request

If you're reading this and you would rather see Atom have a built-in terminal
by default, please go over to the built-in terminal feature request
[here](https://github.com/atom/atom/issues/14490), give it a thumbs up, **and**
give an explanation as to why you need a built-in terminal in Atom by default.

# Installation

Go to <https://atom.io/packages/x-terminal> and click Install, or search for
the *x-terminal* package via Atom's package manager. It can also be installed
via command-line with the [apm](https://github.com/atom/apm) command.

```sh
apm install x-terminal
```

## One time prerequisites

The *x-terminal* package requires
[node-pty](https://www.npmjs.com/package/node-pty). That package currently
requires building some native bindings on the local system using
[node-gyp](https://github.com/nodejs/node-gyp). Providing prebuilt binaries
is still [work in progress](https://github.com/Microsoft/node-pty/issues/46)
so for now, you'll need to install certain packages on your system before
installing *x-terminal*. Below are what you'll need to install only once before
installing *x-terminal*.

### Windows

Download and install [Node.js](https://nodejs.org/en/download/). It's recommended
to install the LTS version of Node.js.

Then, install the *windows-build-tools* package via npm.

```sh
npm install --global --production windows-build-tools
```

### Linux

#### Debian/Ubuntu based Linux distributions

Follow the instructions [here](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
to install Node.js. It's recommended to install the LTS version of Node.js.

Then install the *build-essential* and *python2.7* .deb packages.

```sh
sudo apt-get install build-essential python2.7
```

### macOS

Install Node.js using the instructions provided
[here](https://nodejs.org/en/download/package-manager/#macos). Then, install
the programs listed [here](https://github.com/nodejs/node-gyp#on-mac-os-x)

# Usage

## Opening Terminals

To open terminals, just open them through the menu.

![X-Terminal menu](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-menu.png)

There's also various key bindings you can use to open terminals. See the
available key bindings for the x-terminal package.

There's also menu items available for opening terminals via right clicking on a
text editor or on a terminal.

Finally, terminal tabs are automatically reopened at the spot you placed them
when you last exited Atom.

## Organizing Terminals

To quickly organize your terminal tabs, simply use the main menu. You can also
find menu items by right-clicking on a terminal to organize your terminals.

And of course, there's the old fashion way of just moving the tabs where you
want them. Feel free to place your terminal tabs anywhere in your workspace to
include any of the docks.

![X-Terminal moving terminals demo](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-moving-terminals-demo.gif)

## Profiles

The x-terminal package supports saving and loading profiles. What this allows
you to do is save commonly used commands and settings for later use.

![X-Terminal profiles demo](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-profiles-demo.gif)

## Notifications

The x-terminal package provides notifications about terminal process exit
successes and failures. Notifications will appear in Atom's own notification
manager as well as on the terminal tab triggering the notification.

Success

![X-Terminal exit success](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-exit-success.png)

Failure

![X-Terminal exit failure](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-exit-failure.png)

There's also activity notifications for terminal tabs not in focus.

![X-Terminal activity notification](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-activity-notification.gif)

## Services

For plugin writers, the `x-terminal` package supports two services, `atom-xterm` and `platformioIDETerminal`, which
can be used to easily open terminals. These methods are provided using Atom's [services](http://flight-manual.atom.io/behind-atom/sections/interacting-with-other-packages-via-services/)
API.

To use a service, add a consumer method to consume the service, or
rather a JavaScript object that provides methods to open terminals and run commands.

### 'atom-xterm' service v2.0.0

The `atom-xterm` service provides the
[openTerminal()](https://github.com/bus-stop/x-terminal/blob/2a7762b6d29abdc017af17c320b2e548cd14e4a9/src/x-terminal.js#L273) method. The `openTerminal()` method behaves just like Atom's
[open()](https://github.com/atom/atom/blob/917a00e195b93c8c2a9adc349fd8fa1844f61dbc/src/workspace.js#L1076)
method except that the first argument must be a JSON object describing the
terminal profile that should be opened. Docs about this JSON object can be
found [here](https://github.com/bus-stop/x-terminal/blob/2a7762b6d29abdc017af17c320b2e548cd14e4a9/src/profiles.js#L311).

As an example on how to use the provided `openTerminal()` method, your
`package.json` should have the following.

```json
{
  "consumedServices": {
    "atom-xterm": {
      "versions": {
        "^2.0.0": "consumeAtomXtermService"
      }
    }
  }
}
```

Your package's main module should then define a `consumeAtomXtermService`
method, for example.

```js
import { Disposable } from 'atom'

export default {
  atomXtermService: null,

  consumeAtomXtermService (atomXtermService) {
    this.atomXtermService = atomXtermService
    return new Disposable(() => {
      this.atomXtermService = null
    })
  },

  // . . .
}
```

Once the service is consumed, use the `openTerminal()` method that is provided
by the service, for example.

```js
// Launch `somecommand --foo --bar --baz` in a terminal.
this.atomXtermService.openTerminal({
  command: 'somecommand',
  args: [
    '--foo',
    '--bar',
    '--baz'
  ]
})
```

### 'platformioIDETerminal' service v1.1.0

The `platformioIDETerminal` service provides an [object](https://github.com/bus-stop/x-terminal/blob/2a7762b6d29abdc017af17c320b2e548cd14e4a9/src/x-terminal.js#L381) with `updateProcessEnv`, `run`, `getTerminalViews`, and `open` methods.

As an example on how to use the provided `run()` method, your
`package.json` should have the following.

```json
{
  "consumedServices": {
    "platformioIDETerminal": {
      "versions": {
        "^1.1.0": "consumePlatformioIDETerminalService"
      }
    }
  }
}
```

Your package's main module should then define a `consumePlatformioIDETerminalService`
method, for example.

```js
import { Disposable } from 'atom'

export default {
  platformioIDETerminalService: null,

  consumePlatformioIDETerminalService (platformioIDETerminalService) {
    this.platformioIDETerminalService = platformioIDETerminalService
    return new Disposable(() => {
      this.platformioIDETerminalService = null
    })
  },

  // . . .
}
```

Once the service is consumed, use the `run()` method that is provided
by the service, for example.

```js
// Launch `somecommand --foo --bar --baz` in a terminal.
this.platformioIDETerminalService.run([
   'somecommand --foo --bar --baz'
])
```

# Development

Want to help develop x-terminal? Here's how to quickly get setup.

First use the [apm](https://github.com/atom/apm) command to clone the
[x-terminal repo](https://github.com/bus-stop/x-terminal).

```sh
apm develop x-terminal
```

This should clone the x-terminal package into the `$HOME/github/x-terminal`
directory. Go into this directory and install its dependencies.

```sh
cd $HOME/github/x-terminal
npm install
```

Rebuild any native binaries that were installed (such as the binaries from the
[node-pty](https://github.com/Tyriar/node-pty) package) so that they can be
used inside Atom.

```sh
apm rebuild
```

Finally, open this directory in Atom's dev mode and hack away.

```sh
atom --dev
```

There's a test suite available for automated testing of the x-terminal package.
Simply go to `View > Developer > Run Package Specs` in Atom's main menu or
use the hotkey. You can run the full test suite (which includes running lint
tools) via command-line by running `npm run test` inside the x-terminal
directory.

Various lint tools are being used to keep the code "beautified". To run only
the lint tools, simply run `npm run lint`.

## Pull Requests

Whenever you're ready to submit a pull request, be sure to submit it
against a fork of the main [x-terminal repo](https://github.com/bus-stop/x-terminal)
master branch that you'll own. Fork the repo using Github and make note of the
new `git` URL. Set this new git URL as the URL for the `origin` remote in your
already cloned git repo is follows.

```sh
git remote set-url origin ${NEW_GIT_URL}
```

Ensure your new changes passes the test suite by running `npm run test`.
Afterwards, push your changes to your repo and then use Github to submit a new
pull request.

## [xterm.js](https://github.com/xtermjs/xterm.js)

The terminals that users interact with in this package is made possible with
major help from the [xterm.js](https://github.com/xtermjs/xterm.js) library. As
such, often times it's necessary to make changes to xterm.js in order to fix
some bug or implement new features.

If you want to work on xterm.js for the benefit of a bug fix or feature to be
supported in x-terminal, here's how you can quickly get setup.

First make a fork of [xterm.js](https://github.com/xtermjs/xterm.js). Next,
clone your newly created fork as follows.

```sh
git clone ${YOUR_XTERMJS_FORK} ${HOME}/github/xterm.js
```

Go into your newly cloned repo for xterm.js.

```sh
cd ${HOME}/github/xterm.js
```

Install all needed dependencies.

```sh
npm install
```

Build xterm.js.

```sh
npm run build
```

Ensure the test suite passes.

```sh
npm run test
npm run lint
```

Add a global link for xterm.js to your system.

```sh
npm link
```

Inside your x-terminal directory, link against the global `xterm` link.

```sh
cd ${HOME}/github/x-terminal
npm link xterm
```

Finally, perform a rebuild with the [apm](https://github.com/atom/apm) program
inside the x-terminal directory.

```sh
apm rebuild
```

You're all set for developing xterm.js. Hack away in your xterm.js directory,
run `npm run build`, then reload your Atom window to see the changes to your
terminals.

# Credits and Legal

See the [NOTICE](NOTICE) and [LICENSE](LICENSE) files for copyright and license
info about this package respectively.

See the [THIRD-PARTY](THIRD-PARTY) file for info about the dependencies used in
the x-terminal package.

# Feedback

Need to submit a bug report? Have a new feature you want to see implemented in
*x-terminal*? Please feel free to report them through the
[issues page](https://github.com/bus-stop/x-terminal/issues). For bug reports,
please also provide images or demos showing your issues if you can.
