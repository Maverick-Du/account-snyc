const css = require('css')

function parseRules(rules) {
  let selectors = []
  for (let rule of rules) {
    if (rule.type === 'rule') {
      selectors = selectors.concat(rule.selectors)
    }
    if (rule.type === 'media' && rule.rules) {
      selectors = selectors.concat(parseRules(rule.rules))
    }
  }
  return selectors
}

module.exports = function (source) {
  let ast = css.parse(source)
  let selectors = new Set(parseRules(ast.stylesheet.rules))
  for (let item of selectors) {
    if (!item.startsWith('.') && !item.startsWith('#')) {
      throw new Error('只允许使用类选择器或ID选择器')
    }
  }
  return css.stringify(ast)
}