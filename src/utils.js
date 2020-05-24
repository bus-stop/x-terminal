/** @babel */
/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Copyright 2017-2018 Andres Mejia <amejia004@gmail.com>. All Rights Reserved.
 * Copyright (c) 2020 UziTech All Rights Reserved.
 * Copyright (c) 2020 bus-stop All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

export function clearDiv (div) {
	while (div.firstChild) {
		div.removeChild(div.firstChild)
	}
}

export function createHorizontalLine () {
	const hLine = document.createElement('div')
	hLine.classList.add('x-terminal-profile-menu-element-hline')
	hLine.appendChild(document.createTextNode('.'))
	return hLine
}

export function recalculateActive (terminalsSet, active) {
	const allowHidden = atom.config.get('x-terminal.terminalSettings.allowHiddenToStayActive')
	const terminals = [...terminalsSet]
	terminals.sort((a, b) => {
		// active before other
		if (active && a === active) {
			return -1
		}
		if (active && b === active) {
			return 1
		}
		if (!allowHidden) {
			// visible before hidden
			if (a.isVisible() && !b.isVisible()) {
				return -1
			}
			if (!a.isVisible() && b.isVisible()) {
				return 1
			}
		}
		// lower activeIndex before higher activeIndex
		return a.activeIndex - b.activeIndex
	})
	terminals.forEach((t, i) => {
		t.activeIndex = i
		t.emitter.emit('did-change-title')
	})
}
