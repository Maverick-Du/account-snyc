class CreateHtmlPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.emit.tap(CreateHtmlPlugin.name, (compilation) => {
      const assets = compilation.getAssets()
      assets.forEach(item => {
        if (item.name == 'index.html') {
          compilation.updateAsset(item.name, file => {
            const fileValue = file._value.split('src="')
            file._valueAsString = file._value = fileValue.join(`src="%__ECIS_PUBLIC_XORIGIN_PATH__%/c/${this.options.id}/`)
            return file
          })
        }
      })


    })
  }
}
module.exports = CreateHtmlPlugin
