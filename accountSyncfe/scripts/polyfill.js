const webpack = require('webpack')
const { RawSource } = webpack.sources

const polyfill = `!function(document){var scripts=document.getElementsByTagName("script");"currentScript"in document||Object.defineProperty(document,"currentScript",{get:function(){try{throw new Error}catch(err){var i,res=(/.*at [^\(]*\((.*):.+:.+\)$/gi.exec(err.stack)||[!1])[1];for(i in scripts)if(scripts[i].src==res||"interactive"==scripts[i].readyState)return scripts[i];return null}}})}(document);`

module.exports = class DtsBundlePlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('CurrentScript', compilation => {
      for (const file in compilation.assets) {
        if (file.endsWith('.js')) {
          const content = compilation.assets[file].buffer()
          const source = new RawSource(
            `${polyfill}\n${content.toString('utf-8')}`
          )
          compilation.updateAsset(file, source)
        }
      }
    })
  }
}
