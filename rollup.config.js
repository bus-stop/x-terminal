import { createPlugins, createConfig } from 'rollup-plugin-atomic'

const plugins = createPlugins(['js'], true)

const config = createConfig(
	'src/x-terminal.js',
	'dist',
	'cjs',
	['atom', 'electron', 'node-pty-prebuilt-multiarch'],
	plugins)

export default config
