/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */

const fs = require('fs-extra');
const path = require('path');
const SqlJs = require('../../tools/sql.js');

module.exports = class {
  constructor(layer = {}, layerParent) {
    this.layer = layer;
    this.layerParent = layerParent;
    this.imagePath = '';
  }

  getStyle() {
    const fontStyle = this.layer.style;
    // delete fontStyle.paddingTop;

    fontStyle.backgroundImage = this.layer.style.backgroundImage ? `url(${path.join(this.imagePath, this.layer.style.backgroundImage).replace(/\\/g, '/')})` : null;
    fontStyle.backgroundRepeat = this.layer.style.backgroundRepeat;
    fontStyle.backgroundSize = this.layer.style.backgroundImage ? 'contain' : null;
    fontStyle.backgroundColor = this.layer.style.backgroundColor;

    fontStyle.paddingTop = tools.getElementUnit(this.layer.style.paddingTop);
    fontStyle.marginTop = tools.getElementUnit(this.layer.style.marginTop);
    fontStyle.marginLeft = tools.getElementUnit(this.layer.style.marginLeft);
    fontStyle.width = tools.getElementUnit(this.layer.frame.width);
    fontStyle.height = tools.getElementUnit(this.layer.frame.height);
    // fontStyle.position = fontStyle.position;
    fontStyle.left = tools.getElementUnit(fontStyle.left);
    fontStyle.top = tools.getElementUnit(fontStyle.top);
    // return tools.objectToLine(fontStyle);
    delete fontStyle.justifyContent;
    if (fontStyle.borderColor === 'transparent') {
      delete fontStyle.borderWidth;
      delete fontStyle.borderStyle;
      delete fontStyle.borderColor;
    }
    if (this.layer.style.backgroundImage) {
      try {
        const imgName = this.layer.style.backgroundImage.split('/').pop();
        fs.ensureDirSync(path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images'));

        fs.copyFileSync(path.resolve(yunjin.WORK_RUNTIME_UIDSL, `./${this.layer.style.backgroundImage}`), path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images' + '/' + imgName));
      } catch (e) {
        // console.log('copyFileSync-e', e);
      }
    }
    return fontStyle;
  }

  async getHtml() {
    const stmt = db.prepare(`SELECT [index],tag,className,subClassName,subStyle from layers where id ='${this.layer.id}'`.toString());
    const layerInfo = stmt.get();
    if (layerInfo) {
      let isGenerateCss = false;
      if (layerInfo.tag.indexOf(',list_') > -1 && layerInfo.tag.indexOf('$') === -1) {
        if (layerInfo.index === 1) {
          isGenerateCss = true;
        } else {
          isGenerateCss = false;
        }
      } else {
        isGenerateCss = true;
      }
      if (isGenerateCss) {
        const style = this.getStyle();
        if (this.layer.layout === 'column') {
          style.display = 'block';
        }
        const parentClassName = await SqlJs.getCssSrc(this.layer.id);
        yunjin.indexcss += `${parentClassName}.${this.layer.className}{${tools.getStyleString(style)}}`;
        const stmt = db.prepare(`SELECT [index],tag,subClassName,subStyle from layers where className ='${layerInfo.className}' and subClassName !=''`.toString());
        const layerList = stmt.all();

        let styleStr = '';
        for (const item of layerList) {
          styleStr += parentClassName + '.' + item.subClassName + ' {' + tools.getStyleString(JSON.parse(item.subStyle)) + '}\n';
        }
        yunjin.indexcss += styleStr;
        try {
          const imgName = this.layer.image.split('/').pop();
          if (imgName.indexOf(this.layer.id) === -1) {
            fs.ensureDirSync(path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images'));
            fs.copyFileSync(path.resolve(yunjin.WORK_RUNTIME_UIDSL, `./${this.layer.image}`), path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images' + '/' + imgName));
          }
        } catch (e) {
          // console.log('copyFileSync-e', e);
        }
      }
      if (layerInfo.subClassName) {
        this.layer.className += ' ' + layerInfo.subClassName;
      }
    }

    return `<img id="${this.layer.id}" class="${this.layer.className}" type="${this.layer.type}" layout="${this.layer.layout}" centerY="${this.layer.frame.centerY}" y="${this.layer.frame.y}"  centerX="${this.layer.frame.centerX}" x="${this.layer.frame.x}" src="${this.layer.image}"/>`;
  }
};
