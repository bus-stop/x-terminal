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

import { Emitter } from 'atom'

import { configDefaults, CONFIG_DATA } from './config'

import fs from 'fs-extra'
import path from 'path'

import { v4 as uuidv4 } from 'uuid'
import { URL } from 'whatwg-url'
import { detailedDiff } from 'deep-object-diff'

const X_TERMINAL_BASE_URI = 'x-terminal://'

const XTerminalProfilesSingletonSymbol = Symbol('XTerminalProfilesSingleton sentinel')

class XTerminalProfilesSingleton {
	constructor (symbolCheck) {
		if (XTerminalProfilesSingletonSymbol !== symbolCheck) {
			throw new Error('XTerminalProfilesSingleton cannot be instantiated directly.')
		}
		this.emitter = new Emitter()
		this.profilesConfigPath = path.join(configDefaults.userDataPath, 'profiles.json')
		this.profiles = {}
		this.previousBaseProfile = null
		this.baseProfile = this.getDefaultProfile()
		this.resetBaseProfile()
		this.profilesLoadPromise = null
		this.reloadProfiles()
	}

	static get instance () {
		if (!this[XTerminalProfilesSingletonSymbol]) {
			this[XTerminalProfilesSingletonSymbol] = new XTerminalProfilesSingleton(XTerminalProfilesSingletonSymbol)
		}
		return this[XTerminalProfilesSingletonSymbol]
	}

	sortProfiles (profiles) {
		const orderedProfiles = {}
		Object.keys(profiles).sort().forEach((key) => {
			orderedProfiles[key] = profiles[key]
		})
		return orderedProfiles
	}

	async reloadProfiles () {
		let resolveLoad
		this.profilesLoadPromise = new Promise((resolve) => {
			resolveLoad = resolve
		})
		try {
			const data = await fs.readJson(this.profilesConfigPath)
			this.profiles = this.sortProfiles(data)
			this.emitter.emit('did-reload-profiles', this.getSanitizedProfilesData())
			resolveLoad()
		} catch (err) {
			// Create the profiles file.
			await this.updateProfiles({})
			this.emitter.emit('did-reload-profiles', this.getSanitizedProfilesData())
			resolveLoad()
		}
	}

	onDidReloadProfiles (callback) {
		return this.emitter.on('did-reload-profiles', callback)
	}

	onDidResetBaseProfile (callback) {
		return this.emitter.on('did-reset-base-profile', callback)
	}

	async updateProfiles (newProfilesConfigData) {
		await fs.ensureDir(path.dirname(this.profilesConfigPath))
		newProfilesConfigData = this.sortProfiles(newProfilesConfigData)
		await fs.writeJson(this.profilesConfigPath, newProfilesConfigData)
		this.profiles = newProfilesConfigData
	}

	deepClone (data) {
		return JSON.parse(JSON.stringify(data))
	}

	diffProfiles (oldProfile, newProfile) {
		// This method will return added or modified entries.
		const diff = detailedDiff(oldProfile, newProfile)
		return {
			...diff.added,
			...diff.updated,
		}
	}

	getDefaultProfile () {
		const defaultProfile = {}
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue
			defaultProfile[data.profileKey] = data.defaultProfile
		}
		return defaultProfile
	}

	getBaseProfile () {
		return this.deepClone(this.baseProfile)
	}

	resetBaseProfile () {
		this.previousBaseProfile = this.deepClone(this.baseProfile)
		this.baseProfile = {}
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue
			this.baseProfile[data.profileKey] = data.toBaseProfile(this.previousBaseProfile[data.profileKey])
		}
		this.emitter.emit('did-reset-base-profile', this.getBaseProfile())
	}

	sanitizeData (unsanitizedData) {
		const sanitizedData = {}
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue
			if (data.profileKey in unsanitizedData) {
				sanitizedData[data.profileKey] = unsanitizedData[data.profileKey]
			}
		}

		return this.deepClone(sanitizedData)
	}

	getSanitizedProfilesData () {
		const retval = {}
		for (const key in this.profiles) {
			retval[key] = this.sanitizeData(this.profiles[key])
		}
		return retval
	}

	async getProfiles () {
		await this.profilesLoadPromise
		return this.getSanitizedProfilesData()
	}

	async getProfile (profileName) {
		await this.profilesLoadPromise
		return {
			...this.deepClone(this.baseProfile),
			...this.sanitizeData(this.profiles[profileName] || {}),
		}
	}

	async isProfileExists (profileName) {
		await this.profilesLoadPromise
		return profileName in this.profiles
	}

	async setProfile (profileName, data) {
		await this.profilesLoadPromise
		const profileData = {
			...this.deepClone(this.baseProfile),
			...this.sanitizeData(data),
		}
		const newProfilesConfigData = {
			...this.deepClone(this.profiles),
		}
		newProfilesConfigData[profileName] = profileData
		await this.updateProfiles(newProfilesConfigData)
	}

	async deleteProfile (profileName) {
		await this.profilesLoadPromise
		const newProfilesConfigData = {
			...this.deepClone(this.profiles),
		}
		delete newProfilesConfigData[profileName]
		await this.updateProfiles(newProfilesConfigData)
	}

	generateNewUri () {
		return X_TERMINAL_BASE_URI + uuidv4() + '/'
	}

	generateNewUrlFromProfileData (profileData) {
		profileData = this.sanitizeData(profileData)
		const url = new URL(this.generateNewUri())
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue
			if (data.profileKey in profileData) url.searchParams.set(data.profileKey, data.toUrlParam(profileData[data.profileKey]))
		}
		return url
	}

	createProfileDataFromUri (uri) {
		const url = new URL(uri)
		const baseProfile = this.getBaseProfile()
		const profileData = {}
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue
			const param = url.searchParams.get(data.profileKey)
			if (param) {
				profileData[data.profileKey] = data.fromUrlParam(param)
			}
			if (!param || !data.checkUrlParam(profileData[data.profileKey])) {
				profileData[data.profileKey] = baseProfile[data.profileKey]
			}
		}
		return profileData
	}
}

export {
	X_TERMINAL_BASE_URI,
	XTerminalProfilesSingleton,
}
