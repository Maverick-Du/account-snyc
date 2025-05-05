const TerserPlugin = require('terser-webpack-plugin')
const config = require('./webpack.config')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const path = require('path')
const webpack = require('webpack')
const CreateConfigPlugin = require('./create-config-plugin')
const CreateHtmlPlugin = require('./create-html-plugin')
const meta = require('../config.json')

config.mode = 'production'
config.devtool = false
config.optimization = {
  minimizer: [
    new TerserPlugin({
      extractComments: false,
      parallel: true,
      terserOptions: {
        output: {
          ie8: true,
          ecma: 5
        }
      }
    })
  ]
}

config.plugins.push(new CreateConfigPlugin({
  outputPath: path.join(config.output.path, '../config.json'),
  meta
}))
config.plugins.push(new CopyWebpackPlugin({
  patterns: [
    {from: path.resolve(__dirname, "../docs"), to: path.resolve(__dirname, "../build/pack"), noErrorOnMissing: true}
  ]
}))
config.plugins.push(new webpack.DllReferencePlugin({
  context: path.join(__dirname, '../lib/dll'),
  manifest: require('../lib/dll/react-manifest.json')
}))

config.plugins.push(new webpack.DllReferencePlugin({
  context: path.join(__dirname, '../lib/dll'),
  manifest: require('../lib/dll/common-manifest.json')
}))
config.plugins.push(new CreateHtmlPlugin(
  {
    id: process.env.ECIS_COMPONENT_ID
  }
))


module.exports = config
