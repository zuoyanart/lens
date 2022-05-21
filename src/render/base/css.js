const LayerText = require('./text');
const LayerBitmap = require('./bitmap');
const LayerRender = require('./layer');

module.exports = class {
  constructor(layer = {}) {
    this.layer = layer;
  }

  getScss() {
    this.format(this.layer[0], null);
    this.cleanCss(this.layer[0]);
    const result = this.jsonToScss();
    return result;
  }

  format(layer = {}, parent) {
    let layers = layer.layers || [];
    layers.sort((a, b) => {
      if (a.classNameSub && b.classNameSub) {
        return 0;
      }
      if (a.classNameSub && !b.classNameSub) {
        return 1;
      }
      if (!a.classNameSub && b.classNameSub) {
        return -1;
      }
    });
    let style = {};
    switch (layer.type) {
      case 'text':
        const layerText = new LayerText(layer, parent);
        style = layerText.getStyle();
        break;
      case 'bitmap': {
        const layerBitmap = new LayerBitmap(layer, parent);
        style = layerBitmap.getStyle();
      }
        break;
      default: {
        const layerRender = new LayerRender(layer, parent);
        style = layerRender.getStyle();
      }
        break;
    }
    layer['.' + (layer.classNameSub || layer.className)] = {
      ...this.formatStyleLowerCase(style),
      layers: layers
    };
    const layerKeys = Object.keys(layer);
    for (let i = 0; i < layerKeys.length; i++) {
      const key = layerKeys[i];
      if (key.startsWith('.')) {
        continue;
      }
      delete layer[key];
    }
    layers = layer[Object.keys(layer)[0]].layers || [];
    for (const item of layers) {
      this.format(item, layer);
    }
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

  cleanCss(layer = {}) {
    let layers = layer[Object.keys(layer)[0]].layers || [];
    if (layers.length === 0) {
      return;
    }
    for (const item of layers) {
      this.cleanCss(item);
    }

    // 清除空余css
    layers = layer[Object.keys(layer)[0]].layers || [];
    for (let i = layers.length - 1; i >= 0; i--) {
      const item = layers[i];
      const keys = Object.keys(item);
      if (keys.length === 0) {
        layers.splice(i, 1);
      }
      if (keys.length === 1) {
        const itemChildKeys = Object.keys(item[keys[0]]);
        if (itemChildKeys.length === 0 || (itemChildKeys.length === 1 && itemChildKeys[0] === 'layers' && item[keys[0]].layers.length === 0)) {
          layers.splice(i, 1);
        }
      }
    }
  }

  jsonToScss() {
    let css = JSON.stringify(this.layer[0])
      .replace(/"&/ig, '&')
      .replace(/"\./ig, '.')
      .replace(/":{/g, '{')
      .replace(/"layers":\[\]/ig, '')
      .replace(/"layers":\[\{/ig, '')
      .replace(/\}]/g, '')
      .replace(/},/g, '}')
      .replace(/}{/g, '')
      .replace(/:(-?\d+(\.\d+)?),/g, ':$1;')
      .replace(/:"(-?\d+(\.\d+)?)px"/g, ':$1px;')
      .replace(/"([a-zA-Z\-]+)":/g, '$1:')
      .replace(/",/g, '";')
      .replace(/;,/g, ';')
      .replace(/"(.+?)";/g, '$1;')
      .replace(/"\}/g, ';}');
    css = css.substring(1, css.length - 1);
    return css;
  }
};
