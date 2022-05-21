/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */
const {
  v4: uuidv4
} = require('uuid');
const crypto = require('crypto'); // 引入crypto加密模块
const fs = require('fs-extra');
const path = require('path');
const realDeepClone = require('rfdc')();
const {
  deepEqual
} = require('fast-equals');
const superAgent = require('superagent');
const chalk = require('chalk');

module.exports = class {
  constructor(platform = '', artboardName = '') {
    this.platform = platform;
    this.artboardName = artboardName;
  }

  getConfig() {
    const configFile = path.resolve(yunjin.WORK_PATH, './.yunjinrc.js');
    try {
      const mode = fs.accessSync(configFile, fs.constants.R_OK);
      return require(configFile);
    } catch (e) {
      return require(path.resolve(yunjin.ROOT_PATH, './.yunjinrc'));
    }
  }

  // sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  md5(str) {
    const hex = crypto.createHash('md5').update(str).digest('hex');
    return hex;
  }
  /**
   *  发送api请求
   * @param {*} url
   * @param {*} method
   * @param {*} data
   * @param {*} option
   * @returns
   */
  async httpAgent(url, method = 'get', data = {}, option = {}) {
    const defOption = {
      dataType: 'json'
    };
    option = Object.assign(defOption, option);
    // data = this.formatParams(data);

    // if (this.config.apiUrl) {
    url = 'http://lensapi.zuoyanit.com' + url;
    // }

    method = method.toLowerCase();
    const header = {
      'Content-Type': 'application/json'
    };

    if (method === 'get' || method === 'del') {
      try {
        const res = await superAgent[method].call(this, url)
          .timeout({
            response: 1000 * 50,
            deadline: 1000 * 100
          })
          .query(data)
          .set(header);

        if (res.body.code >= 200 && res.body.code < 400) {
          return res.body;
        } else if (res.body.code === 401) {
          console.log(chalk.red.bold('数据格式不合法'));
          return res.body;
        } else {
          console.log(chalk.red.bold(res.body.msg || '未知错误'));
          return res.body;
        }
      } catch (e) {
        return {
          code: 500,
          data: {},
          msg: e.message
        };
      }
    } else {
      try {
        const res = await superAgent[method].call(this, url)
          .timeout({
            response: 1000 * 50,
            deadline: 1000 * 100
          })
          .send(data)
          .set(header);

        if (res.body.code >= 200 && res.body.code < 400) {
          return res.body;
        } else if (res.body.code === 401) {
          console.log(chalk.red.bold('数据格式不合法'));
          return res.body;
        } else {
          console.log(chalk.red.bold(res.body.msg || '未知错误'));
          return res.body;
        }
      } catch (e) {
        return {
          code: 500,
          data: {},
          msg: e.message
        };
      }
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(path = '') {
    try {
      const doc = await this.httpAgent('/api1/lens/uploadToken', 'get');
      if (doc.code === 200) {
        try {
          const uploadInfo = await superAgent.post('http://up-z1.qiniup.com/')
            .attach('file', path)
            .field('key', doc.data.key)
            .field('token', doc.data.token);
          if (uploadInfo.statusCode === 200) {
            // console.log('uploadInfo', uploadInfo.body);
            return uploadInfo.body;
          }
        } catch (e) {
          console.log('e', e.response.body);
          return false;
        }
      }
      return false;
    } catch (e) {
      console.log('e', e);
      return false;
    }
  }
  /**
   * 深度拷贝
   * @param {*} obj
   * @returns
   */
  deepClone(obj = {}) {
    return realDeepClone(obj);
  }

  objEquals(a = {}, b = {}) {
    return deepEqual(a, b);
  }

  uuid() {
    return uuidv4().toUpperCase();
  }

  pageInfo() {
    return {
      platform: this.platform,
      artboardName: this.artboardName
    };
  }

  /**
   * 生成 rgba 颜色值
   * @param color
   * @returns {string}
   */
  colorParser(color) {
    return `rgba(${(color.red * 255).toFixed()},${(color.green * 255).toFixed()},${(color.blue * 255).toFixed()},${color.alpha === undefined ? 1 : color.alpha})`;
  }

  /**
   * 是否正方形
   * @param p1
   * @param p2
   * @param p3
   * @param p4
   * @returns {boolean}
   */
  isSquare(p1, p2, p3, p4) {
    const distSq = (p, q) => (p.x - q.x) * (p.x - q.x) +
      (p.y - q.y) * (p.y - q.y);
    const d2 = distSq(p1, p2); // from p1 to p2
    const d3 = distSq(p1, p3); // from p1 to p3
    const d4 = distSq(p1, p4); // from p1 to p4
    const s1 = distSq(p1, p2);
    const s2 = distSq(p2, p3);
    const s3 = distSq(p3, p4);
    const s4 = distSq(p4, p1);

    const allSidesSame = s1 === s2 && s2 === s3 && s3 === s4;
    // If lengths if (p1, p2) and (p1, p3) are same, then
    // following conditions must met to form a square.
    // 1) Square of length of (p1, p4) is same as twice
    //    the square of (p1, p2)
    // 2) p4 is at same distance from p2 and p3
    if (d2 == d3 && 2 * d2 == d4) {
      const d = distSq(p2, p4);
      return (d == distSq(p3, p4) && d == d2);
    }

    if (d3 == d4 && 2 * d3 == d2) {
      const d = distSq(p2, p3);
      return (d == distSq(p2, p4) && d == d3);
    }
    if (d2 == d4 && 2 * d2 == d3) {
      const d = distSq(p2, p3);
      return (d == distSq(p3, p4) && d == d2);
    }

    return false;
  }

  /**
   * 是否是正方形图层
   * @param layer
   * @returns {*}
   */
  isSqu(layer) {
    if (layer.points.length !== 4) {
      return false;
    }
    const rectPoints = layer.points.map((x) => this.toPoint(x.point, layer));
    const isSquare = this.isSquare(rectPoints[0], rectPoints[1], rectPoints[2], rectPoints[3]);
    return isSquare;
  }

  /**
   * 是否是圆形
   * @param layer
   * @returns {boolean}
   */
  isCircle(layer) {
    if (!layer.points || layer.points.length !== 4) {
      return false;
    }
    const isSquare = this.isSqu(layer);
    const hasCurveTo = layer.points.filter((x) => x.hasCurveTo === true).length === 4;
    if (isSquare && hasCurveTo) {
      return true;
    }
    return false;
  }

  /**
   * 是否是长方形
   * @param layer
   * @returns {*}
   */
  isRect(layer) {
    const {
      path
    } = layer;
    if (!path) {
      return false;
    }
    if (path.points.length !== 4) {
      return false;
    }
    const rectPoints = path.points.map((x) => this.toPoint(x.point, layer));
    if (rectPoints.length === 4) {
      const isRect = this.IsRectangleAnyOrder(rectPoints[0], rectPoints[1], rectPoints[2], rectPoints[3]);
      const hasCurveTo = path.points.filter((x) => x.hasCurveTo === true).length > 0;
      return isRect && !hasCurveTo;
    }
    return false;
  }

  IsRectangleAnyOrder(a, b, c, d) {
    return this.IsRectangle(a, b, c, d) || this.IsRectangle(b, c, a, d) || this.IsRectangle(c, a, b, d);
  }

  IsRectangle(a, b, c, d) {
    return this.IsOrthogonal(a, b, c) && this.IsOrthogonal(b, c, d) && this.IsOrthogonal(c, d, a);
  }

  IsOrthogonal(a, b, c) {
    return (b.x - a.x) * (b.x - c.x) + (b.y - a.y) * (b.y - c.y) === 0;
  }

  /**
   * 比例转换成具体位置
   * @param p
   * @param layer
   * @returns {{x: number, y: number}}
   */
  toPoint(p, layer) {
    const coords = {
      x: 0,
      y: 0
    };
    let refWidth = 1;
    let refHeight = 1;
    if (layer) {
      refWidth = layer.frame.width;
      refHeight = layer.frame.height;
    }
    p = p.substring(1);
    p = p.substring(0, p.length - 1);
    p = p.split(',');

    return {
      x: Number(p[0].trim()) * refWidth,
      y: Number(p[1].trim()) * refHeight
    };
  }

  /**
   * 序列化 style
   * @param style
   * @returns {Array}
   */
  getStyleString(style) {
    let styleString = [];
    for (const i in style) {
      if (style[i] !== null && style[i] !== undefined) {
        styleString.push(`${i.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${style[i]}`);
      }
    }
    styleString = styleString.join(';');
    return styleString;
  }

  /**
   * 生成元素单位
   * @param {*} value
   * @returns
   */
  getElementUnit(value) {
    if (value === undefined || value === null) {
      return null;
    }

    const valueType = typeof value;
    if (valueType === 'number') {
      return value + 'px';
    }

    value = value.split(' ');
    for (let i = 0; i < value.length; i++) {
      const valueResult = parseFloat(value[i]);
      if (valueResult >= 0) {
        value[i] += 'px';
      } else if (value === 'auto') {
        // value[i] = value[i];
      }
    }
    return value.join(' ');
  }

  // 驼峰转换下划线
  toLine(name) {
    return name.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  objectToLine(obj) {
    const keys = Object.keys(obj);
    const result = {};
    for (let i = 0, len = keys.length; i < len; i++) {
      result[this.toLine(keys[i])] = obj[keys[i]];
    }
    return result;
  }

  // cli loading
  async loading(text = 'loading') {
    const ora = await import('ora');
    const spinner = ora.default({
      text,
      indent: 1
    }).start();
    return spinner;
  }
  // 获取所有非绝对定位的子元素
  getNoAbsoluteLayers(layer = {}) {
    if (!layer) {
      return [];
    }
    const layers = layer.layers || [];
    const noAbsoluteLayers = [];
    for (let i = 0, len = layers.length; i < len; i++) {
      if (layers[i].style.position !== 'absolute') {
        noAbsoluteLayers.push(layers[i]);
      }
    }
    return noAbsoluteLayers;
  }

  // 计算灯光从水平方向照射的投影
  projectionX(layer = {}) {
    if (!layer) {
      return [];
    }
    const {
      layers
    } = layer;

    if (!layers || layers.length === 0) {
      return [];
    }

    const projectionArray = [];
    for (const item of layers) {
      if (item.style.position === 'absolute') {
        continue;
      }
      projectionArray.push([item.frame.y, item.frame.y + item.frame.height]);
    }
    if (projectionArray.length === 0) {
      return [];
    }
    // 区间合并算法
    // 按照起始位置排序
    projectionArray.sort((a, b) => a[0] - b[0]);
    const result = [projectionArray[0]];

    for (let i = 1, len = projectionArray.length; i < len; i += 1) {
      const item = projectionArray[i];
      const last = result[result.length - 1];
      if (item[0] <= last[1]) {
        last[1] = Math.max(last[1], item[1]);
      } else {
        result.push(item);
      }
    }
    return result;
  }

  // 计算灯光从垂直方向照射的投影
  projectionY(layer = {}) {
    if (!layer) {
      return [];
    }
    const {
      layers
    } = layer;
    if (!layers || layers.length === 0) {
      return [];
    }
    const projectionArray = [];
    for (const item of layers) {
      if (item.style.position === 'absolute') {
        continue;
      }
      projectionArray.push([item.frame.x, item.frame.x + this.getWidth(item)]);
    }
    // 区间合并算法
    // 按照起始位置排序
    projectionArray.sort((a, b) => a[0] - b[0]);
    const result = [projectionArray[0]];

    for (let i = 1, len = projectionArray.length; i < len; i += 1) {
      const item = projectionArray[i];
      const last = result[result.length - 1];
      if (item[0] <= last[1]) {
        last[1] = Math.max(last[1], item[1]);
      } else {
        result.push(item);
      }
    }
    return result;
  }

  getWidth(layer = {}) {
    return layer.frame.width || layer.frame.designWidth;
  }

  getHeight(layer = {}) {
    return layer.frame.height || layer.frame.designHeight;
  }
  // layer是否有边界
  isBorderLimit(layer = {}) {
    if (layer?.style) {
      if (layer.style.borderColor || layer.style.borderTopColor || layer.style.borderRightColor || layer.style.borderBottomColor || layer.style.borderLeftColor || layer.style.backgroundColor || layer.style.backgroundImage || layer.style.borderRadius) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
};
