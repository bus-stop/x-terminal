import path from 'path'

import webpack from 'webpack'
import CleanWebpackPlugin from 'clean-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'

import packageJson from './package.json'

const NODE_ENV = process.env.NODE_ENV || 'production'

function getConfig (entryName) {
  let entry = null
  let pathValue = null
  let output = null
  let devtool = 'source-map'
  let target = 'node'
  let plugins = [
    new webpack.EnvironmentPlugin({
      NODE_ENV: NODE_ENV
    }),
    new webpack.BannerPlugin({
      banner: 'This file is auto-generated. Do not modify directly.'
    })
  ]
  if (entryName === 'atom-xterm') {
    entry = {
      'atom-xterm': './src/lib/atom-xterm'
    }
    pathValue = path.resolve(
      __dirname,
      'dist',
      'lib'
    )
    output = {
      path: pathValue,
      filename: '[name].js',
      library: packageJson.name,
      libraryTarget: 'umd'
    }
    target = 'electron-main'
    plugins.push(
      new CleanWebpackPlugin(
        [pathValue]
      )
    )
    plugins.push(
      new CopyWebpackPlugin(
        [
          {
            from: './node_modules/xterm/lib/xterm.css',
            to: './xterm.css'
          }
        ]
      )
    )
  } else if (entryName === 'move-winpty-binaries') {
    entry = {
      'move-winpty-binaries': './src/scripts/move-winpty-binaries'
    }
    pathValue = path.resolve(
      __dirname,
      'dist',
      'preinstallScripts'
    )
    output = {
      path: pathValue,
      filename: '[name].js'
    }
    devtool = false
    plugins.push(
      new CleanWebpackPlugin(
        [pathValue]
      )
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
            loader: 'babel-loader'
          }
        }
      ]
    },
    devtool: devtool,
    target: target,
    externals: [
      /^atom$/,
      // TODO: For now, don't bundle node-pty.
      /^node-pty/
    ],
    plugins: plugins
  }
}

export default [
  getConfig('atom-xterm'),
  getConfig('move-winpty-binaries')
]
