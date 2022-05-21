const fs = require('fs-extra');
const path = require('path');
const Fontmin = require('fontmin');
const fontmanager = require('fontmanager-redux');
const chalk = require('chalk');

module.exports = class {
  constructor(inputFontsName = [], silence = false) {
    this.inputFontsName = inputFontsName;
    this.silence = silence;
    this.srcFontsName = [];
    this.ignoreFonts = ['PingFangSC-', 'PingFang SC', 'Microsoft Yahei', '微软雅黑']; // 忽略检测的字体名称
    this.srcFontsPath = [];
    this.lostFonts = []; // 缺失的字体
    this.fontSavePath = path.resolve(yunjin.WORK_PATH, './.runtime/fonts');
    this.fontSrcSavePath = path.resolve(yunjin.WORK_PATH, './.runtime/fonts/src'); // 原始文件存放目录
    fs.ensureDirSync(this.fontSrcSavePath);
  }

  format() {
    this._formatSrcFontsName();
    this._findSystemFont();
    this._generateChromeFont();
    if (!this.silence && this.lostFonts.length > 0) {
      console.log(chalk.red.bold('\n字体缺失：' + this.lostFonts.join(',')));
      console.log(chalk.red.bold('字体缺失会影响页面还原度，请尽快安装字体'));
      console.log(chalk.red.bold('请使用已获得版权的字体，避免法律纠纷'));
    }
  }

  // merger字体和去除忽略字体
  _formatSrcFontsName() {
    const fontsInfo = [];
    const fontName = [];
    for (const item of this.inputFontsName) {
      const index = fontName.indexOf(item.fontFamily);
      if (index > -1) {
        fontsInfo[index].text += item.text;
      } else {
        fontName.push(item.fontFamily);
        fontsInfo.push(item);
      }
    }
    for (let len = fontsInfo.length, i = len - 1; i >= 0; i--) {
      const item = fontsInfo[i];
      for (let j = 0, jlen = this.ignoreFonts.length; j < jlen; j++) {
        if (item.fontFamily.startsWith(this.ignoreFonts[j])) {
          fontsInfo.splice(i, 1);
          break;
        }
      }
    }
    this.srcFontsName = fontsInfo;
  }

  // 查找系统是否存在字体
  _findSystemFont() {
    this.srcFontPath = [];
    this.lostFonts = [];
    for (let i = 0, len = this.srcFontsName.length; i < len; i++) {
      const item = this.srcFontsName[i];
      let fonter = fontmanager.findFontsSync({
        postscriptName: item.fontFamily
      });
      if (fonter.length === 0) {
        fonter = fontmanager.findFontsSync({
          family: item.fontFamily
        });
      }
      if (fonter.length > 0) {
        fonter[0].fontFamily = item.fontFamily;
        fonter[0].text = item.text;
        this.srcFontsPath.push(fonter[0]);
      } else {
        this.lostFonts.push(item.fontFamily);
      }
    }
  }

  // 生成webfont
  _generateChromeFont() {
    fs.writeFileSync(path.resolve(this.fontSavePath, './fontface.css'), '');
    let fontFace = ``;
    for (const item of this.srcFontsPath) {
      fs.copySync(item.path, path.resolve(this.fontSrcSavePath, './' + item.fontFamily + '.ttf'));
      const fontmin = new Fontmin()
        .use(Fontmin.glyph({
          text: item.text,
          hinting: false // keep ttf hint info (fpgm, prep, cvt). default = true
        }))
        .use(Fontmin.ttf2woff({
          deflate: true // deflate woff. default = false
        }))
        .src(path.resolve(this.fontSrcSavePath, './' + item.fontFamily + '.ttf'))
        .dest(this.fontSavePath);

      fontmin.run(async(err, files) => {
        if (err) {
          throw err;
        } else { // 生成font-face
          await tools.sleep(100);
          fontFace += `  @font-face {
            font-family: "${item.fontFamily}";
            src: url('data:application/font-woff;base64,${fs.readFileSync(path.resolve(this.fontSavePath, './' + item.fontFamily + '.woff')).toString('base64')}')
          }\n`;
          fs.appendFileSync(path.resolve(this.fontSavePath, './fontface.css'), fontFace.toString());
        }
      });
    }
  }
};
