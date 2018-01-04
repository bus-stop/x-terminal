# [atom-xterm](https://atom.io/packages/atom-xterm) package

[![Linux/macOS Tests](https://img.shields.io/travis/amejia1/atom-xterm/master.svg?label=Linux/macOS+Tests)](https://travis-ci.org/amejia1/atom-xterm)
[![Windows Tests](https://img.shields.io/appveyor/ci/amejia1/atom-xterm/master.svg?label=Windows+Tests)](https://ci.appveyor.com/project/amejia1/atom-xterm)
[![Depedencies](https://img.shields.io/david/amejia1/atom-xterm.svg)](https://david-dm.org/amejia1/atom-xterm)
[![Downloads](https://img.shields.io/apm/dm/atom-xterm.svg)](https://atom.io/packages/atom-xterm)
[![Latest release](https://img.shields.io/apm/v/atom-xterm.svg)](https://atom.io/packages/atom-xterm)
[![Greenkeeper badge](https://badges.greenkeeper.io/amejia1/atom-xterm.svg)](https://greenkeeper.io/)

Atom plugin for providing terminal emulators inside of the editor as tabs.
You can place these tabs anywhere in your workspace just like any other tab.

To install, simply search for a package named *atom-xterm* to install through
the Atom editor. It can also be installed via command-line with the
[apm](https://github.com/atom/apm) command.

```
apm install atom-xterm
```

# Demo
![Atom Xterm demo](https://raw.githubusercontent.com/amejia1/atom-xterm/edf0e819656ccc832d899d57d8d23b2c3c5b5614/resources/atom-xterm-demo.gif)

# Usage

## Opening
To open terminals, just open them through the menu.
![Atom Xterm menu](https://raw.githubusercontent.com/amejia1/atom-xterm/master/resources/atom-xterm-menu.png)

There's also various key bindings you can use to open terminals. See the
available key bindings for the atom-xterm package.

There's also menu items available when right clicking on a text editor or on
a terminal.

Finally, terminal tabs are automatically reopened at the spot you placed them
when you last exited Atom.

## Reorganizing
To quickly reorganize terminal tabs, simply use the main menu. You can also
find menu items by right-clicking on a terminal.

And of course, there's the old fashion way of just moving the tabs where you
want them. Feel free to place your terminal tabs anywhere in your workspace to
include any of the docks.

## Profiles
The atom-xterm package supports saving and loading profiles. What this allows
you to do is save commonly used commands and settings for later use.

![Atom Xterm profiles demo](https://raw.githubusercontent.com/amejia1/atom-xterm/master/resources/atom-xterm-profiles-demo.gif)

## Notifications
The atom-xterm package provides notifications about terminal process exit
successes and failures.

Success

![Atom Xterm exit success](https://raw.githubusercontent.com/amejia1/atom-xterm/master/resources/atom-xterm-exit-success.png)

Failure

![Atom Xterm exit failure](https://raw.githubusercontent.com/amejia1/atom-xterm/master/resources/atom-xterm-exit-failure.png)

There's also activity notifications for terminal tabs not in focus.

![Atom Xterm activity notification](https://raw.githubusercontent.com/amejia1/atom-xterm/master/resources/atom-xterm-activity-notification.png)

# Feedback
Need to submit a bug report? Have a new feature you want to see implemented in
*atom-xterm*? Please feel free to report them through the
[issues page](https://github.com/amejia1/atom-xterm/issues).
