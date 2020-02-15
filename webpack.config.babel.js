import path from 'path'

import webpack from 'webpack'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin'

import packageJson from './package.json'

const NODE_ENV = process.env.NODE_ENV || 'production'

function getConfig (entryName) {
	let entry = null
	let pathValue = null
	let output = null
	let devtool = 'source-map'
	let target = 'node'
	const plugins = [
		new webpack.EnvironmentPlugin({
			NODE_ENV: NODE_ENV,
		}),
		new webpack.BannerPlugin({
			banner: 'This file is auto-generated. Do not modify directly.',
		}),
	]
	if (entryName === 'x-terminal') {
		entry = {
			'x-terminal': './src/lib/x-terminal',
		}
		pathValue = path.resolve(
			__dirname,
			'dist',
			'lib',
		)
		output = {
			path: pathValue,
			filename: '[name].js',
			library: packageJson.name,
			libraryTarget: 'umd',
		}
		target = 'electron-renderer'
		plugins.push(
			new CleanWebpackPlugin(),
			new MiniCssExtractPlugin({
				filename: '[name].css',
			}),
			new OptimizeCssAssetsPlugin({
				assetNameRegExp: /\.css$/g,
				cssProcessorOptions: {
					map: {
						inline: false,
					},
				},
			}),
		)
	} else if (entryName === 'move-winpty-binaries') {
		entry = {
			'move-winpty-binaries': './src/scripts/move-winpty-binaries',
		}
		pathValue = path.resolve(
			__dirname,
			'dist',
			'preinstallScripts',
		)
		output = {
			path: pathValue,
			filename: '[name].js',
		}
		devtool = false
		plugins.push(
			new CleanWebpackPlugin(),
		)
	} else {
		console.error(`Unknown entryName: ${entryName}`)
	}
	return {
		mode: NODE_ENV,
		entry: entry,
		output: output,
		module: {
			rules: [
				{
					test: /\.js$/,
					use: {
						loader: 'babel-loader',
					},
				},
				{
					test: /\.(?:sa|s?c)ss$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader,
							options: {
								sourceMap: true,
							},
						},
						{
							loader: 'css-loader',
							options: {
								sourceMap: true,
							},
						},
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: true,
							},
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true,
							},
						},
					],
				},
			],
		},
		devtool: devtool,
		target: target,
		externals: [
			/^atom$/,
			// TODO: For now, don't bundle node-pty.
			/^node-pty/,
		],
		plugins: plugins,
	}
}

export default [
	getConfig('x-terminal'),
	getConfig('move-winpty-binaries'),
]
