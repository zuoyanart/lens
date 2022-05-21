const template = require('art-template');
const fs = require('fs-extra');
const path = require('path');
const $ = require('gogocode');
const PX2Other = require('../../tools/px2other');
const sql = require('../../tools/sql');
const sass = require('sass');
const CleanCSS = require('clean-css');
const format = require('html-format');

module.exports = class {
  constructor() {
    // this.doc = fs.readFileSync(path.resolve(yunjin.ROOT_PATH, './doc/html/index.html')).toString();
    this.doc = sql.getRunTimeInfoByKey('index.html').value;
    this.px2other = new PX2Other({
      scale: 0.02, // 缩放比例
      precision: 6, // 小数精度
      name: 'rem'
    });
    this.configTarget = yunjin.config.target;
    this.configSource = yunjin.config.source;
    // this.doc = '<span>全部</span><div></div>';
  }

  render() {
    const cssText = sql.getRunTimeInfoByKey('index.css').value;
    const indexcss = sass.compileString(cssText);
    // 压缩清除css
    const output = new CleanCSS({
      level: {
        1: {
          all: false, // 将所有值设置为 `false`
          tidySelectors: true // 打开优化选择器
        },
        2: {
          removeDuplicates: true,
          restructureRules: false,
          reduceNonAdjacent: true,
          removeDuplicateRules: true,
          removeEmpty: true
        }
      }
    }).minify(indexcss.css);

    const css = this.px2other.convert(output.styles);

    let outputFile = null;

    outputFile = path.resolve(yunjin.WORK_PATH, './' + this.configTarget.platform + '/' + this.configTarget.artboardName + '/' + this.configTarget.artboardName + this.configTarget.style.extName);
    fs.outputFileSync(outputFile, css);

    // html部分
    const aster = $(this.doc, {
      parseOptions: {
        language: 'html'
      }
    });
    const astResult = aster.replace('<div class="$_$1">$$$1</div>', '<div  class="$_$1">$$$1</div>')
      .replace('<img src="$_$1" class="$_$2"/>', '<img src="$_$1" class="$_$2"/>')
      .replace('<span class="$_$1">$$$1</span>', '<span  class="$_$1">$$$1</span>')
      .generate();

    const templatePath = path.resolve(__dirname, './template.art');
    const source = fs.readFileSync(templatePath).toString();
    if (yunjin.config.target.platform !== 'h5') {
      this.configTarget.style.pageDisplayPath = './';
    }
    const result = template.render(source, {
      content: (astResult), // this.doc,
      css: css,
      cssPath: path.join(this.configTarget.style.pageDisplayPath, yunjin.config.target.artboardName + this.configTarget.style.extName)
    }, {
      escape: false,
      minimize: false
    });

    if (yunjin.config.target.platform !== 'h5') {
      outputFile = path.resolve(yunjin.WORK_PATH, './' + this.configTarget.platform + '/' + this.configTarget.artboardName + '/' + this.configTarget.artboardName + '_preview.html');
    } else {
      outputFile = path.resolve(yunjin.WORK_PATH, './' + this.configTarget.platform + '/' + this.configTarget.artboardName + '/' + this.configTarget.artboardName + this.configTarget.page.extName);
    }
    fs.outputFileSync(outputFile, this.cleanHtml(result));
  }

  cleanHtml(data) {
    data = data.replace(/(\n[\s\t]*\r*\n)/g, '\n').replace(/^[\n\r\n\t]*|[\n\r\n\t]*$/g, '');
    // data = data.replace(/\r{2,}/, '');
    return format(data);
  }
};
