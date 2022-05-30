/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */
module.exports = class {
  constructor(style = {}, attributedString = '', layer = {}) {
    this.style = style;
    this.attributedString = attributedString;
    this.layer = layer;
  }

  parse() {
    const result = {};

    if (this.layer.fixedRadius) {
      result.borderRadius = this.layer.fixedRadius;
    }
    if (this.layer.isFlippedHorizontal) {
      result.transform = result.transform || [];
      result.transform.push('rotateY(180deg)');
    }
    if (this.layer.isFlippedVertical) {
      result.transform = result.transform || [];
      result.transform.push('rotateX(180deg)');
    }
    if (this.layer.rotation) {
      result.transform = result.transform || [];
      result.transform.push(`rotate(${-1 * this.layer.rotation}deg)`);
    }

    if (!this.style) return result;
    if (this.style.contextSettings) {
      result.opacity = this.style.contextSettings.opacity;
      result.blendMode = this.style.contextSettings.blendMode;
      if (result.opacity < 0.01) {
        result.opacity = 0;
      } else if (result.opacity === 1) {
        delete result.opacity;
      }
    }

    this.parseBorders(result);
    this.parseFills(result);
    this.parseShadows(result);
    this.parseBackGroundColor(result);
    this.parseText(result);
    return result;
  }

  parseBorders(result = {}) {
    if (this.style.borders) {
      this.style.borders.forEach((_border) => {
        if (_border.isEnabled) {
          if (this.layer._class === 'text') {
            result.textStrokeWidth = _border.thickness;
            result.textStrokeColor = tools.colorParser(_border.color);
          } else {
            result.borderColor = tools.colorParser(_border.color);
            result.borderWidth = _border.thickness;
            result.borderStyle = 'solid';
            result.borderPosition = _border.position;
            result.borderRadius = this.layer.fixedRadius || 0;
            // border 渐变
            // this.parseGradient(_border, result);
          }
        }
      });
    }
    if (!result.borderRadius && this.layer.points) {
      const radius = [];
      for (const item of this.layer.points) {
        radius.push(item.cornerRadius || 0);
      }
      result.borderRadius = radius.join(' ');
    }
  }

  parseFills(result = {}) {
    if (this.style.fills) {
      this.style.fills.forEach((fill) => {
        if (fill.isEnabled) {
          if (fill.image) {
            result.backgroundImage = fill.image._ref;
            result.backgroundRepeat = 'no-repeat';
          }
          if (fill.contextSettings) {
            result.backgroundBlendMode = fill.contextSettings.blendMode || 0;
          }
          if (fill.fillType === 1 || fill.fillType === 2) {
            const {
              gradient
            } = fill;
            const linearGradient = {};
            linearGradient.gradientType = gradient.gradientType;
            const from = tools.toPoint(gradient.from);
            const to = tools.toPoint(gradient.to);
            linearGradient.stops = [];

            let angle = 0;
            angle = linearGradient.angle = Math.atan2((to.y - from.y), to.x - from.x) * 180 / Math.PI;

            if (to.x > from.x && to.y > from.y) { // 第一象限
              angle = linearGradient.angle = angle + 90;
            } else if (to.x > from.x && to.y < from.y) { // 第二象限
              angle = linearGradient.angle = angle + 90;
            } else if (to.x < from.x && to.y > from.y) { // 第三象限
              angle = linearGradient.angle = angle + 90;
            } else {
              angle = linearGradient.angle = angle + 90;
            }
            gradient.stops.forEach((stop) => {
              const hex = tools.colorParser(stop.color);
              const s = {
                color: hex,
                offset: stop.position
              };
              linearGradient.stops.push(s);
            });
            result.linearGradient = linearGradient;
            result.linearGradientString = `linear-gradient(${linearGradient.angle}deg, ${linearGradient.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(',')})`;
          } else if (fill.fillType === 0) { // 纯色填充
            if (this.layer._class === 'text') {
              result.color = tools.colorParser(fill.color);
            } else {
              result.backgroundColor = tools.colorParser(fill.color);
            }
          } else if (fill.fillType === 4) { // 图像填充
            // result.backgroundColor = tools.colorParser(fill.color);
          }
        }
      });
    }
  }

  parseShadows(result = {}) {
    if (this.style.shadows) {
      this.style.shadows.forEach((shadow) => {
        if (shadow.isEnabled) {
          result.boxShadow = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blurRadius}px ${tools.colorParser(shadow.color)}`;
        }
      });
    }
  }

  parseBackGroundColor(result = {}) {
    if (this.layer.backgroundColor && this.layer.hasBackgroundColor) {
      result.backgroundColor = tools.colorParser(this.layer.backgroundColor);
    }
  }

  parseText(result = {}) {
    const textStyle = this.layer.get('textStyle');
    if (this.layer._class === 'text' && textStyle) {
      const opacity = 1;
      const className = this.layer._class;
      if (className === 'text') {
        const layerStyle = this.layer.get('style');
        if (layerStyle) {
          // opacity = layerStyle.contextSettings.opacity;
        }
      }
      let color = textStyle.get('color');
      if (!color) {
        color = {
          red: 0,
          green: 0,
          blue: 0
        };
      }
      color.alpha = color.alpha || opacity;
      const paragraph = textStyle.get('paragraphStyle');
      const font = textStyle.get('fontDescriptor');
      const alignments = ['left', 'right', 'center', 'justify'];

      const {
        attributedString
      } = this.layer;

      textStyle.encodedAttributes.kerning = textStyle.encodedAttributes.kerning || 0;
      result.font = {
        color: tools.colorParser(color),
        textAlign: alignments[paragraph?.alignment || 'left'],
        fontFamily: font.attributes.name,
        fontSize: font.attributes.size,
        lineHeight: paragraph?.maximumLineHeight || 0,
        letterSpacing: parseFloat(textStyle.encodedAttributes.kerning.toFixed(2)),
        fonts: []
      };

      // 处理一段文本有多个样式的情况
      const attributes = this.layer.get('attributedString').getAll('stringAttribute');

      for (const item of attributes) {
        let color = item.get('color');
        if (!color) {
          color = {
            red: 0,
            green: 0,
            blue: 0
          };
        }
        color.alpha = color.alpha || opacity;
        const kerning = item.kerning || 0;
        const paragraph = item.get('paragraphStyle');
        const font = item.get('fontDescriptor');

        result.font.fonts.push({
          color: tools.colorParser(color),
          textAlign: alignments[paragraph?.alignment],
          fontFamily: font.attributes.name,
          fontSize: font.attributes.size,
          lineHeight: paragraph?.maximumLineHeight || 0,
          letterSpacing: parseFloat(kerning.toFixed(2)),
          location: item.location,
          length: item.length
        });
      }
    }
  }
};
