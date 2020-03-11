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

import { clearDiv } from './utils'

class XTerminalSaveProfileElementImpl extends HTMLElement {
	initialize (model) {
		this.model = model
		this.model.setElement(this)
		this.textboxDiv = document.createElement('div')
		this.textboxDiv.classList.add('x-terminal-save-profile-textbox')
		this.appendChild(this.textboxDiv)
		this.messageDiv = document.createElement('div')
		this.messageDiv.classList.add('x-terminal-modal-message')
		this.messageDiv.appendChild(document.createTextNode('Enter new profile name'))
		this.appendChild(this.messageDiv)
	}

	setNewTextbox (textbox) {
		clearDiv(this.textboxDiv)
		this.textboxDiv.appendChild(textbox.getElement())
	}
}

const XTerminalSaveProfileElement = document.registerElement('x-terminal-save-profile', {
	prototype: XTerminalSaveProfileElementImpl.prototype,
})

export {
	XTerminalSaveProfileElement,
}
