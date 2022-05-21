/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */

module.exports = class {
  constructor(layer = {}) {
    this.layer = layer;
  }

  checkType() {
    if (this.isShapePath()) {
      return 'path';
    }
    if (this.isText()) {
      return 'text';
    }
    if (this.isBitMap()) {
      return 'bitmap';
    }
    return 'div';
  }

  isShapePath() {
    if (this.layer.type === 'shapePath') {
      return true;
    }
    if (this.layer.type === 'rectangle') {
      if (!this.layer.path) {
        return false;
      }
      if (this.layer.path.startsWith('M0') && this.layer.path.endsWith('0Z')) {
        return false;
      }
      return true;
    }
    if (this.layer.type === 'oval') {
      return true;
    }
    return false;
    // return (layer.type === 'oval' && !layer.isCircle)
    //   || (layer.type === 'rectangle' && !layer.isRect)
    //   || (layer.path && layer.type === 'shapePath')
    //   || (parentLayer && parentLayer.type === 'shapeGroup' && parentLayer.childrens.length > 1);
  }

  isText() {
    if (this.layer.type === 'text') {
      return true;
    }
    return false;
  }

  isBitMap() {
    if (this.layer.type === 'bitmap') {
      return true;
    }
    return false;
  }
};
