// 特征检测
require('colors');
const sql = require('../tools/sql');

module.exports = class {
  constructor(layerResult = []) {
    this.layerResult = JSON.parse(JSON.stringify(layerResult));
    this.insertMany = null;
    this.insertManyData = [];
  }

  format() {
    db.exec('delete from layers');
    const insert = db.prepare('INSERT INTO layers (id,pid,frame,style,[index],tag,className,md5,subClassName,subStyle) VALUES (@id,@pid,@frame,@style,@index,@tag,@className,@md5,@subClassName,@subStyle)');

    // dom结构入库
    this.insertMany = db.transaction((docs) => {
      for (const doc of docs) insert.run(doc);
    });
    this.writeDataBase(this.layerResult[0], {
      id: ''
    }, 0);

    this.insertMany(this.insertManyData);
    sql.updateRunTimeInfoByKey('feature', JSON.stringify(this.layerResult));
    return this.layerResult;
  }

  // dom结构入库
  writeDataBase(layer = {}, parentLayer = {}, index = 0) {
    this.insertManyData.push({
      id: layer.id,
      pid: parentLayer.id,
      frame: JSON.stringify(layer),
      style: layer.classNameSub ? '' : JSON.stringify(layer.style),
      index: index,
      tag: '',
      className: layer.className,
      md5: '', // this._remoteMatch(JSON.stringify(layer), true)
      subClassName: layer.classNameSub || '',
      subStyle: layer.classNameSub ? JSON.stringify(layer.style) : ''
    });

    layer.layers = layer.layers || [];
    for (let i = 0, len = layer.layers.length; i < len; i++) {
      this.writeDataBase(layer.layers[i], layer, i);
    }
  }
};
