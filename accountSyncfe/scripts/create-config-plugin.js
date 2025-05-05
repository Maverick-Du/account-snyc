const fs = require('fs')
class CreateConfigPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap(CreateConfigPlugin.name, stats => {
      const { assets } = stats
      const assetsName = Object.keys(assets)
      let entrys = []
      assetsName.forEach(name => {
        if (/^plugin(\.\w+)?(\.\w+)?\.js$/.test(name)) {
          entrys.push(name)
        }
        if (/^web(\.\w+)?(\.\w+)?\.js$/.test(name)) {
          entrys.push(name)
        }
        if (/^index(\.\w+)?(\.\w+)?\.html$/.test(name)) {
          entrys.push(name)
        }
      })
      if (this.options.meta.configuration) {
        // 兼容config.json中entrys内容
        this.options.meta.configuration.entrys = [...new Set([...this.options.meta.configuration.entrys, ...entrys])]
      }
      fs.writeFileSync(
        this.options.outputPath,
        JSON.stringify(this.options.meta, null, 2),
        'utf-8'
      )
    })
  }
}

module.exports = CreateConfigPlugin