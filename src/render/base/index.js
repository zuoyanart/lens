/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const LayerRender = require('./layer');
const LayerPath = require('./path');
const LayerType = require('./type');
const LayerText = require('./text');
const LayerBitmap = require('./bitmap');
const beautify = require('simply-beautiful');
const sql = require('../../tools/sql');
const CSS = require('./css');

module.exports = class {
  constructor(layers = '') {
    // fs.writeFileSync(path.resolve(__dirname, '../../../doc/html/index.css'), '');
    sql.updateRunTimeInfoByKey('index.css', '');
    yunjin.indexcss = '';
    // this.layers = JSON.parse(fs.readFileSync(path.resolve(yunjin.ROOT_PATH, './doc/feature.json')).toString());
    this.layers = JSON.parse(sql.getRunTimeInfoByKey('feature').value);

    this.html = `<body id="123456"></body>`;
    this.$ = cheerio.load(this.html);
  }

  async render() {
    const spinner = await tools.loading('DSL生成');
    await this.renderChild(tools.deepClone(this.layers), {
      id: '123456'
    });

    sql.updateRunTimeInfoByKey('index.html', beautify.html(this.$('body').html(), {
      indent_size: 2,
      space_before_conditional: true,
      jslint_happy: true,
      max_char: 0
    }));

    const css = new CSS(tools.deepClone(this.layers));
    const scssCss = css.getScss();
    sql.updateRunTimeInfoByKey('index.css', scssCss);
    spinner.succeed();
  }

  async renderChild(item, parent) {
    if (item) {
      for (let i = 0, len = item.length; i < len; i += 1) {
        const ly = item[i];
        const layerType = new LayerType(ly);
        const type = layerType.checkType();

        const stmt = db.prepare('SELECT * from layers where id=@id;');
        const info = stmt.get({
          id: ly.id
        });
        if (info) {
          ly.className = info.className;
        }

        switch (type) {
          case 'path': {
            const layerPath = new LayerPath(ly, parent, ly.layers);
            this.$(`#${parent.id}`).append(layerPath.getHtml(''));
          }
            break;
          case 'text': {
            const layerText = new LayerText(ly, parent);
            this.$(`#${parent.id}`).append(await layerText.getHtml(''));
          }
            break;
          case 'bitmap': {
            const layerText = new LayerBitmap(ly, parent);
            this.$(`#${parent.id}`).append(await layerText.getHtml(''));
          }
            break;
          default: {
            const layerRender = new LayerRender(ly, parent);
            this.$(`#${parent.id}`).append(await layerRender.getHtml(''));
          }
            break;
        }
      }
      for (const c of item) {
        await this.renderChild(c.layers, c);
      }
    }
  }
};
