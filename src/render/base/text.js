/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */
const SqlJs = require('../../tools/sql.js');

module.exports = class {
  constructor(layer = {}, layerParent) {
    this.layer = layer;
    this.layerParent = layerParent;
    this.subLabelClass = [];
  }

  getStyle() {
    const fontStyle = this.layer.style.font;
    fontStyle.position = this.layer.style.position;
    fontStyle.top = tools.getElementUnit(this.layer.style.top);
    fontStyle.bottom = tools.getElementUnit(this.layer.style.bottom);
    fontStyle.left = tools.getElementUnit(this.layer.style.left);
    fontStyle.right = tools.getElementUnit(this.layer.style.right);
    fontStyle.zIndex = this.layer.style.zIndex;
    fontStyle.fontSize = tools.getElementUnit(fontStyle.fontSize);
    fontStyle.marginTop = tools.getElementUnit(this.layer.style.marginTop);
    fontStyle.marginLeft = tools.getElementUnit(this.layer.style.marginLeft);
    fontStyle.marginRight = tools.getElementUnit(this.layer.style.marginRight);
    fontStyle.width = tools.getElementUnit(this.layer.style.width);
    fontStyle.height = tools.getElementUnit(this.layer.style.height);
    fontStyle.textAlign = this.layer.style.textAlign || this.layer.style.font.textAlign;
    fontStyle.lineHeight = fontStyle.lineHeight ? tools.getElementUnit(fontStyle.lineHeight) : null;
    fontStyle.fontFamily = null;
    fontStyle.letterSpacing = null;
    fontStyle.paddingTop = tools.getElementUnit(this.layer.style.paddingTop);
    fontStyle.paddingLeft = tools.getElementUnit(this.layer.style.paddingLeft);
    fontStyle.paddingRight = tools.getElementUnit(this.layer.style.paddingRight);
    fontStyle.paddingBottom = tools.getElementUnit(this.layer.style.paddingBottom);
    fontStyle.display = this.layer.style.display;
    fontStyle.alignItems = this.layer.style.alignItems;
    fontStyle.justifyContent = this.layer.style.justifyContent;
    fontStyle.backgroundColor = this.layer.style.backgroundColor;
    fontStyle.borderRadius = tools.getElementUnit(this.layer.style.borderRadius);

    for (const item of fontStyle.fonts) {
      item.fontSize = tools.getElementUnit(item.fontSize);
      item.textAlign = null;
      item.lineHeight = item.lineHeight ? tools.getElementUnit(item.lineHeight) : null;
      // item.fontFamily = null;
      item.letterSpacing = item.letterSpacing ? tools.getElementUnit(item.letterSpacing) : null;
    }
    return fontStyle;
  }

  checkHeight(style = {}) {
    const layers = this.layer.layers || [];
    const layersLen = layers.length;
    if (layersLen === 1) {
      return style;
    }
    if (style.alignItems === 'center') {
      return style;
    }
    delete style.height;
    return style;
  }

  // 去重相同的子元素class
  checkClassEqual(style) {
    style = tools.deepClone(style);
    delete style.location;
    delete style.length;
    // 判断字重
    const fontWeightMap = {
      'thin': 100,
      'ultralight': 200,
      'extralight': 200,
      'light': 300,
      'normal': 'normal', // 400
      'regular': 'normal',
      'book': 'normal',
      'roman': 'normal',
      'medium': 500,
      'semibold': 600,
      'demibold': 600,
      'bold': 700,
      'ultrabold': 800,
      'extrabold': 800,
      'black': 800,
      'heavy': 900
    };
    const fontWeight = style.fontFamily.split('-').pop().toLowerCase();
    style.fontWeight = fontWeightMap[fontWeight] || null;
    // 移动端不需要指定字体
    delete style.fontFamily;

    let index = -1;
    for (let i = 0, len = this.subLabelClass.length; i < len; i++) {
      const item = this.subLabelClass[i];
      if (tools.objEquals(style, item)) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      this.subLabelClass.push(style);
      return this.layer.className + '_' + (this.subLabelClass.length - 1);
    }
    return this.layer.className + '_' + index;
  }

  // 格式化子文本的样式
  formatSubText(style) {
    let sSub = '';
    // 清除文字收尾换行
    this.layer.text = this.layer.text.replace(/(^\n*)|(\n*$)/ig, '');
    if (style.fonts.length > 1) {
      for (const item of style.fonts) {
        const itemStr = this.layer.text.substr(item.location, item.length).split('\n');
        for (let i = 0, len = itemStr.length; i < len; i++) {
          sSub += `<span class="${this.checkClassEqual(item)}">${itemStr[i]}</span>`;
          if (i < (len - 1)) {
            sSub += '<br/>';
          }
        }
      }
    } else {
      const itemStr = this.layer.text.split('\n');
      // const subStyle = this.checkClassEqual(style.fonts[0]);
      // this.layer.style.font.fontWeight = 400;// subStyle.fontWeight;
      if (itemStr.length > 1) {
        for (let i = 0, len = itemStr.length; i < len; i++) {
          sSub += `<span >${itemStr[i]}</span>`;
          if (i < (len - 1)) {
            sSub += '<br/>';
          }
        }
      } else {
        sSub += `${itemStr}`;
      }
    }
    let subClasses = '';
    for (let i = 0, len = this.subLabelClass.length; i < len; i++) {
      const item = this.subLabelClass[i];
      subClasses += `.${this.layer.className + '_' + i}{${tools.getStyleString(item)}}\n`;
    }
    return {
      sSub: sSub,
      subClass: subClasses
    };
  }

  async getHtml() {
    const style = this.getStyle();
    const styleClone = tools.deepClone(style);
    delete styleClone.fonts;
    const parentClassName = await SqlJs.getCssSrc(this.layer.id);

    const subText = this.formatSubText(style);
    let textClassName = this.layer.className;
    if (this.layer.classNameSub) {
      textClassName += ' ' + this.layer.classNameSub;
      yunjin.indexcss += `${parentClassName} .${this.layer.className},${this.layer.classNameSub}{${tools.getStyleString(styleClone)}}\n${subText.subClass}`;
    } else {
      yunjin.indexcss += `${parentClassName} .${this.layer.className}{${tools.getStyleString(styleClone)}}\n${subText.subClass}`;
    }

    if (this.layerParent.layout === 'column') {
      return `<div id="${this.layer.id}" class="${textClassName}"  centerY="${this.layer.frame.centerY}"  centerX="${this.layer.frame.centerX}" layerIndex="${this.layer.layerIndex}">${subText.sSub}</div>`;
    } else {
      return `<span id="${this.layer.id}"  class="${textClassName}"  layout="${this.layer.layout}" centerY="${this.layer.frame.centerY}" centerX="${this.layer.frame.centerX}" includeText="${this.layer.d2cAttr.includeText}">${subText.sSub}</span>`;
    }
  }
};
