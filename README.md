                  ██╗  ██╗  ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
                  ╚██╗██╔╝  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
                   ╚███╔╝█████╗██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
                   ██╔██╗╚════╝██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
                  ██╔╝ ██╗     ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
                  ╚═╝  ╚═╝     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
<br>
<p align="center">
  <a href="https://github.com/bus-stop/x-terminal/actions?query=workflow%3ACI">
    <img src="https://img.shields.io/github/workflow/status/bus-stop/x-terminal/CI?style=flat-square&logo=github&label=CI%20status" alt="actions status">
  </a>
  <a href="https://github.com/bus-stop/x-terminal/tags">
    <img src="https://img.shields.io/github/tag/bus-stop/x-terminal.svg?label=current%20version&style=flat-square" alt="version">
  </a>
  <a href="https://github.com/bus-stop/x-terminal/stargazers">
    <img src="https://img.shields.io/github/stars/bus-stop/x-terminal.svg?style=flat-square" alt="stars">
  </a>
  <a href="https://github.com/bus-stop/x-terminal/network">
    <img src="https://img.shields.io/github/forks/bus-stop/x-terminal.svg?style=flat-square" alt="forks">
  </a>
  <a href="https://david-dm.org/bus-stop/x-terminal">
    <img src="https://img.shields.io/david/dev/bus-stop/term.js.svg?label=dependencies&style=flat-square" alt="dependencies">
  </a>
  <a href="https://david-dm.org/bus-stop/x-terminal?type=dev">
    <img src="https://img.shields.io/david/dev/bus-stop/term.js.svg?label=devdependencies&style=flat-square" alt="dependencies">
  </a>
</p>
<h3 align="center">
  An xterm based Atom plugin for providing terminals inside your Atom workspace!&nbsp;❤️
</h3>
<h5 align="center">A fork of
  <a href="https://atom.io/packages/atom-xterm">atom.io/packages/atom-xterm</a>
</h5>
<h5 align="center">
  <a href="https://atom.io/packages/x-terminal">atom.io packages x-terminal</a>
</h5>
<br>

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

## Atom Feature Request for a Built in Terminal

If you're reading this and you would rather see Atom have a built-in terminal
by default, please go over to the built-in terminal feature request thread
[here](https://github.com/atom/atom/issues/14490), give it a thumbs up, **and**
give an explanation as to why you need a built-in terminal in Atom by default.

# Installation

Go to <https://atom.io/packages/x-terminal> and click install, or search for
the *x-terminal* package via Atom's package manager. It can also be installed
via command-line with the [apm](https://github.com/atom/apm) command.

```sh
apm install x-terminal
```

## Opening Terminals

To open terminals, you can open them through the menu or through the available key bindings.

![X-Terminal menu](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-packages-menu.png)

See [the available key bindings](https://github.com/bus-stop/x-terminal/blob/master/keymaps/x-terminal.json) for the x-terminal package.

There's also menu items available for opening terminals via right clicking on a
text editor or on a terminal.

Finally, terminal tabs are automatically reopened at the spot you placed them
when you last exited Atom.

## Active Terminal

The active terminal is the terminal that will be used when sending commands to
the terminal with commands like `x-terminal:insert-selected-text` and
`x-terminal:run-selected-text`

The active terminal will always have an astrix (`*`) in front of the title.
By default when a terminal is hidden it becomes inactive and the last used
visible terminal will become active. If there are no visible terminals none are
active.

The `Allow Hidden Terminal To Stay Active` setting will change the
default behavior and keep a terminal that is hidden active until another
terminal is focused.

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

There are also activity notifications for terminal tabs not in focus.

![X-Terminal activity notification](https://cdn.statically.io/gh/bus-stop/x-terminal/master/resources/x-terminal-activity-notification.gif)

## Services

For plugin writers, the `x-terminal` package supports two services, `atom-xterm` and `platformioIDETerminal`, which
can be used to easily open terminals. These methods are provided using Atom's [services](http://flight-manual.atom.io/behind-atom/sections/interacting-with-other-packages-via-services/)
API.

To use a service, add a consumer method to consume the service, or
rather a JavaScript object that provides methods to open terminals and run commands.

### 'atom-xterm' service v2.0.0

The `atom-xterm` service provides the
[openTerminal()](https://github.com/bus-stop/x-terminal/blob/42ddb71523a393178cacabca17b38d681b87f292/src/x-terminal.js#L262) method. The `openTerminal()` method behaves just like Atom's
[open()](https://github.com/atom/atom/blob/917a00e195b93c8c2a9adc349fd8fa1844f61dbc/src/workspace.js#L1076)
method except that the first argument must be a JSON object describing the
terminal profile that should be opened. Docs about this JSON object can be
found [here](https://github.com/bus-stop/x-terminal/blob/42ddb71523a393178cacabca17b38d681b87f292/src/config.js#L25).

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

The `platformioIDETerminal` service provides an [object](https://github.com/bus-stop/x-terminal/blob/42ddb71523a393178cacabca17b38d681b87f292/src/x-terminal.js#L365) with `updateProcessEnv`, `run`, `getTerminalViews`, and `open` methods.

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

You shouldn't need to rebuild any [node-pty](https://github.com/Tyriar/node-pty)
since they are pre-compiled, however in the event they aren't available,
you can rebuild them with:

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

Click for copyright and license info about this package.

[![LICENSE and © INFO](https://img.shields.io/badge/©%20&#38;%20LICENSE-MIT-blue.svg?longCache=true&style=flat-square)](LICENSE)

# Feedback

Need to submit a bug report? Have a new feature you want to see implemented in
*x-terminal*? Please feel free to submit them through the appropriate
[issue template](https://github.com/bus-stop/x-terminal/issues/new/choose).

For bug reports, please provide images or demos showing your issues if you can.
