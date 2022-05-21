const template = require('art-template');
const fs = require('fs-extra');
const path = require('path');
const $ = require('gogocode');
const PX2Other = require('../../tools/px2other');
const cssConverter = require('../../tools/styleflux');
const sql = require('../../tools/sql');
const format = require('html-format');

module.exports = class {
  constructor() {
    // this.doc = fs.readFileSync(path.resolve(yunjin.ROOT_PATH, './doc/html/index.html')).toString();
    this.doc = sql.getRunTimeInfoByKey('index.html').value;
    this.px2other = new PX2Other(yunjin.config.target.style.unit);
    this.configTarget = yunjin.config.target;
    this.configSource = yunjin.config.source;
  }

  render() {
    // css部分
    // const cssPath = path.resolve(yunjin.ROOT_PATH, './doc/html/index.css');
    // const cssText = fs.readFileSync(cssPath).toString();
    const cssText = sql.getRunTimeInfoByKey('index.css').value;
    let css = this.px2other.convert(cssText);
    // 图片路径转换
    css = css.replace(/images\//ig, '@/static/images/');
    css = cssConverter.cssToScss(css);

    const aster = $(this.doc, {
      parseOptions: {
        language: 'html'
      }
    });

    let astResult = aster.replace('<div class="$_$1">$$$1</div>', '<view  class="$_$1">$$$1</view>')
      .replace('<img src="$_$1"  class="$_$2" />', '<image src="@/static/$_$1" class="$_$2" mode="aspectFit"></image>')
      .replace('<span class="$_$1">$$$1</span>', '<text  class="$_$1">$$$1</text>')
      .generate({
        isPretty: true
      });
    astResult = astResult.replace(/static\/\.\/images/ig, 'static/images');
    astResult = astResult.replace(/\n\n/ig, '');

    const templatePath = path.resolve(__dirname, './template.art');
    const source = fs.readFileSync(templatePath).toString();
    const result = template.render(source, {
      content: astResult,
      css: css
    }, {
      escape: false,
      minimize: false
    });
    const outputFile = path.resolve(yunjin.WORK_PATH, './' + this.configTarget.platform + '/' + this.configTarget.artboardName + '/' + this.configTarget.artboardName + this.configTarget.page.extName);
    fs.outputFileSync(outputFile, this.cleanHtml(result));
    // console.log('执行完毕');
  }

  cleanHtml(data) {
    data = data.replace(/\<\/view\>/ig, '</view>\n');
    data = data.replace(/\<\/text\>/ig, '</text>\n');
    data = data.replace(/(\n[\s\t]*\r*\n)/g, '\n').replace(/^[\n\r\n\t]*|[\n\r\n\t]*$/g, '');
    return format(data);
  }
};
