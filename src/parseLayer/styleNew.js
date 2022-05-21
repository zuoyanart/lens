/*
 * @Author: 左盐
 */
const fs = require('fs-extra');
const sharp = require('sharp');
const path = require('path');
const sql = require('../tools/sql');

module.exports = class {
  constructor(layerResult = []) {
    this.layerResult = JSON.parse(JSON.stringify(layerResult));
  }

  async format() {
    await this._parseSvg(this.layerResult[0].layers, this.layerResult[0]);
    sql.updateRunTimeInfoByKey('svgToPng', JSON.stringify(this.layerResult));
    return this.layerResult;
  }

  async _parseSvg(layers = [], parent = {}) {
    if (!layers) {
      return;
    }

    for (let i = 0, len = layers.length; i < len; i++) {
      let item = layers[i];
      // 如果图片内有子元素，则转换成div，图片转为背景
      if (item.type === 'bitmap' && item.layers?.length > 0) {
        item.style.backgroundImage = item.image;
        item.type = 'bitmap2div';
      }
      item = layers[i];
      if (this._isShapePath(item)) {
        if (tools.getWidth(item) !== tools.getWidth(parent) || item.frame.height !== parent.frame.height) {
          this._svgToPng(item); // item
        } else {
          this._svgToPng(item);
        }
      } else {
        await this._parseSvg(item.layers, item);
      }
    }
  }

  /**
   * svg to png
   */
  _svgToPng(layer = {}) {
    layer = tools.deepClone(layer);
    const {
      frame
    } = layer;
    if (!frame) {
      return;
    }
    frame.x = Math.floor(frame.x);
    frame.y = Math.floor(frame.y);
    frame.width = Math.ceil(tools.getWidth(layer));
    frame.height = Math.ceil(frame.height);
    if (frame.x < 0 || frame.y < 0 || frame.width <= 0 || frame.height <= 0) {
      return;
    }
    // 确保目录存在
    fs.ensureDirSync(path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images'));

    sharp(path.resolve(yunjin.WORK_RUNTIME_SNAPSHOT, './' + yunjin.config.target.artboardName + '.png'))
      .extract({
        left: frame.x * 2,
        top: frame.y * 2,
        width: frame.width * 2,
        height: frame.height * 2
      })
      .flatten(true)
      .resize({
        width: frame.width * 2,
        height: frame.height * 2
      })
      .toFile(path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images' + '/' + layer.id + '.png'), (err) => {
        if (err) {
          console.log('sharp error', yunjin.config.target.artboardName + '.png', err);
        }
        // Extract a region of the input image, saving in the same format.
      });

    if (!layer.type === 'bitmap' || true) {
      layer.layers = null;
    }
    layer.type = 'bitmap';
    layer.image = layer.image || `${yunjin.config.target.image.pageDisplayPath}/${layer.id}.png`;
  }

  // 是否是svg
  _isShapePath(layer = {}) {
    if (layer.type === 'svg') {
      return true;
    }
    return false;
  }
};
