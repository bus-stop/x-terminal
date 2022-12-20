module.exports = {
	extends: 'stylelint-config-standard',
	customSyntax: 'postcss-less',
	rules: {
		'declaration-empty-line-before': null,
		'declaration-block-no-redundant-longhand-properties': null,
		'no-invalid-position-at-import-rule': null,
		'selector-pseudo-element-colon-notation': 'double',
		'no-extra-semicolons': true,
		'function-no-unknown': null,
		'import-notation': 'string',
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
