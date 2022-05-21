/*
 * @Author: 左盐
 * @LastEditors: 左盐
 * @Des: 处理svg类
 */
const sharp = require('sharp');
const path = require('path');
const LayerType = require('./type');

module.exports = class {
  constructor(layer = {}, parent = {}, child = []) {
    this.layer = layer;
    this.parentLayer = parent;
    this.childLayer = child;
    this.svgHtml = '<img src="" />';
    this.$ = '';
    this.g = '';
  }

  getStyle(layerItem = {}, parent = {}) {
    const otherStyle = {
      color: layerItem.style.color,
      // 'background-image': layerItem.style.backgroundImage ? `url(${path.join(this.imagePath, layerItem.style.backgroundImage)}.png)` : null,
      // 'background-color': parent.style.backgroundColor,
      // background: layerItem.style.linearGradientString,
      'borderRadius': tools.getElementUnit(layerItem.style.borderRadius),
      'lineHeight': tools.getElementUnit(layerItem.style.lineHeight) || 'normal',
      'marginTop': tools.getElementUnit(layerItem.style.marginTop),
      'fontSize': tools.getElementUnit(layerItem.style.fontSize),
      'borderColor': layerItem.style.borderColor,
      'borderWidth': tools.getElementUnit(layerItem.style.borderWidth),
      'borderStyle': layerItem.style.borderStyle,
      'boxShadow': layerItem.style.boxShadow,
      '-webkit-text-stroke-width': tools.getElementUnit(layerItem.style.textStrokeWidth),
      '-webkit-text-stroke-color': tools.getElementUnit(layerItem.style.textStrokeColor)
    };
    const {
      width
    } = layerItem.frame;
    const {
      height
    } = layerItem.frame;

    const frameStyle = {
      width: tools.getElementUnit(width),
      height: tools.getElementUnit(height),
      transform: layerItem.style.transform ? layerItem.style.transform.join(' ') : null,
      'box-shadow': layerItem.style.boxShadow,
      background: layerItem.style.linearGradientString,
      opacity: layerItem.style.opacity
    };
    const style = {
      ...frameStyle,
      ...otherStyle
    };
    return style;
  }

  getHtml() {
    const style = this.getStyle(this.layer, this.parentLayer);
    const svg = `
      <svg id="${this.layer.id}" version="1.1" xmlns="http://www.w3.org/2000/svg" class="${this.layer.className}"  style="${tools.getStyleString(style)}}" >
        <path d="${this.layer.path}" />
      </svg>`;
    return svg;
  }
};
