## 3.2.3
* Update description in package.json.

## 3.2.2
* Fix issue where terminal tabs would crash if it cannot load the pty process.
* Update README.

## 3.2.1
* Update README.

## 3.2.0
* Support custom titles in terminal tabs.

## 3.1.1
* Fix issue where terminal tabs wouldn't open in the current pane if the
  current pane was in one of the docks.

## 3.1.0
* Change the button to save new settings so that it doesn't automatically
  restart the current terminal session.

## 3.0.2
* Redo how profile menu is shown. This time don't use transparency since it
  doesn't come out well on certain screens.

## 3.0.1
* Fix error that appears when terminals are set in docks and Atom is restarted.

## 3.0.0
* Add in support to load and save profiles. With profiles support, it will
  now be easy to load any command along with arguments, environment variables,
  and other options so that they can be quickly launched for any project.
* Resolve an issue where a terminal would crash after restarting Atom.
* Resolve an issue where the top line would not clear properly after restarting
  a terminal.
* Use a standard title for atom-xterm tabs on Windows instead of displaying
  the term type.
* Update all dependencies to latest releases.
* Update copyright info for the new year.

## 2.2.0
* Leave terminal emulator tabs open after process has stopped by default.
* Have terminal emulator tabs restored to their original locations in the
  workspace by default after Atom is restarted.

## 2.1.0
* Allow terminals to be restarted when they are selected to stay open on exit.
  * For this change, a helpful message is displayed when the process has
    exited.
  * When the pty process has exited successfully, a simple "success" message
    is displayed.
  * When the pty process has exited with a failure code, an "error" message
    is displayed along with the failure code.
* Support relaunching terminals whenever Atom is restarted.
  * This support is implemented through Atom's own API for deserializing
    items (as described [here](http://flight-manual.atom.io/behind-atom/sections/serialization-in-atom/)).

## 2.0.0
* Update the plugin so that it uses all asynchronous methods when operating.
  This mainly meant replacing all the 'sync' methods from the 'fs' module with
  their main async counterparts. This will make the atom-xterm plugin more
  responsive.
* Have atom-xterm's 'open' method also be asynchronous.
* Use the same min/max range for the terminals' font size as that of the main
  editor.
* Link to the homepage from the README.md file.
* Other basic maintenance.

## 1.0.24
* Have the cursor blink by default.

## 1.0.23
* Some basic maintenance, no new features.

## 1.0.22
* Import the needed xterm.css through the atom-xterm.less stylesheet instead
  of when the package is loaded.

## 1.0.21
* Fixing busted upload of previous version.

## 1.0.20
* Some basic maintenance, no new features.

## 1.0.19
* Replace the 'alt-shift-\*' hotkeys.
  Use the same hotkeys as those from Bash from Git for Windows.

## 1.0.18
* Fix updates on Windows for users that install Atom in a non-standard drive.

## 1.0.17
* Use a simpler method to escape needed characters in RegExp in
  move-winpty-binaries.js script.

## 1.0.16
* Moving move-winpty-binaries.js script outside of lib directory.
* Add more debugging output in move-winpty-binaries.js script.
* Make all keyboard shortcuts the same for all platforms.

## 1.0.15
* Just adding a new release to check updates on Windows succeed without issue.

## 1.0.14
* Handle case better when home directory is simply set to .node-gyp directory.

## 1.0.13
* Try harder to find main atom home path to move winpty binaries.

## 1.0.12
* Trying searching for atom-xterm under ~/.atom/packages in order to move
  winpty binaries.

## 1.0.11
* Just adding a new release to check updates on Windows succeed without issue.

## 1.0.10
* Fix 'move-winpty-binaries.js' so that it moves winpty binaries from main
  install path of atom-xterm.

## 1.0.9
* Add more log messages in the 'move-winpty-binaries.js' script.

## 1.0.8
* Just adding a new release to check updates on Windows succeed without issue.

## 1.0.7
* Add preinstall and preuninstall scripts which will move winpty binaries
  when updating atom-xterm package. This should fix [#5](https://github.com/amejia1/atom-xterm/issues/5).

## 1.0.6
* Remove commit attempting to fix [#5](https://github.com/amejia1/atom-xterm/issues/5). Issue remains.

## 1.0.5
* No changes, just earlier problem publishing package through apm.

## 1.0.4
* Fix issue with updating atom-xterm on Windows ([#5](https://github.com/amejia1/atom-xterm/issues/5)).

## 1.0.3
* Forgot to update changelog.

## 1.0.2
* Workaround for the problem with using less on Linux with atom-xterm.
* Use xterm-256color instead for default TERM.

## 1.0.1
* Update badges.
* Signup to Greenkeeper.
* Use a different Jasmine reporter for better test reports on the command line.

## 1.0.0 - Production Ready
* API stabilized.
* The *atom-xterm* pseudo-protocol stabilized.
* Major features for production ready terminals implemented.
* Well tested through automated test suite as well as through A/B testing.

## 0.0.0 - First Release
* Initial implementation.
