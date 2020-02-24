module.exports = {
	extends: 'stylelint-config-standard',
	// ignoreFiles: ['node_modules/**/*'],
	rules: {
		'declaration-empty-line-before': null,
		indentation: 'tab',
		'selector-type-no-unknown': [
			true, {
				ignoreTypes: [
					'x-terminal',
					'x-terminal-profile',
				],
			},
		],
	},
}
