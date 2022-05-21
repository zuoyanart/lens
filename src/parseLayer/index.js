/*
 * @Author: 左盐
 * @LastEditors: 左盐
 */

const Style = require('./styleNew');
const sql = require('../tools/sql');
const path = require('path');
const chalk = require('chalk');
const Feature = require('./feature');

module.exports = class {
  constructor(layers = []) {
    this.layerResult = [];
    this.layerList = JSON.parse(sql.getRunTimeInfoByKey('sketchParse').value);
  }

  async formatLayers() {
    const startTime = new Date().getTime();
    const spinner = await tools.loading('智能布局');
    const result = await tools.uploadFile(path.resolve(global.yunjin.WORK_RUNTIME_SNAPSHOT, './' + yunjin.config.target.artboardName + '.png'));
    if (result === false) {
      console.log(chalk.red.bold('文件上传失败'));
      return false;
    }
    const doc = await tools.httpAgent('/api1/lens', 'post', {
      path: result.key,
      layer: this.layerList
    });
    this.layerResult = doc.data;

    // svg to png &  compute style
    const style = new Style(this.layerResult);
    this.layerResult = await style.format();
    spinner.succeed();

    const feature = new Feature(this.layerResult);
    this.layerResult = feature.format();

    const spinner1 = await tools.loading('智能编排');
    spinner1.succeed();
    console.log('执行时间', new Date().getTime() - startTime);
    // throw new Error('asdasd');

    return this.layerResult;
  }
};
