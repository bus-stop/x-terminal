## 6.5.0
* Switch to babel 7 for generating move-winpty-binaries.js script.
* Use eslint-config-standard@next release to fix test failures in AppVeyor.
* Upgrade all dependencies.

## 6.4.1
* Support opening terminals with 'ctrl+\`' and 'ctrl+~'.

## 6.4.0
* Upgrade to xterm v3.4.0.
* Set the 'experimentalCharAtlas' option to 'dynamic' by default. This improves
  performance and also seems to be more stable than the 'static' mode which
  xterm.js uses by default.
* Upgrade to latest releases for other dependencies.

## 6.3.1
* Fix issue where output could become corrupted when resizing terminal
  on Windows.
* Add docs on installing one time prerequisites before installing atom-xterm.

## 6.3.0
* Add notice in README to have users request a built-in terminal in Atom.
* Support an option to prompt to start terminal commands when Atom starts up.
* Utilize the global editor option 'Zoom Font When Ctrl Scrolling' to determine
  if zooming the font with ctrl+mousewheel should be done in terminals.
* Update all dependencies to latest releases.

## 6.2.3
* Update all dependencies to latest releases.

## 6.2.2
* Update all dependencies to latest releases.

## 6.2.1
* Update all dependencies to latest releases.

## 6.2.0
* Update all dependencies to latest releases.
* Fix issue where the "link" menu items don't appear in some cases when
  right-clicking on a link.

## 6.1.0
* Do some general refactoring of the codebase.
* Fix problems in test suite triggered in calls to asynchronous code.
* Document public APIs (i.e. services) using JSDoc.
* Fix README Development section to add critical steps in order to develop
  atom-xterm.
* Add section on how to develop [xterm.js](https://github.com/xtermjs/xterm.js)
  with atom-xterm.

## 6.0.0
* Allow for full customization of the terminals through the available options
  for xterm.js Terminal objects.
* Support increasing/decreasing the font size for specific terminals by holding
  the Ctrl button and moving the mouse wheel up and down.
* Ensure terminal is completely visible before applying any new terminal
  changes. This includes resizing the terminal.
* When making changes to the terminal via the profiles view, only restart the
  pty process if any of the pty process settings have changed.
* Formally declare what methods are considered public in the AtomXtermModel
  class.

## 5.3.0
* Fully fix support for changing font size in terminals. New font size
  settings will be applied to existing terminals as well as new terminals.
* Only refit terminals when they are fully visible.

## 5.2.0
* Partially enable support for setting font size for terminals. New font size
  changes will apply for newly created terminals.

## 5.1.0
* Enable support for opening links inside terminal once again with new changes
  from xterm.js v3.

## 5.0.1
* Optimize opening of terminals by simply returning calls to async functions.

## 5.0.0
* Rework service that's provided by atom-xterm. Service will now be an object
  which defines an `openTerminal` property that can be used to open terminals.
  This change also fixes earlier problems with terminal not opening in call
  to service method.
* Don't add any useless return statements called after calling process.exit()
  in move-winpty-binaries.js script.

## 4.4.0
* Fix issue where terminal hangs if directory to use as CWD does not exist.
* Provide a service method `openTerminal()` for plugin writers to easily open
  terminals using the atom-xterm package.

## 4.3.1
* Update all dependencies.

## 4.3.0
* Switch to node-pty-prebuilt.

## 4.2.1
* Use exact commit for dependency on xterm.

## 4.2.0
* Upgrade to xterm.js v3.
* Convert the move-winpty-binaries.js script to ES6.
* Include unit tests for the move-winpty-binaries.js script.
* Use various `lint` tools to check for and correct problems with code.

## 4.1.0
* Use latest dependencies.

## 4.0.0
* Fix issue with showing proper hotkeys for menu items.
* Use different hotkeys to open terminals inside docks.

## 3.3.1
* Update README.

## 3.3.0
* Ensure atom-xterm is able to use other packages' services.
* Support opening terminal tabs directly in docks.
* Support reorganizing terminal tabs to docks.
* Add a menu item to quickly restart terminals.

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
