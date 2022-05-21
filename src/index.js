/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ParseSketch = require('./parserSketch/layer');
const ParseLayer = require('./parseLayer/index');
// const uniapp = require('./render/uniapp/index');
const RenderMobile = require('./render/mobile/index');

const HtmlDsl = require('./render/base/index.js');

module.exports = class SketchToDsl {
  constructor(sketch = {}, platform = '', artboardName = '') {
    this.sketch = sketch;
    this.artboardName = artboardName;
    this.platform = platform;
  }

  async saveToJson() {
    const pathSrc = yunjin.config.source.path.split('/');
    pathSrc.pop();
    let toPath = pathSrc.join(path.sep) +	path.sep + 'files';
    toPath = yunjin.WORK_RUNTIME_UIDSL;
    fs.ensureDirSync(toPath);
    await this.sketch.saveDir(toPath);
  }

  async parseLayer() {
    try {
      await this.saveToJson();
      const parseSketch = new ParseSketch(this.sketch);
      const artboardList = parseSketch.pageArtboard(this.artboardName);
      for (let i = 0, len = artboardList.length; i < len; i++) {
        const artboardItem = artboardList[i];
        console.log(chalk.green.bold('开始智能编排[' + artboardItem.name + '](' + (i + 1) + '/' + len + ')'));
        yunjin.config.target.artboardName = artboardItem.name.replace(/ /ig, 'nbsp');
        const element = await parseSketch.parse(artboardItem);

        // / / const parseLayer = new ParseLayer(element);
        const parseLayer = new ParseLayer();
        const result = await parseLayer.formatLayers();

        const htmlDsl = new HtmlDsl();
        await htmlDsl.render();

        const spinner = await tools.loading('输出目标页面');
        // html5一定会生成，用来做preview
        const renderMobile = new RenderMobile();
        await renderMobile.render();

        let uniapp = null;
        if (yunjin.config.target.platform === 'h5') {
          uniapp = require('./render/mobile/index');
        } else {
          uniapp = require('./render/uniapp/index');
          const a = new uniapp();
          await a.render();
        }
        spinner.succeed('输出目标页面');
      }
    } catch (e) {
      console.log(e);
    }
  }
};
