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
the Atom editor. It can also be installed via command-line with the following
command.

```bash
apm install atom-xterm
```

# Features
* Fully functioning terminal (through major help from [xterm.js](https://xtermjs.org/))
* Cross-platform support (works on Linux, Windows, and macOS through major help from [node-pty](https://www.npmjs.com/package/node-pty))
* Multiple terminals open at once (open as many as you like)
* Terminals as tabs (place terminals anywhere in the Atom workspace)
* Appropriate directory used automatically when opening terminals (terminals will start in appropriate project folder for example)
* Simple notifications when a terminal has been modified
* Basic notification of current process running inside a terminal
* Support for quickly launching any program, for example Django's
  [runserver](https://docs.djangoproject.com/en/stable/ref/django-admin/#runserver) command.
* Support for quickly restarting terminal processes that have finished
* Support for relaunching terminals when Atom restarts
* Hotkeys to quickly open terminals
* Hotkeys to quickly copy from and paste to terminal
* Support for quickly clicking on or copying links inside terminal
* Support for auto-arranging terminals to one pane
* Different customization options, for example...
  * Setting a different default shell (use [Bash from Homebrew](http://brewformulas.org/Bash) or [Bash from Git for Windows](https://git-for-windows.github.io/) for example)
  * Setting arguments to pass to default shell
  * Setting a different default font size
  * etc.

# Demo
![Atom Xterm demo](https://raw.githubusercontent.com/amejia1/atom-xterm/edf0e819656ccc832d899d57d8d23b2c3c5b5614/resources/atom-xterm-demo.gif)
