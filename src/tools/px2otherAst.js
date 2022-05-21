const css = require('css');

module.exports = class {
  constructor(config = {}) {
    this.config = Object.assign({
      scale: 2, // 缩放比例
      precision: 6, // 小数精度
      name: 'rpx'
    }, config);
  }

  convert(cssText = '', name = null) {
    const ast = css.parse(cssText);
    const rules = ast.stylesheet.rules;

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const declarations = rule.declarations;
      for (let j = 0; j < declarations.length; j++) {
        const declaration = declarations[j];
        declaration.value = this._getCalcValue(declaration.value, name || this.config.name); // common transform
      }
    }
    const result = css.stringify(ast);
    return result;
  }

  _getCalcValue(value, type = 'rpx') {
    const config = this.config;
    const pxRegExp = /\b(\d+(\.\d+)?)px\b/;
    const pxGlobalRegExp = new RegExp(pxRegExp.source, 'g');

    function getValue(val) {
      val = parseFloat(val.toFixed(config.precision)); // control decimal precision of the calculated value
      return val === 0 ? val : val + type;
    }

    return value.replace(pxGlobalRegExp, function($0, $1) {
      return getValue($1 * config.scale);
    });
  }
};
