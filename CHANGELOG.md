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
