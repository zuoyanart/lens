const BigNumber = require('bignumber.js');
module.exports = class {
  constructor(config = {}) {
    this.config = Object.assign({
      scale: 0.02, // 缩放比例
      precision: 6, // 小数精度
      name: 'rem'
    }, config);
  }

  convert(cssString) {
    const css = cssString.replace(/(\d+(\.\d+)?)px/g, (matchStr, arg2, index, arg5) => {
      return parseFloat(new BigNumber(arg2).times(this.config.scale).toFixed(this.config.precision)) + this.config.name;
    });
    return css;
  }
};
