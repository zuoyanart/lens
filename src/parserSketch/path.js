/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */
module.exports = class {
  constructor(layer = {}, position = false) {
    this.layer = layer;
    this.position = position; // 是否相对于父对象计算路径
  }

  parse() {
    // if (!this.layer.path) {
    //   return null;
    // }
    // let path = this.layer.path;
    const path = this.layer;
    if (!path.points || !path.points.length) {
      return null;
    }
    const {
      x,
      y
    } = this.getXY(path.points[0].point, this.layer);

    let ret = `M${this.toS(x)},${this.toS(y)}`;
    const n = path['isClosed'] ? path.points.length + 1 : path.points.length;
    for (let i = 1; i < n; ++i) {
      let now = i;
      if (now === path.points.length) {
        now = 0;
      }
      const prev = (i - 1);
      const {
        x: x1,
        y: y1
      } = this.getXY(path.points[prev].curveFrom, this.layer);
      const {
        x: x2,
        y: y2
      } = this.getXY(path.points[now].curveTo, this.layer);
      const {
        x,
        y
      } = this.getXY(path.points[now].point, this.layer);

      if (!path.points[now].hasCurveTo && !path.points[now].hasCurveFrom) {
        ret += `L${this.toS(x)},${this.toS(y)}`;
      } else {
        ret += `C${this.toS(x1)},${this.toS(y1)} ${this.toS(x2)},${this.toS(y2)} ${this.toS(x)},${this.toS(y)}`;
      }
    }

    if (path['isClosed']) {
      ret += 'Z';
    }
    return ret;
  }

  toS(a) {
    return Number(a).toFixed(6).replace(/\.?0+$/, '');
  }

  s2p(s) {
    const [x, y] = s.substr(1, s.length - 2).split(',').map(Number);
    return {
      x,
      y
    };
  }
  getXY(s, layer) {
    let {
      x,
      y
    } = this.s2p(s);
    x = layer.frame.width * x;
    y = layer.frame.height * y;
    if (this.position === true) {
      x = x + layer.frame.svgX;
      y = y + layer.frame.svgY;
    }
    return {
      x,
      y
    };
  }
};
