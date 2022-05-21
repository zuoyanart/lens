const {
  createSVGWindow
} = require('svgdom');
const window = createSVGWindow();
const document = window.document;
const {
  SVG,
  registerWindow
} = require('@svgdotjs/svg.js');
require('@svgdotjs/svg.filter.js');
registerWindow(window, document);

const path = require('path');
const fs = require('fs-extra');
const base64Img = require('base64-img');
const sharp = require('sharp');
// const CV = require('../parseLayer/cv.js');

const svgexport = require('../tools/svgexport');
const BigNumber = require('bignumber.js');

const PathParser = require('./path');
const StyleParser = require('./style');
const FontParser = require('./font');

module.exports = class {
  constructor(layerList = [], isAll = false) {
    this.originalLayerList = layerList;
    this.layerList = layerList.layers;
    this.isAll = isAll;
    // create canvas
    this.draw = null;
    this.svgNumber = 0;
    this.layerNumber = 0;
    this.svgexportJson = [];
    // this.fontList = [];//在sketch to Png中已经生成， 直接使用即可

    // https://developer.mozilla.org/zh-CN/docs/Web/CSS/mix-blend-mode
    // https://www.jianshu.com/p/ec2040bdfbfe
    this.blendModeMap = {
      0: 'normal',
      1: 'darken', // 变暗
      2: 'multiply', // 正片叠底
      3: 'color-burn', // 颜色加深
      4: 'lighten', // 变亮
      5: 'screen', // 滤色
      6: 'color-dodge', // 颜色减淡
      7: 'overlay', // 叠加
      8: 'soft-light', // 柔光
      9: 'hard-light', // 强光
      10: 'difference', // 差值
      11: 'exclusion', // 排除
      12: 'hue', // 色相
      13: 'saturation', // 饱和度
      14: 'color', // 颜色
      15: 'luminosity', // 明度
      16: 'darken', // 加深，//没有这个值，可能不正确
      17: 'lighten' // 变浅，//没有这个值，可能不正确
    };
    this.booleanOperation = {
      '默认': -1,
      '联合': 0,
      '减去顶层': 1,
      '交集': 2,
      '差集': 3
    };
    this.windingRule = {
      '减去顶层': 0,
      '差集': 1
    };
  }

  async format() {
    await this._formatChild(this.layerList, 1);
    // share无法识别关于css中的svg属性，暂时使用此方法做运行测试， 可能要优化puppter
    if (this.svgexportJson.length > 0) {
      const spinner = await tools.loading('智能切图');
      // const fontParser = new FontParser(this.fontList, true);
      // fontParser.format();
      await svgexport.render(this.svgexportJson, (err, res) => {
        if (err) {
          console.log('svgexport fail：' + err);
        }
      });
      spinner.succeed();
    }
  }

  async _formatChild(layerList, level = null) {
    for (let i = 0; i < layerList.length; i++) {
      const layer = layerList[i];
      if (layer.isVisible === false) {
        continue;
      }

      // 处理单个svg的情况
      if (layer._class.toLowerCase().indexOf('group') === -1) {
        // 判断什么类型的单个元素当成svg处理
        if (layer._class === 'shapePath' || this._isShapePathSingle(layer)) {
          // TODO:
        } else {
          if (level === 1 && layer.frame.x <= 10 && layer.frame.y <= 30 && layer.frame.height > 30 && layer.frame.width >= 375) {
            // TODO:
          }
          continue;
        }
      }

      this.svgNumber = 1;
      this.layerNumber = 1;
      this._forEachChildForNumber(layer);
      // 此处可能要加关于文字的判断
      if (this.svgNumber / this.layerNumber > 0.5) {
        this.draw = SVG(document.documentElement).size(layer.frame.width, layer.frame.height);
        // 清空画布，重新绘制
        this.draw.clear();
        await this._forEachChild(layer, 1);
        // 生成svg
        fs.ensureDirSync(path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images'));
        const svg = this.draw.svg();
        const targetSvgPath = path.resolve(yunjin.WORK_PATH, './' + yunjin.config.target.platform + '/' + yunjin.config.target.artboardName + '/images/' + layer.do_objectID + '');
        fs.writeFileSync(targetSvgPath + '.svg', svg.replace(/<br>/ig, '<br/>'));
        // svg导出png
        const range = this._computeLayerRange(layer);
        if (range.left === 0 && range.top === 0 && range.width === layer.frame.width && range.height === layer.frame.height) {
          this.svgexportJson.push({
            format: 'png',
            input: targetSvgPath + '.svg',
            output: targetSvgPath + '.png' + ' ' + ' 2x'
          });
        } else {
          this.svgexportJson.push({
            format: 'png',
            input: targetSvgPath + '.svg',
            output: targetSvgPath + '.png' + ' ' + range.left + ':' + range.top + ':' + range.width + ':' + range.height + ' 2x'
          });
        }
        // 重置layer属性
        layer._class = 'bitmap';
        layer.frame.x += range.left;
        layer.frame.y += range.top;
        layer.frame.width = range.width;
        layer.frame.height = range.height;
        layer.image = {
          '_ref': './images/' + layer.do_objectID + '.png'
        };
        layer.style = {};
        // 清除旋转
        layer.isFlippedHorizontal = 0;
        layer.isFlippedVertical = 0;
        layer.rotation = 0;
        // 清除圆角
        layer.fixedRadius = 0;
        // 清空所有子元素
        layer.layers = [];
        // 如果第一个子元素即为图片，则作为画板的背景图片
        // 然后删除此元素
        if (level === 1 && layer.frame.x <= 10 && layer.frame.y <= 30 && layer.frame.height > 30 && layer.frame.width >= 375) {
          if (!this.originalLayerList.style) {
            this.originalLayerList.style = {
              fills: [{
                isEnabled: true,
                image: {
                  '_ref': './images/' + layer.do_objectID + '.png'
                }
              }]
            };
          } else if (!this.originalLayerList.style.fills) {
            this.originalLayerList.style.fills = [{
              isEnabled: true,
              image: {
                '_ref': './images/' + layer.do_objectID + '.png'
              }
            }];
          } else if (this.originalLayerList.style.fills) {
            this.originalLayerList.style.fills.push({
              isEnabled: true,
              image: {
                '_ref': './images/' + layer.do_objectID + '.png'
              }
            });
          }
          layer.isVisible = false;
        }
      } else {
        if (layer.layers) {
          await this._formatChild(layer.layers);
        }
      }
    }
  }
  // 计算比例
  _forEachChildForNumber(layer = {}) {
    const layers = layer.layers || [];
    if (layer.isVisible === false) {
      return;
    }
    if (layer._class === 'shapeGroup') {
      const len = layers.length;
      this.svgNumber += len;
      this.layerNumber += len;
      return;
    } else if (layer._class === 'text') {
      // TODO: 添加艺术字的判断
      if (!this._isWordArt(layer)) {
        this.svgNumber += -100;
      }
    }

    for (const item of layers) {
      this._forEachChildChildForNumber(item);
    }
  }

  // 计算比例
  _forEachChildChildForNumber(layer = {}) {
    if (layer.isVisible === false) {
      return;
    }
    this.layerNumber++;
    if (this._isShapePath(layer)) {
      this.svgNumber++;
    }
    this._forEachChildForNumber(layer);
  }

  // 下钻
  async _forEachChild(layer, level = 0, drawInstances = this.draw) {
    if (layer.isVisible === false) {
      return;
    }
    if (level === 1) {
      layer.frame.svgX = 0;
      layer.frame.svgY = 0;
      drawInstances = await this._formatSvg(layer, drawInstances, 0);
    }
    this.checkIsIcon(layer);
    const layers = layer.layers || [];

    for (const item of layers) {
      if (layer._class.toLowerCase().indexOf('group') > -1) {
        item.frame.svgX = 0 + item.frame.x;
        item.frame.svgY = 0 + item.frame.y;
      }
      await this._child(item, 2, drawInstances, layers.length);
    }
    // for (let i = layers.length - 1; i >= 0; i--) {
    //   const item = layers[i];
    //   if (layer._class.toLowerCase().indexOf('group') > -1) {
    //     item.frame.svgX = 0 + item.frame.x;
    //     item.frame.svgY = 0 + item.frame.y;
    //   }
    //   this._child(item, 2, drawInstances);
    // }
  }

  async _child(layer, level = null, drawInstances = {}, layerLength = 1) {
    if (layer.isVisible === false) {
      return;
    }
    this.checkIsIcon(layer);
    drawInstances = await this._formatSvg(layer, drawInstances, layerLength);
    if (layer.layers) {
      await this._forEachChild(layer, 2, drawInstances);
    }
  }

  checkIsIcon(layer = {}) {
    const layers = layer.layers || [];
    const len = layers.length;
    if (len < 2) {
      return;
    }
    const layerArea = layer.frame.width * layer.frame.height;
    const layers1Area = layers[0].frame.width * layers[0].frame.height;
    const layersLastArea = layers[len - 1].frame.width * layers[len - 1].frame.height;
    if (layerArea / layers1Area < 0.98 && layerArea / layersLastArea < 0.98) {
      return;
    }

    let isIcon = true;
    for (const item of layers) {
      if (item._class === 'shapePath' && item.booleanOperation === -1) {
        // 计算style
        const styleParser = new StyleParser(item.style, item.attributedString, item);
        item.styleResult = styleParser.parse();
        const styleResultKeys = Object.keys(item.styleResult);

        if (styleResultKeys.length === 0 || (styleResultKeys.length === 1 && styleResultKeys.indexOf('borderRadius') > -1)) {
          isIcon = true;
          item.booleanOperation = 1;
        } else {
          isIcon = false;
          break;
        }
      } else {
        isIcon = false;
        break;
      }
    }
    if (isIcon) {
      layers.sort((a, b) => {
        const aArea = a.frame.width * a.frame.height;
        const bArea = b.frame.width * b.frame.height;
        if (aArea > bArea) {
          return -1;
        } if (aArea < bArea) {
          return 1;
        } else {
          return 0;
        }
      });
    }
  }

  async _formatSvg(layer = {}, draw = {}, layerLength = 0) {
    let drawInstances = draw;
    let isGroup = false;
    if (layer._class.toLowerCase().indexOf('group') > -1) {
      isGroup = true;
      drawInstances = draw.group();
      drawInstances.addClass(layer.do_objectID);
      drawInstances.transform({
        translateX: layer.frame.svgX,
        translateY: layer.frame.svgY
      });
    }
    // 计算style
    const styleParser = new StyleParser(layer.style, layer.attributedString, layer);
    layer.styleResult = styleParser.parse();
    // 计算path
    const borderGradient = this._borderGradient(layer.style, 'border', layer);
    if (borderGradient) {
      const layerClone = tools.deepClone(layer);
      if (borderGradient.position === 1) { // 内部填充
        layerClone.frame.svgX = layerClone.frame.svgX + borderGradient.thickness / 2;
        layerClone.frame.svgY = layerClone.frame.svgY + borderGradient.thickness / 2;
        layerClone.frame.width = layerClone.frame.width - borderGradient.thickness;
        layerClone.frame.height = layerClone.frame.height - borderGradient.thickness;
        const pathParser = new PathParser(layerClone, true);
        layer.path = pathParser.parse();
        // borderGradient.point1 = tools.toPoint(borderGradient.from, layerClone);
        // borderGradient.point2 = tools.toPoint(borderGradient.to, layerClone);
      } else if (borderGradient.position === 0) { // 中间填充
        const pathParser = new PathParser(layerClone, true);
        layer.path = pathParser.parse();
      } else { // 外部填充
        layerClone.frame.svgX = layerClone.frame.svgX - borderGradient.thickness / 2;
        layerClone.frame.svgY = layerClone.frame.svgY - borderGradient.thickness / 2;
        layerClone.frame.width = layerClone.frame.width + borderGradient.thickness;
        layerClone.frame.height = layerClone.frame.height + borderGradient.thickness;
        const pathParser = new PathParser(layerClone, true);
        layer.path = pathParser.parse();
      }
    } else {
      const pathParser = new PathParser(layer, true);
      layer.path = pathParser.parse();
    }

    if (layer.path) {
      const svgPath = drawInstances.path(layer.path).addClass(layer.do_objectID);
      await this._setSvgItemAttrbute(layer, borderGradient, svgPath);
      if (this._isClipPath(layer)) {
        const clip = this.draw.clip().add(svgPath.clone());
        drawInstances.clipWith(clip);
      }
      // 判断iconfont类型的svg，没有减去顶层的标记的问题
      // 只有路径才执行规则
      // console.log('path1', layer.name + ']', layer.booleanOperation, layer.windingRule, layer.style.windingRule);
      // if (layer._class === 'shapePath' && layer.booleanOperation > -1) {
      //   const styleResultKeys = Object.keys(layer.styleResult);

      //   if (styleResultKeys.length === 0 || (styleResultKeys.length === 1 && styleResultKeys.indexOf('borderRadius') > -1)) {
      //     // layer.booleanOperation = 3;// layer.style.windingRule === 1 ? 3 : 1;
      //   }
      // }
      // layer.booleanOperation = 1;
      if (layer.booleanOperation === 0) { // 联合
        const parentFill = svgPath.parent().attr('fill');
        if (parentFill && parentFill !== 'none') {
          svgPath.addClass(layer.do_objectID).attr('fill', svgPath.parent().attr('fill'));
        }
      } else if (layer.booleanOperation === 1) { // 减去顶层
        const position = svgPath.position();
        if (position === 0) {
          svgPath.addClass(layer.do_objectID).attr('fill', null);
          const svgPathClone = svgPath.clone().fill('#fff');
          const mask = this.draw.mask().add(svgPathClone).addClass('mask_' + layer.do_objectID);
          svgPath.maskWith(mask);
        } else {
          const maskClass = svgPath.parent().first().classes()[0];
          let mask = this.draw.findOne('.mask_' + maskClass);
          if (!mask) { // 未创建mask
            const previousEle = svgPath.parent().first();// .previous();
            previousEle.attr('fill', null);
            const previousEleClone = previousEle.clone().fill('#fff');
            mask = this.draw.mask().add(previousEleClone).addClass('mask_' + previousEle.classes[0]);
            previousEle.maskWith(mask);
          }
          const svgPathClone = svgPath.clone().fill('#000');// 获取上一个同级
          const maskChildLast = mask.last();// 获取上一个同级
          maskChildLast.after(svgPathClone);
          svgPath.remove();
        }
      } else if (layer.booleanOperation === 2) { // 交集
        const maskClass = svgPath.parent().classes()[0];
        let mask = this.draw.findOne('.mask_' + maskClass);
        if (!mask) {
          svgPath.addClass(layer.do_objectID).attr('fill', null);
          const svgPathClone = svgPath.clone().fill('#fff');
          mask = this.draw.mask().add(svgPathClone).addClass('mask_' + maskClass);
          svgPath.remove();
        } else {
          svgPath.attr('fill', null);
          svgPath.maskWith(mask);
        }
      } else if (layer.booleanOperation === 3) { // 差集
        const position = svgPath.position();
        svgPath.addClass(layer.do_objectID).attr('fill', null);
        const svgPathClone = svgPath.clone().fill('#fff');
        const mask = this.draw.mask().add(svgPathClone).addClass('mask_' + layer.do_objectID);
        svgPath.maskWith(mask);
        if (position > 0) {
          const previousEle = svgPath.parent().get(0);
          const previousEleClone = previousEle.clone().fill('#000').attr('mask', null);
          const maskPrevious = this.draw.findOne('.mask_' + previousEle.classes()[0]);
          mask.last().after(previousEleClone);
          maskPrevious.last().after(svgPath.clone().fill('#000').attr('mask', null));
        }
      }
    } else if (layer._class === 'bitmap') { // 图片
      const refImage = layer.image._ref;
      const imgPath = path.resolve(yunjin.WORK_RUNTIME_UIDSL, './' + refImage);
      const imageAsBase64 = base64Img.base64Sync(imgPath);

      const image = drawInstances.image(imageAsBase64);
      image.size(layer.frame.width, layer.frame.height).opacity(layer.styleResult.opacity);

      image.move(layer.frame.svgX, layer.frame.svgY);

      image.css({
        'mix-blend-mode': this.blendModeMap[layer.styleResult.blendMode]
      });
      await this._setSvgItemAttrbute(layer, borderGradient, image);
      if (this._isClipPath(layer)) {
        const clip = this.draw.clip().add(image);
        drawInstances.clipWith(clip);
      }
      // 处理图片填充+混合
      if (layer.styleResult.backgroundColor && layer.styleResult.backgroundBlendMode) { // && layer.styleResult.backgroundBlendMode
        const rect = drawInstances.rect(layer.frame.width, layer.frame.height);
        rect.move(layer.frame.svgX, layer.frame.svgY);
        rect.css({
          'mix-blend-mode': this.blendModeMap[layer.styleResult.backgroundBlendMode]
        });
        await this._setSvgItemAttrbute(layer, borderGradient, rect);
      }
      // 处理图片填充
      if (layer.styleResult.backgroundColor && !layer.styleResult.backgroundBlendMode) {
        const text = drawInstances.foreignObject(layer.frame.width + layer.frame.svgX, layer.frame.height + layer.frame.svgY);
        const s = `<body xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;">
        <div style="${this._formatSvgImgFillColor(layer, imageAsBase64)}">
        </div></body>`;
        text.add(SVG(s.toString()));
        image.opacity(1 - layer.styleResult.backgroundColor.split(',')[3].replace(')', ''));
        image.css({
          'mix-blend-mode': this.blendModeMap[12]
        });
      }
    } else if (layer._class === 'text') {
      // 处理文本
      // 如果是艺术字，则合并到svg中
      if (this._isWordArt(layer)) {
        // TODO: svg add text
        const text = drawInstances.foreignObject(layer.frame.width + layer.frame.svgX, layer.frame.height + layer.frame.svgY);

        const s = `<body xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;">
          <p style="${this._formatSvgTextStyle(layer)}">${(layer.attributedString.string || layer.name).replace(/\n/g, '<br />')}</p>
        </body>`;
        text.add(s.toString());
      }
    } else {
      await this._setSvgItemAttrbute(layer, borderGradient, drawInstances);
    }
    return drawInstances;
  }
  // 图片填充颜色
  _formatSvgImgFillColor(layer = {}, img = '') {
    const zoom = 1;
    let s = `background-color: ${layer.styleResult.backgroundColor};`;
    s += `width: ${layer.frame.width}px;`;
    s += `height: ${layer.frame.height}px;`;
    s += `-webkit-mask:  url(${img}) no-repeat;`;
    s += `padding:0;margin:${new BigNumber(layer.frame.svgY).div(zoom).toFixed(2)}px 0 0 ${new BigNumber(layer.frame.svgX).div(zoom).toFixed(2)}px;`;
    return s.toString();
  }
  // 处理字体样式
  _formatSvgTextStyle(layer = {}) {
    let s = ``;
    let zoom = 1;
    // chrome不支持小于12号的字
    if (layer.styleResult.font.fontSize < 12) {
      zoom = new BigNumber(layer.styleResult.font.fontSize).div(12).toFixed(6);
      s += `font-size:12px;`;
      s += `zoom: ${zoom};`;
    } else {
      s += `font-size:${layer.styleResult.font.fontSize}px;`;
    }

    s += `padding:0;margin:${new BigNumber(layer.frame.svgY).div(zoom).toFixed(2)}px 0 0 ${new BigNumber(layer.frame.svgX).div(zoom).toFixed(2)}px;`;

    s += `color:${layer.styleResult.font.color};`;
    s += `letter-spacing:${new BigNumber(layer.styleResult.font.letterSpacing).div(zoom).toFixed(2)}px;`;
    s += `text-align:${layer.styleResult.font.textAlign};`;
    s += `font-family:${layer.styleResult.font.fontFamily};`;
    if (layer.styleResult.font.lineHeight) {
      s += `line-height:${new BigNumber(layer.styleResult.font.lineHeight).div(zoom).toFixed(2)}px;`;
    }
    // 文字阴影
    if (layer.styleResult.boxShadow) {
      s += `text-shadow:${layer.styleResult.boxShadow}`;
    }
    return s;
  }

  // check是不是艺术字
  _isWordArt(layer = {}) {
    if (layer._class !== 'text') {
      return false;
    }
    const isArt = false;
    let styleResult = layer.styleResult;
    if (!styleResult) {
      const styleParser = new StyleParser(layer.style, layer.attributedString, layer);
      styleResult = styleParser.parse();
    }
    // 判断字体
    const fontFamily = styleResult.font.fontFamily;
    if (fontFamily) {
      let isFamily = false;
      const fontFamilyPrefix = ['PingFangSC', '微软雅黑', 'arial', 'JDZhengHT', 'DINAlternate', 'Arial'];
      for (let i = 0; i < fontFamilyPrefix.length; i++) {
        if (fontFamily.startsWith(fontFamilyPrefix[i])) {
          isFamily = true;
          break;
        }
      }
      if (isFamily === false) {
        return true;
      }
    }
    return isArt;
  }
  // 给svg元素设置样式
  // 图像相交方式没有处理
  async _setSvgItemAttrbute(layer = {}, borderGradient = null, svgInstance) {
    const svgElemParent = svgInstance.parent();
    // 需要新增其他判断
    if (layer.styleResult.transform) {
      for (let i = 0; i < layer.styleResult.transform.length; i++) {
        const item = layer.styleResult.transform[i];
        if (item.indexOf('rotateY(180deg)') > -1) {
          svgInstance.flip('x');
        } else if (item.indexOf('rotateX(180deg)') > -1) {
          svgInstance.flip('y');
        } else if (item.indexOf('rotate') > -1) {
          const deg = item.split('(')[1].replace('deg)', '');
          if (svgInstance.type === 'g') { // 分组
          // 按照中心点旋转
            if (svgElemParent.type !== 'svg') {
              svgInstance.rotate(deg, layer.frame.width / 2, layer.frame.height / 2);
            } else {
              const range = this._computeLayerRotateRange(layer, deg);
              this.draw.size(range.width, range.height);
              svgInstance.rotate(deg, layer.frame.width / 2, layer.frame.height / 2);
              svgInstance.translate(-range.left / 2, -range.top / 2);
            }
          } else {
          // 按照左上角旋转
            svgInstance.rotate(deg);
          }
        }
      }
    }
    // 处理圆角,只有矩形才有圆角
    if (layer.styleResult.borderRadius && layer._class.indexOf('rect') > -1) {
      let radius = layer.styleResult.borderRadius.toString().split(' ');
      // 补齐数组
      if (radius.length < 4) {
        for (let i = 4 - radius.length; i >= 0; i--) {
          radius.push('0');
        }
      }
      radius = radius.join('px ') + 'px';
      svgInstance.css('clip-path', 'inset(0 0 0 0 round ' + radius + ')');
    }
    // 处理描边
    const strokeObj = {};
    if (layer.styleResult.borderWidth) {
      strokeObj.width = layer.styleResult.borderWidth;
      const svgElemParent = svgInstance.parent();
      if (svgElemParent.type === 'svg' && svgElemParent.children().length === 1) {
        layer.frame.width += layer.styleResult.borderWidth;
        layer.frame.height += layer.styleResult.borderWidth;
        svgElemParent.size(layer.frame.width, layer.frame.height);
      }
    }
    if (layer.styleResult.borderColor) {
      strokeObj.color = layer.styleResult.borderColor;
    }

    svgInstance.stroke(strokeObj);
    if (borderGradient) {
      const linear = this.draw.gradient('linear', (add) => {
        for (const item of borderGradient.stop) {
          add.stop(item);
        }
      });
      linear.from(borderGradient.point1.x, borderGradient.point1.y).to(borderGradient.point2.x, borderGradient.point2.y);

      svgInstance.stroke({
        color: linear
      });
    }

    if (layer.styleResult.opacity >= 0) {
      svgInstance.opacity(layer.styleResult.opacity);
    }
    // 处理填充
    if (svgInstance.type === 'g') {
      svgInstance.fill('none');
    }
    const fillGradient = this._borderGradient(layer.style, 'fill', layer);
    if (fillGradient) {
      if (fillGradient.stop) {
        const linear = this.draw.gradient('linear', (add) => {
          for (const item of fillGradient.stop) {
            add.stop(item);
          }
        });
        linear.from(fillGradient.point1.x, fillGradient.point1.y).to(fillGradient.point2.x, fillGradient.point2.y);

        svgInstance.fill(linear);
      } else {
        const refImage = fillGradient.img;
        const imgPath = path.resolve(yunjin.WORK_RUNTIME_UIDSL, './' + refImage);
        const imageAsBase64 = base64Img.base64Sync(imgPath);
        let refImageWidth = layer.frame.width;
        let refImageHeight = layer.frame.height;
        if (fillGradient.type === 0) {
          const imageSharp = sharp(imgPath);
          const metaData = await imageSharp.metadata(); // 图片信息
          refImageWidth = metaData.width;
          refImageHeight = metaData.height;
        }

        const pattern = this.draw.pattern(layer.frame.width, layer.frame.height, async(add) => {
          add.image(imageAsBase64).size(refImageWidth, refImageHeight);
        }).move(layer.frame.svgX, layer.frame.svgY);
        svgInstance.fill(pattern);
      }
    }
    if (layer.styleResult.backgroundColor) {
      svgInstance.fill(layer.styleResult.backgroundColor);
    }
    // 处理模糊
    if (layer.style.blur) {
      if (layer.style.blur.isEnabled) {
        if (layer.style.blur.type === 0) { // 高斯模糊
          svgInstance.filterWith(function(add) {
            add.gaussianBlur(layer.style.blur.radius);
          });
        } else if (layer.style.blur.type === 3) { // 背景模糊
          svgInstance.css('backdrop-filter', 'blur(' + layer.style.blur.radius + 'px)');
        }
      }
    }
  }

  _computeLayerRotateRange(layer = {}, deg = 0) {
    const height = layer.frame.height;
    const width = layer.frame.width;
    const angle = deg * Math.PI / 180;
    const rangeWidth = Math.abs(height * Math.sin(angle) + width * Math.cos(angle));
    const rangeHeight = Math.abs(height * Math.cos(angle) + width * Math.sin(angle));
    return {
      width: rangeWidth,
      height: rangeHeight,
      left: width - rangeWidth,
      top: height - rangeHeight
    };
  }

  /**
   * 计算layer的可视区
   */
  _computeLayerRange(layer = {}) {
    const range = {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    };
    const frame = layer.frame;
    if (frame.y < 0) {
      range.top = Math.abs(frame.y);
      range.height = frame.height - range.top;
    } else {
      range.top = 0;
      range.height = frame.height;
    }

    if (frame.x < 0) {
      range.left = Math.abs(frame.x);
      range.width = frame.width - range.left;
    } else {
      range.left = 0;
      range.width = frame.width;
    }

    if (frame.width > 375) {
      range.width = 375;
    }

    range.left = parseInt(range.left);
    range.top = parseInt(range.top);
    range.width = parseInt(range.width);
    range.height = parseInt(range.height);

    return range;
  }

  // 判断单个元素是否是svg
  _isShapePathSingle(layer = {}) {
    layer = layer.clone();
    const pathParser = new PathParser(layer, false);
    layer.path = pathParser.parse();
    const styleParser = new StyleParser(layer.style, layer.attributedString, layer);
    layer.styleResult = styleParser.parse();

    // 如果是蒙版
    if (this._isClipPath(layer)) {
      return true;
    }
    if (layer._class === 'shapePath' || layer._class === 'shapeGroup') {
      return true;
    }
    if (layer._class === 'rectangle' || layer._class === 'rect') {
      if (!layer.path) {
        return false;
      }
      if (layer.path.startsWith('M0') && layer.path.endsWith('0Z')) {
        return false;
      }
      return true;
    }
    if (layer._class === 'bitmap') {
      if (layer.styleResult.backgroundColor || layer.styleResult.blendMode) {
        return true;
      }
    }
    // 判断是不是艺术字
    if (this._isWordArt(layer)) {
      return true;
    }
    return false;
  }

  // 是否是svg
  _isShapePath(layer = {}) {
    // 如果是蒙版
    if (this._isClipPath(layer)) {
      this.svgNumber += 100;
      return true;
    }
    if (layer._class === 'symbolInstance' || layer._class === 'bitmap') {
      return true;
    }
    if (layer._class === 'shapePath' || layer._class === 'shapeGroup') {
      return true;
    }
    if (layer._class === 'rectangle' || layer._class === 'rect') {
      layer = layer.clone();
      const pathParser = new PathParser(layer, false);
      layer.path = pathParser.parse();
      if (!layer.path) {
        return false;
      }
      return true;
    }
    if (layer._class === 'oval') {
      return true;
    }
    // 判断是不是艺术字
    if (this._isWordArt(layer)) {
      return true;
    }
    return false;
  }
  // 是否是clip， sketch中的蒙版
  _isClipPath(layer = {}) {
    if (layer.hasClippingMask !== undefined && layer.hasClippingMask === true) { // 有此属性代表是蒙版
      return true;
    }
    return false;
  }

  _borderGradient(style, type = 'border', layer = {}) {
    let gradientDes = null;
    if (type === 'border') {
      if (style.borders) {
        for (const _border of style.borders) {
          if (_border.isEnabled && (_border.fillType === 1 || _border.fillType === 2)) {
            gradientDes = this._getGradientCode(_border, layer);
            break;
          }
        }
      }
    } else if (type === 'fill') {
      if (style.fills) {
        for (const _fill of style.fills) {
          if (_fill.isEnabled) {
            if (_fill.fillType === 1 || _fill.fillType === 2) {
              gradientDes = this._getGradientCode(_fill, layer);
              break;
            } else if (_fill.fillType === 4) {
              // 填充图片
              // patternFillType": 1,//1填充，0平铺
              // "patternTileScale": 1
              gradientDes = {
                img: _fill.image._ref,
                type: _fill.patternFillType// 1填充，0平铺
              };
            }
          }
        }
      }
    }
    return gradientDes;
  }

  _getGradientCode(item, layer = {}) {
    let gradientDes = null;
    if (item.gradient) {
      const gradient = item.gradient;
      const point1 = tools.toPoint(gradient.from, null);
      const point2 = tools.toPoint(gradient.to, null);
      gradientDes = {
        point1: point1,
        point2: point2,
        from: gradient.from,
        to: gradient.to,
        stop: [],
        position: item.position,
        thickness: item.thickness
      };

      for (const item of gradient.stops) {
        gradientDes.stop.push({
          color: tools.colorParser(item.color),
          offset: item.position,
          opacity: 1
        });
      }
    }
    return gradientDes;
  }
};
