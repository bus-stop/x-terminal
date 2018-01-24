# [atom-xterm](https://atom.io/packages/atom-xterm)

Atom plugin for providing terminals inside your Atom workspace.

[![Linux/macOS Tests](https://img.shields.io/travis/amejia1/atom-xterm/master.svg?label=Linux/macOS+Tests)](https://travis-ci.org/amejia1/atom-xterm)
[![Windows Tests](https://img.shields.io/appveyor/ci/amejia1/atom-xterm/master.svg?label=Windows+Tests)](https://ci.appveyor.com/project/amejia1/atom-xterm)
[![Depedencies](https://img.shields.io/david/amejia1/atom-xterm.svg)](https://david-dm.org/amejia1/atom-xterm)
[![Downloads](https://img.shields.io/apm/dm/atom-xterm.svg)](https://atom.io/packages/atom-xterm)
[![Latest release](https://img.shields.io/apm/v/atom-xterm.svg)](https://atom.io/packages/atom-xterm)
[![Greenkeeper badge](https://badges.greenkeeper.io/amejia1/atom-xterm.svg)](https://greenkeeper.io/)

![Atom Xterm demo](https://raw.githubusercontent.com/amejia1/atom-xterm/b43510426c6443ad130a36753352e57b4b24c71a/resources/atom-xterm-demo.gif)

# Installation

To install, simply search for the *atom-xterm* package via Atom's package
manager. It can also be installed via command-line with the
[apm](https://github.com/atom/apm) command.

```
apm install atom-xterm
```

# Usage

## Opening Terminals

To open terminals, just open them through the menu.

![Atom Xterm menu](https://raw.githubusercontent.com/amejia1/atom-xterm/9dfb79f31df4df67b12be74f541c39d498d2212f/resources/atom-xterm-menu.png)

There's also various key bindings you can use to open terminals. See the
available key bindings for the atom-xterm package.

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

![Atom Xterm moving terminals demo](https://raw.githubusercontent.com/amejia1/atom-xterm/b43510426c6443ad130a36753352e57b4b24c71a/resources/atom-xterm-moving-terminals-demo.gif)

## Profiles

The atom-xterm package supports saving and loading profiles. What this allows
you to do is save commonly used commands and settings for later use.

![Atom Xterm profiles demo](https://raw.githubusercontent.com/amejia1/atom-xterm/5604f0433291a452ceffcc722c61fa2835d8b67a/resources/atom-xterm-profiles-demo.gif)

## Notifications

The atom-xterm package provides notifications about terminal process exit
successes and failures. Notifications will appear in Atom's own noatification
manager as well as on the terminal tab triggering the notification.

Success

![Atom Xterm exit success](https://raw.githubusercontent.com/amejia1/atom-xterm/master/resources/atom-xterm-exit-success.png)

Failure

![Atom Xterm exit failure](https://raw.githubusercontent.com/amejia1/atom-xterm/master/resources/atom-xterm-exit-failure.png)

There's also activity notifications for terminal tabs not in focus.

![Atom Xterm activity notification](https://raw.githubusercontent.com/amejia1/atom-xterm/master/resources/atom-xterm-activity-notification.png)

## Services

For plugin writers, the atom-xterm package supports one service method which
can be used to easily open terminals. This method is provided using Atom's [services](http://flight-manual.atom.io/behind-atom/sections/interacting-with-other-packages-via-services/)
API. To use it, add a consumer method to consume the `atom-xterm` service, or
rather a JavaScript object that provides an
[openTerminal()](https://github.com/amejia1/atom-xterm/blob/0376dba8551f7518fa184d4688bbdba6779163aa/lib/atom-xterm.js#L388) method. The `openTerminal()` method behaves just like Atom's
[open()](https://github.com/atom/atom/blob/v1.23.3/src/workspace.js#L912)
method except that the first argument must be a JSON object describing the
terminal profile that should be opened. Docs about this JSON object can be
found [here](https://github.com/amejia1/atom-xterm/blob/0376dba8551f7518fa184d4688bbdba6779163aa/lib/atom-xterm-profiles.js#L223).

As an example on how to use the provided `openTerminal()` method, your
`package.json` should have the following.

```json
{
  "consumedServices": {
    "atom-xterm": {
      "versions": {
        "^1.0.0": "consumeAtomXtermService"
      }
    }
  }
}
```

Your package's main module should then define a `consumeAtomXtermService`
method, for example.

```javascript
// In ECMAScript 6

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

```javascript
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

# Development

Want to help develop atom-xterm? Just use the
[apm](https://github.com/atom/apm) command to quickly get setup.

```
apm develop atom-xterm
```

This should clone the atom-xterm package into `$HOME/github/atom-xterm`. Open
this directory in Atom's dev mode and hack away.

There's a test suite for automated testing of the atom-xterm package.
Simply go to `View > Developer > Run Package Specs` in Atom's main menu or
use the hotkey. You can also run test suite via command-line by running
`atom --test spec` inside the atom-xterm directory.

# Credits and Legal

See the [NOTICE](NOTICE) and [LICENSE](LICENSE) files for copyright and license
info about this package respectively.

See the [THIRD-PARTY](THIRD-PARTY) file for info about the dependencies used in
the atom-xterm package.

# Feedback

Need to submit a bug report? Have a new feature you want to see implemented in
*atom-xterm*? Please feel free to report them through the
[issues page](https://github.com/amejia1/atom-xterm/issues). For bug reports,
please also provide images or demos showing your issues if you can.
