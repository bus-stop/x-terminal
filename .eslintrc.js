module.exports = {
	env: {
		es6: true,
		node: true,
		browser: true,
	},
	extends: [
		'plugin:json/recommended',
		'standard',
	],
	globals: {
		atom: 'readonly',
	},
	parserOptions: {
		ecmaVersion: 2018,
	},
	rules: {
		'comma-dangle': ['error', 'always-multiline'],
		indent: ['error', 'tab', { SwitchCase: 1 }],
		'no-tabs': ['error', { allowIndentationTabs: true }],
		'no-console': 'warn',
	},
}
