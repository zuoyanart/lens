/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */
const path = require('path');
const fs = require('fs-extra');
const SqlJs = require('../../tools/sql.js');

module.exports = class {
  constructor(layer = {}, layerParent) {
    this.layer = layer;
    this.layerParent = layerParent;
    this.imagePath = '';
  }

  getStyle() {
    const otherStyle = {
      position: this.layer.style.position,
      top: tools.getElementUnit(this.layer.style.top),
      bottom: tools.getElementUnit(this.layer.style.bottom),
      left: tools.getElementUnit(this.layer.style.left),
      right: tools.getElementUnit(this.layer.style.right),
      zIndex: this.layer.style.zIndex,
      color: this.layer.style.color,
      'backgroundImage': this.layer.style.backgroundImage ? `url(${path.join(this.imagePath, this.layer.style.backgroundImage).replace(/\\/g, '/')})` : null,
      'backgroundRepeat': this.layer.style.backgroundRepeat,
      'backgroundSize': this.layer.style.backgroundImage ? 'contain' : null,
      'backgroundColor': this.layer.style.backgroundColor,
      'background': this.layer.style.linearGradientString,
      'borderRadius': tools.getElementUnit(this.layer.style.borderRadius),
      'borderColor': this.layer.style.borderColor,
      'borderWidth': tools.getElementUnit(this.layer.style.borderWidth),
      'borderStyle': this.layer.style.borderStyle,

      'borderLeftColor': this.layer.style.borderLeftColor,
      'borderLeftWidth': tools.getElementUnit(this.layer.style.borderLeftWidth),
      'borderLeftStyle': this.layer.style.borderLeftStyle,

      'borderRightColor': this.layer.style.borderRightColor,
      'borderRightWidth': tools.getElementUnit(this.layer.style.borderRightWidth),
      'borderRightStyle': this.layer.style.borderRightStyle,

      'borderTopWidth': tools.getElementUnit(this.layer.style.borderTopWidth),
      'borderTopStyle': this.layer.style.borderTopStyle,
      'borderTopColor': this.layer.style.borderTopColor,

      'borderBottomWidth': tools.getElementUnit(this.layer.style.borderBottomWidth),
      'borderBottomStyle': this.layer.style.borderBottomStyle,
      'borderBottomColor': this.layer.style.borderBottomColor,

      'boxShadow': this.layer.style.boxShadow,
      'marginTop': tools.getElementUnit(this.layer.style.marginTop),
      'marginLeft': tools.getElementUnit(this.layer.style.marginLeft),
      'marginRight': tools.getElementUnit(this.layer.style.marginRight),
      'marginBottom': tools.getElementUnit(this.layer.style.marginBottom),
      'paddingRight': tools.getElementUnit(this.layer.style.paddingRight),
      'paddingLeft': tools.getElementUnit(this.layer.style.paddingLeft),
      'paddingTop': tools.getElementUnit(this.layer.style.paddingTop),
      'paddingBottom': tools.getElementUnit(this.layer.style.paddingBottom),
      'display': this.layer.style.display,
      'flex': this.layer.style.flex,
      'alignItems': this.layer.style.alignItems,
      'justifyContent': this.layer.style.justifyContent,
      'flexDirection': this.layer.style.flexDirection,
      'flexWrap': this.layer.style.flexWrap
    };

    if (this.layer.style.backgroundImage) {
      try {
        const imgName = this.layer.style.backgroundImage.split('/').pop();
        fs.ensureDirSync(path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images'));

        fs.copyFileSync(path.resolve(yunjin.WORK_RUNTIME_UIDSL, `./${this.layer.style.backgroundImage}`), path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images' + '/' + imgName));
      } catch (e) {
        // console.log('copyFileSync-e', e);
      }
    }

    // if (!otherStyle['border-width']) {
    //   otherStyle['border-top'] = '1px solid transparent';
    // }
    const frameStyle = {
      width: tools.getElementUnit(this.layer.style.width),
      height: tools.getElementUnit(this.layer.style.height),
      transform: this.layer.style.transform ? this.layer.style.transform.join(' ') : null,
      'box-shadow': this.layer.style.boxShadow,
      background: this.layer.style.linearGradientString,
      opacity: this.layer.style.opacity
    };

    const weiLeiStyle = {};
    for (const key in this.layer.style) {
      if (key.startsWith(':')) {
        weiLeiStyle['&' + key] = this.formatStyleLowerCase(this.formatWeiLei(this.layer.style[key]));
      }
    }

    const style = {
      ...frameStyle,
      ...otherStyle,
      ...weiLeiStyle
    };
    // this.checkHeight(style);
    return style;
  }

  formatWeiLei(style) {
    const otherStyle = {
      'marginRight': tools.getElementUnit(style.marginRight)
    };
    return otherStyle;
  }

  formatStyleLowerCase(style) {
    const newStyle = {};
    for (const key in style) {
      const tolineKey = tools.toLine(key);
      newStyle[tolineKey] = style[key];
      if (key !== tolineKey) {
        delete style[key];
      }
      if (newStyle[tolineKey] === null || newStyle[tolineKey] === undefined) {
        delete newStyle[tolineKey];
      }
    }
    delete newStyle.fonts;
    return newStyle;
  }

  checkHeight(style = {}) {
    const layers = this.layer.layers || [];
    const noAbsoluteLayers = [];
    let maxYHeight = 0;
    for (let i = 0, len = layers.length; i < len; i++) {
      if (layers[i].style.position !== 'absolute') {
        const maxYHeightItem = layers[i].frame.y + layers[i].frame.height;
        maxYHeight = maxYHeight > maxYHeightItem ? maxYHeight : maxYHeightItem;
        noAbsoluteLayers.push(layers[i]);
      }
    }
    const layersLen = noAbsoluteLayers.length;

    if (layersLen === 0) {
      return style;
    }
    if (style.backgroundImage) {
      return style;
    }
    if (layersLen === 1 && this.layerParent.id !== '123456') {
      if (noAbsoluteLayers[0].frame.width === this.layer.frame.width && noAbsoluteLayers[0].frame.height === this.layer.frame.height) { // 高宽一致，则清除背景色
        style.backgroundColor = null;
      }
      return style;
    }
    // 此种情况不能删除height
    if (style.alignItems === 'center' || this.layerParent.style?.display === 'flex') {
      return style;
    }
    // if (style.alignItems === 'center' && this.layerParent.id !== '123456') {
    //   if (this.layerParent.frame.width === this.layer.frame.width && this.layerParent.frame.height === this.layer.frame.height) { // 高宽一致，则清除背景色
    //     style.backgroundColor = null;
    //   }
    //   return style;
    // }

    // 计算padding
    const paddingBottom = this.layer.frame.y + this.layer.frame.height - maxYHeight;
    if (paddingBottom > 0) {
      style.paddingBottom = tools.getElementUnit(paddingBottom);
    }

    delete style.height;
    return style;
  }

  async getHtml(childString) {
    const {
      layer
    } = this;

    const style = this.getStyle();
    const parentClassName = await SqlJs.getCssSrc(this.layer.id);
    if (this.layer.classNameSub) {
      yunjin.indexcss += `${parentClassName}.${this.layer.classNameSub}{${tools.getStyleString(style)}}`;
    } else {
      yunjin.indexcss += `${parentClassName}.${this.layer.className}{${tools.getStyleString(style)}}`;
    }

    return `<div id="${layer.id}" layout="${layer.layout}" type="${layer.type}" class1="${layer.name}" class="${this.layer.className} ${this.layer.classNameSub || ''}"  centerY="${this.layer.frame.centerY}" y="${this.layer.frame.y}"  centerX="${this.layer.frame.centerX}" x="${this.layer.frame.x}" layerIndex="${this.layer.layerIndex}" width="${this.layer.frame.width}" height="${this.layer.frame.height}" includeText="${this.layer.d2cAttr.includeText}">
      ${childString}
    </div>`;
  }
};
