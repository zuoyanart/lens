#!/usr/bin/env node
const program = require('commander');
const ns = require('node-sketch');
const SketchToDsl = require('./src/index');
const path = require('path');
const Tools = require('./src/tools');
const process = require('process');

global.yunjin = {
  ROOT_PATH: path.resolve(__dirname, '.'),
  RUNTIME_PATH: path.resolve(__dirname, './.runtime'),
  SRC_PATH: path.resolve(__dirname, './src'),
  WORK_PATH: process.cwd(),
  WORK_RUNTIME_PATH: path.resolve(process.cwd(), './.runtime'), // 运行时
  WORK_RUNTIME_SNAPSHOT: path.resolve(process.cwd(), './.runtime/snapshot'), // 画板png快照路径
  WORK_RUNTIME_UIDSL: path.resolve(process.cwd(), './.runtime/uidsl'), // 画板dsl快照路径
  config: require(path.resolve(__dirname, './.yunjinrc.js'))
};
global.classNameTotal = {};
global.tools = new Tools();
(async() => {
  global.yunjin.config = await global.tools.getConfig('');
})();

const DB = require('better-sqlite3')(path.resolve(yunjin.ROOT_PATH, './db.sqlite3'), { verbose: null });
global.db = DB;

program.version('0.2.0', '-v, --version')
  .command('generate <platform>')
  .alias('g')
  .description('generate mobile html template')
  .action(async(platform) => {
    // console.log('platform',platform,global.tools.getConfig(''));
    const config = global.tools.getConfig();
    if (!config[platform]) {
      console.error('未找到[' + platform + ']相关配置');
      return;
    }
    config.target = config[platform];
    config.target.platform = platform;
    global.yunjin.config = config;
    await tools.sleep(500);
    // return;
    const sketch = await ns.read(path.resolve(yunjin.WORK_PATH, yunjin.config.source.path));
    const sketchToDsl = new SketchToDsl(sketch, yunjin.config.target.platform, yunjin.config.source.artboardName);
    // sketchToDsl.saveToJson();
    sketchToDsl.parseLayer();
  });

program.parse(process.argv);
