/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pinyin = require('node-pinyin');
const StyleParser = require('./style');
const PathParser = require('./path');
const SvgToImg = require('./svgToImg');
const SketchToPng = require('./sketchToPng');
const sql = require('../tools/sql');

module.exports = class {
  constructor(sketch = {}) {
    this.sketch = sketch;
    this.element = [];
  }

  pageArtboard(artboardName = '') {
    const pages = this.sketch.pages[0];
    console.log(chalk.green(`画板数量${this.sketch.pages[0].layers.length}`));
    let artboard = null;
    if (artboardName) {
      for (const item of pages.layers) {
        if (item.name === artboardName) {
          artboard = [item];
          break;
        }
      }
    } else {
      artboard = pages.layers;
    }
    if (!artboard) {
      console.log(chalk.red(`找不到【${artboardName}】画板`));
      return [];
    }
    sql.updateRunTimeInfoByKey('sketchArtboard', JSON.stringify(artboard));
    return artboard;
  }
  // 根据SymbolInstance和SymbolMaster的尺寸比例，等比例转换symbolMaster的坐标尺寸，作为实例SymbolInstance的坐标尺寸。
  // 处理svg背景以及icon
  async parseSvg(artboard) {
    const sketchToPng = new SketchToPng(artboard);
    await sketchToPng.format();
    // throw new Error('asdasd');
    const svgToImg = new SvgToImg(artboard);
    await svgToImg.format();
  }

  async parse(artboard = {}) {
    this.element = [];
    await this.parseSvg(artboard);
    this.parseLayer(artboard);
    sql.updateRunTimeInfoByKey('sketchParse', JSON.stringify(this.element));
    return this.element;
  }

  parseLayer(item = {}, parent = {}) {
    this.element.push(this.parseItem(item, parent));

    if (item.isVisible === false) {
      item.layers = [];
    }
    if (item.layers) {
      item.layers.forEach((_item) => {
        const r = this.parseLayer(_item, item);
        if (r) {
          this.element.push(r);
        }
      });
    }
  }

  parseItem(layer = {}, parent = {}) {
    const result = {};
    result.id = layer.do_objectID;
    result.frame = layer.frame || {};
    if (parent && parent.frame) {
      result.frame.x += parent.frame.x;
      result.frame.y += parent.frame.y;
    }

    const styleParser = new StyleParser(layer.style, layer.attributedString, layer);
    result.style = styleParser.parse();
    const pathParser = new PathParser(layer);
    result.path = pathParser.parse();
    result.isVisible = layer.isVisible;
    let name = layer.name ? layer.name : '未命名';
    name = name.replace(/[\u4e00-\u9fa5]*/, (m) => pinyin(m, {
      style: 'normal'
    })).replace(/^([^a-z_A-Z])/, '_$1').replace(/[^a-z_A-Z0-9-]/g, '_');
    result.name = name;
    result.type = layer._class;

    if (layer.points && layer.points.length >= 4) { // 椭圆
      result.isCircle = tools.isCircle(layer);
      if (result.isCircle) { // 如果是个圆
        const p1 = tools.toPoint(layer.points[0].point, layer);
        const p2 = tools.toPoint(layer.points[1].point, layer);
        const p3 = tools.toPoint(layer.points[2].point, layer);
        const p4 = tools.toPoint(layer.points[3].point, layer);
        result.path = null;
        result.type = 'rect';
        result.style.borderRadius = Math.abs((p3.y - p1.y) / 2);
      }
    }
    result.isMask = !!layer.hasClippingMask;
    if (layer._class === 'rectangle') {
      result.isRect = tools.isRect(layer);
    }
    if (layer._class === 'text') {
      result.text = layer.attributedString.string || layer.name;
    }
    if (layer._class === 'bitmap') {
      result.image = `${layer.image._ref}`;
    }
    if (layer._class === 'artboard') {
      // result.frame.x = null;
      // result.frame.y = null;
      result.frame.x = 0;
      result.frame.y = 0;
    }
    if (layer.symbolID) {
      result.symbolID = layer.symbolID;
    }
    return result;
  }
};
